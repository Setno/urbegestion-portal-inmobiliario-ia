-- H-057: historial de contacto de cada lead (llamadas, WhatsApp, correos, visitas, notas y cambios de etapa).
-- Tabla propia: las notas actuales (arreglo dentro del lead, tope de 20) siguen donde están.
-- El historial solo se agrega: no hay políticas de edición ni de borrado (borrar el lead lo borra en cascada).
create table public.lead_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  kind text not null check (kind in ('llamada', 'whatsapp', 'correo', 'visita', 'nota', 'estado')),
  text text not null check (char_length(text) between 1 and 2000),
  occurred_at timestamptz not null default now(),
  author_email text not null default '',
  created_at timestamptz not null default now()
);

create index lead_events_lead_idx on public.lead_events (lead_id, occurred_at desc);

-- El autor y la fecha de registro los pone siempre la base, aunque el navegador mande otros valores:
-- nadie puede firmar a nombre de otro. La fecha del contacto no puede estar en el futuro (se corrige a ahora).
create function public.lead_events_set_server_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.author_email := coalesce(auth.jwt() ->> 'email', '');
  new.created_at := now();
  if new.occurred_at is null or new.occurred_at > now() + interval '5 minutes' then
    new.occurred_at := now();
  end if;
  return new;
end;
$$;

create trigger lead_events_server_fields
  before insert on public.lead_events
  for each row execute function public.lead_events_set_server_fields();

alter table public.lead_events enable row level security;

create policy "lead_events: ver los de mi corredora"
  on public.lead_events for select
  to authenticated
  using (
    exists (select 1 from public.memberships m
            where m.tenant_id = lead_events.tenant_id and m.user_id = (select auth.uid()))
  );

-- El evento debe pertenecer a un lead de la misma corredora.
create policy "lead_events: agregar a los leads de mi corredora"
  on public.lead_events for insert
  to authenticated
  with check (
    exists (select 1 from public.memberships m
            where m.tenant_id = lead_events.tenant_id and m.user_id = (select auth.uid()))
    and exists (select 1 from public.leads l
                where l.id = lead_events.lead_id and l.tenant_id = lead_events.tenant_id)
  );
