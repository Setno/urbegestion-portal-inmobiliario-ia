-- H-043.2 (ADR-009): derechos de cada corredora según lo que dispone el proyecto de ventas, y métricas agregadas para ventas.
--  * tenant_entitlements: plan, estado de la suscripción, funciones prendidas y cupos. Solo la clave de servicio escribe
--    (el endpoint firmado api/platform/tenant-sync); los miembros de la corredora solo leen lo suyo.
--  * platform_metrics(): números agregados por corredora (sin contenido de leads ni de propiedades). Solo la clave de
--    servicio puede ejecutarla (el endpoint api/platform/metrics).
-- Agregar variables nuevas al contrato NO requiere migraciones: viven como JSON en `features` y `limits`.

create table public.tenant_entitlements (
  tenant_id          uuid primary key references public.tenants (id) on delete cascade,
  tenant_ref         text unique,
  plan_code          text,
  status             text not null default 'active'
    check (status in ('trial', 'active', 'past_due', 'suspended', 'cancelled')),
  trial_ends_at      timestamptz,
  grace_ends_at      timestamptz,
  features           jsonb not null default '{}'::jsonb check (jsonb_typeof(features) = 'object'),
  limits             jsonb not null default '{}'::jsonb check (jsonb_typeof(limits) = 'object'),
  contract_version   integer not null default 1,
  -- Fecha del mensaje de ventas: un mensaje más antiguo que este no se aplica (orden e idempotencia)
  source_updated_at  timestamptz not null default now(),
  received_at        timestamptz not null default now()
);

alter table public.tenant_entitlements enable row level security;

-- Los miembros de la corredora leen sus propios derechos (el panel los aplica); nadie escribe desde la aplicación.
create policy "tenant_entitlements: ver los de mi corredora"
  on public.tenant_entitlements for select
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = tenant_entitlements.tenant_id and m.user_id = (select auth.uid())
    )
  );

-- Métricas agregadas por corredora para el proyecto de ventas. Solo cantidades y fechas.
create or replace function public.platform_metrics()
returns table (
  tenant_id             uuid,
  name                  text,
  agents_count          integer,
  properties_total      integer,
  properties_published  integer,
  leads_30d             integer,
  leads_total           integer,
  last_login_at         timestamptz,
  last_activity_at      timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    t.id,
    t.name,
    (select count(*)::int from public.memberships m where m.tenant_id = t.id),
    (select count(*)::int from public.properties p where p.tenant_id = t.id),
    (select count(*)::int from public.properties p where p.tenant_id = t.id and p.publication_status = 'publicada'),
    (select count(*)::int from public.leads l where l.tenant_id = t.id and l.created_at >= now() - interval '30 days'),
    (select count(*)::int from public.leads l where l.tenant_id = t.id),
    (select max(u.last_sign_in_at) from public.memberships m join auth.users u on u.id = m.user_id where m.tenant_id = t.id),
    greatest(
      (select max(l.created_at) from public.leads l where l.tenant_id = t.id),
      (select max(p.updated_at) from public.properties p where p.tenant_id = t.id),
      (select max(u.last_sign_in_at) from public.memberships m join auth.users u on u.id = m.user_id where m.tenant_id = t.id)
    )
  from public.tenants t
  order by t.name;
$$;

revoke all on function public.platform_metrics() from public, anon, authenticated;
grant execute on function public.platform_metrics() to service_role;
