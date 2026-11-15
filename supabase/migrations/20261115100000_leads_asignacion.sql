-- H-069.1: asignación de leads a mano.
-- 1. Cada lead puede tener un responsable (`assigned_to`), que tiene que ser miembro de la misma corredora.
-- 2. El administrador asigna a cualquier miembro; un agente solo toma un lead sin responsable para sí o suelta el suyo.
--    El servidor (sin usuario, clave de servicio) puede asignar a cualquier miembro: lo usará el reparto automático (H-069.2).
-- 3. `team_members(p_tenant)` deja ver el equipo de la corredora (id, correo y rol) a sus miembros, sin abrir `memberships`
--    ni `auth.users`, que siguen mostrando a cada uno solo lo propio.
-- La visibilidad de los leads no cambia (decisión del 2026-11-15): todos los miembros siguen viendo todos los de su corredora.

alter table public.leads
  add column assigned_to uuid references auth.users (id) on delete set null;

create index leads_tenant_assigned_idx on public.leads (tenant_id, assigned_to);

create function public.leads_check_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  -- Nada que revisar: el responsable no cambia, o un lead nuevo llega sin responsable (las políticas de la tabla deciden el resto).
  if tg_op = 'UPDATE' and new.assigned_to is not distinct from old.assigned_to then
    return new;
  end if;
  if tg_op = 'INSERT' and new.assigned_to is null then
    return new;
  end if;

  -- Con sesión: quien no es de la corredora recibe el mismo rechazo que le daría la política de la tabla,
  -- antes de mirar al responsable, para no revelar quién es miembro de qué corredora.
  if v_uid is not null and not exists (
    select 1 from public.memberships m
    where m.tenant_id = new.tenant_id and m.user_id = v_uid
  ) then
    raise exception 'Sin permiso sobre los leads de esta corredora' using errcode = '42501';
  end if;

  if new.assigned_to is not null and not exists (
    select 1 from public.memberships m
    where m.tenant_id = new.tenant_id and m.user_id = new.assigned_to
  ) then
    raise exception 'El responsable tiene que ser miembro de la corredora' using errcode = '23514';
  end if;

  if v_uid is null then
    return new;
  end if;

  if exists (
    select 1 from public.memberships m
    where m.tenant_id = new.tenant_id and m.user_id = v_uid and m.role = 'admin'
  ) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.assigned_to = v_uid then
      return new;
    end if;
  else
    if old.assigned_to is null and new.assigned_to = v_uid then
      return new;
    end if;
    if old.assigned_to = v_uid and new.assigned_to is null then
      return new;
    end if;
  end if;

  -- Código propio (no 42501): la consola entiende 42501 como "sesión de otra corredora" y reintentaría como visitante.
  raise exception 'Solo el administrador asigna leads a otros miembros' using errcode = 'P0001';
end;
$$;

revoke all on function public.leads_check_assignment() from public, anon, authenticated;

create trigger leads_assignment_check
  before insert or update of assigned_to on public.leads
  for each row execute function public.leads_check_assignment();

create function public.team_members(p_tenant uuid)
returns table (user_id uuid, email text, role text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id, u.email::text, m.role
  from public.memberships m
  join auth.users u on u.id = m.user_id
  where m.tenant_id = p_tenant
    and exists (
      select 1 from public.memberships me
      where me.tenant_id = p_tenant and me.user_id = (select auth.uid())
    )
  order by u.email;
$$;

revoke all on function public.team_members(uuid) from public, anon;
grant execute on function public.team_members(uuid) to authenticated;
