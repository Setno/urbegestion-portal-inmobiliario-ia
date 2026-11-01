-- H-037 (flujo de aprobación de publicaciones) y H-038 (de lead de propietario a propiedad).
-- BORRADOR: pendiente de aprobación del responsable.
--
-- Reglas:
--  * Una propiedad tiene un estado de publicación: borrador, en_revision, publicada o rechazada.
--  * El sitio público solo ve las publicadas. Los miembros de la corredora ven todas las suyas.
--  * Cada corredora elige cómo publica (tenants.publication_mode):
--      'con_aprobacion' (por defecto): el agente crea en borrador y envía a revisión; solo el administrador
--        publica o rechaza (con motivo). Si un agente cambia una propiedad ya publicada, vuelve a revisión.
--      'directa': cada agente publica lo suyo y responde por ello (queda registrado quién y cuándo).
--  * El administrador siempre puede publicar, editar y borrar cualquier propiedad, en ambos modos.
--  * Solo el administrador cambia el modo, con la función set_publication_mode.
--  * Quién creó, quién aprobó y cuándo lo fija la base (disparador); el cliente no puede falsearlo.
--  * Cada cambio queda en un registro de eventos (trazabilidad).
--  * Las propiedades que ya existen quedan "publicada".

alter table public.properties
  add column publication_status text not null default 'publicada'
    check (publication_status in ('borrador', 'en_revision', 'publicada', 'rechazada')),
  add column created_by       uuid references auth.users (id) on delete set null,
  add column updated_by       uuid references auth.users (id) on delete set null,
  add column approved_by      uuid references auth.users (id) on delete set null,
  add column approved_at      timestamptz,
  add column rejection_reason text;

-- Modo de publicación de cada corredora (la lectura ya la cubre la política "tenants: ver las propias").
alter table public.tenants
  add column publication_mode text not null default 'con_aprobacion'
    check (publication_mode in ('con_aprobacion', 'directa'));

-- Solo el administrador de su corredora cambia el modo (los usuarios no tienen permiso de escritura sobre tenants).
create or replace function public.set_publication_mode(p_mode text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
begin
  if p_mode not in ('con_aprobacion', 'directa') then
    raise exception 'Modo de publicación no válido';
  end if;
  select m.tenant_id into v_tenant
    from public.memberships m
   where m.user_id = (select auth.uid()) and m.role = 'admin'
   limit 1;
  if v_tenant is null then
    raise exception 'Solo el administrador de la corredora puede cambiar el modo de publicación' using errcode = '42501';
  end if;
  update public.tenants set publication_mode = p_mode where id = v_tenant;
end;
$$;

revoke all on function public.set_publication_mode(text) from public, anon;
grant execute on function public.set_publication_mode(text) to authenticated;

-- Lectura: el sitio solo ve lo publicado; los miembros de la corredora ven todo lo suyo.
drop policy "properties: catálogo público de lectura" on public.properties;

create policy "properties: catálogo público (solo publicadas)"
  on public.properties for select
  to anon, authenticated
  using (publication_status = 'publicada');

create policy "properties: ver todas las de mi corredora"
  on public.properties for select
  to authenticated
  using (
    exists (select 1 from public.memberships m
            where m.tenant_id = properties.tenant_id and m.user_id = (select auth.uid()))
  );

-- Registro de eventos de cada publicación (solo lo escribe el disparador).
create table public.property_events (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  action      text not null,
  actor       uuid references auth.users (id) on delete set null,
  note        text,
  created_at  timestamptz not null default now()
);
create index property_events_property_idx on public.property_events (property_id, created_at);

alter table public.property_events enable row level security;

create policy "property_events: ver los de mi corredora"
  on public.property_events for select
  to authenticated
  using (
    exists (select 1 from public.memberships m
            where m.tenant_id = property_events.tenant_id and m.user_id = (select auth.uid()))
  );

-- Antes de guardar: aplica las reglas del flujo y fija quién y cuándo.
create or replace function public.properties_workflow()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid       uuid := (select auth.uid());
  v_publisher boolean;
begin
  -- Publica quien es administrador, o cualquier agente si la corredora publica directo.
  -- Sin usuario (SQL Editor o servicio) se trata como publicador: así funcionan los datos de ejemplo.
  v_publisher := v_uid is null or exists (
    select 1
      from public.memberships m
      join public.tenants t on t.id = m.tenant_id
     where m.tenant_id = new.tenant_id
       and m.user_id = v_uid
       and (m.role = 'admin' or t.publication_mode = 'directa')
  );

  if tg_op = 'INSERT' then
    new.created_by := v_uid;
    new.updated_by := v_uid;
    if not v_publisher and new.publication_status not in ('borrador', 'en_revision') then
      new.publication_status := 'borrador';
    end if;
    new.approved_by := null;
    new.approved_at := null;
    new.rejection_reason := null;
    if new.publication_status = 'publicada' then
      new.approved_by := v_uid;
      new.approved_at := now();
    end if;
    return new;
  end if;

  -- UPDATE
  new.created_by := old.created_by;
  new.updated_by := v_uid;

  if v_publisher then
    if new.publication_status = 'publicada' and old.publication_status <> 'publicada' then
      new.approved_by := v_uid;
      new.approved_at := now();
      new.rejection_reason := null;
    elsif new.publication_status = 'publicada' then
      new.approved_by := old.approved_by;
      new.approved_at := old.approved_at;
      new.rejection_reason := null;
    elsif new.publication_status = 'rechazada' then
      if coalesce(btrim(new.rejection_reason), '') = '' then
        raise exception 'Rechazar una publicación exige indicar el motivo';
      end if;
      new.approved_by := null;
      new.approved_at := null;
    else
      new.approved_by := null;
      new.approved_at := null;
      new.rejection_reason := null;
    end if;
  else
    -- El proponente (agente con aprobación) solo puede dejar borrador o enviar a revisión.
    if new.publication_status not in ('borrador', 'en_revision') then
      new.publication_status := case when old.publication_status = 'publicada' then 'en_revision' else old.publication_status end;
    end if;
    new.approved_by := null;
    new.approved_at := null;
    new.rejection_reason := case when new.publication_status = 'rechazada' then old.rejection_reason else null end;
  end if;
  return new;
end;
$$;

create trigger properties_workflow_before
  before insert or update on public.properties
  for each row execute function public.properties_workflow();

-- Después de guardar: deja el evento en el registro. Corre con permisos propios para poder escribir.
create or replace function public.properties_log_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
  v_note   text;
begin
  if tg_op = 'INSERT' then
    v_action := case new.publication_status when 'publicada' then 'publicada' when 'en_revision' then 'enviada_a_revision' else 'creada' end;
  elsif new.publication_status is distinct from old.publication_status then
    v_action := case new.publication_status
      when 'en_revision' then 'enviada_a_revision'
      when 'publicada' then 'aprobada'
      when 'rechazada' then 'rechazada'
      else 'vuelta_a_borrador' end;
    if new.publication_status = 'rechazada' then v_note := new.rejection_reason; end if;
  else
    v_action := 'editada';
  end if;

  insert into public.property_events (property_id, tenant_id, action, actor, note)
  values (new.id, new.tenant_id, v_action, (select auth.uid()), v_note);
  return null;
end;
$$;

revoke all on function public.properties_log_event() from public, anon, authenticated;

create trigger properties_log_event_after
  after insert or update on public.properties
  for each row execute function public.properties_log_event();

-- H-038: vínculo entre un lead de propietario y la propiedad en borrador creada a partir de él.
alter table public.leads
  add column converted_property_id uuid references public.properties (id) on delete set null;
