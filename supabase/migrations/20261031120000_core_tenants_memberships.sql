-- H-008.3: corredoras (tenants) y membresías (usuario + corredora + rol), con seguridad por fila (RLS).
-- Convención para todas las tablas futuras: llevan `tenant_id uuid not null references public.tenants(id)`
-- y una política RLS que limita el acceso a las corredoras del usuario (ver `memberships`).

create table public.tenants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null check (role in ('admin', 'agente')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index memberships_user_id_idx on public.memberships (user_id);

alter table public.tenants     enable row level security;
alter table public.memberships enable row level security;

-- Cada usuario ve solo sus propias membresías.
create policy "memberships: ver las propias"
  on public.memberships for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Cada usuario ve solo las corredoras a las que pertenece.
create policy "tenants: ver las propias"
  on public.tenants for select
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = tenants.id and m.user_id = (select auth.uid())
    )
  );

-- No hay políticas de insert/update/delete: desde la aplicación nadie puede crear ni cambiar corredoras
-- ni membresías. Se hacen con el SQL Editor o con la clave de servicio en el servidor (H-008.5 y H-008.7).
