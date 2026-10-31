-- H-009.2 y H-009.3: propiedades (catálogo) y leads (CRM), cada fila de una corredora (tenant_id) con RLS.
-- Reglas:
--   * El catálogo es público: cualquiera (incluso sin sesión) puede LEER propiedades; solo miembros de la corredora las escriben.
--   * Los leads son privados: solo los miembros de la corredora los leen y modifican.
--   * Las visitas del sitio (sin sesión) pueden CREAR un lead nuevo, pero nunca leer ninguno.
--   * Borrar propiedades o leads es solo del rol admin.

create table public.properties (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null references public.tenants (id) on delete cascade,
  title                text not null,
  operation            text not null check (operation in ('venta', 'arriendo')),
  property_type        text not null check (property_type in ('departamento', 'casa', 'parcela_agricola', 'oficina_comercial', 'terreno')),
  price_uf             numeric(12, 2) not null check (price_uf >= 0),
  price_clp            bigint,
  commune              text not null,
  address              text not null default '',
  bedrooms             integer not null default 0,
  bathrooms            integer not null default 0,
  built_area_m2        numeric(10, 2) not null default 0,
  total_area_m2        numeric(10, 2) not null default 0,
  parking_spots        integer not null default 0,
  storage_units        integer not null default 0,
  featured             boolean not null default false,
  status               text not null default 'disponible' check (status in ('disponible', 'reservada', 'vendida', 'arrendada')),
  images               text[] not null default '{}',
  video_url            text,
  description          text not null default '',
  features             text[] not null default '{}',
  virtual_tour_url     text,
  expenses_monthly_clp bigint,
  map_query            text,
  lat                  double precision,
  lng                  double precision,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index properties_tenant_status_idx on public.properties (tenant_id, status);

create table public.leads (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants (id) on delete cascade,
  full_name          text not null,
  email              text not null default '',
  phone              text not null default '',
  property_id        uuid references public.properties (id) on delete set null,
  property_title     text,
  operation_interest text not null check (operation_interest in ('compra', 'arriendo', 'venta_propietario', 'otro')),
  budget_amount      numeric(14, 2),
  budget_currency    text check (budget_currency in ('UF', 'CLP')),
  mortgage_status    text check (mortgage_status in ('al_contado', 'pre_aprobado', 'en_tramite', 'sin_evaluar')),
  target_move_date   text check (target_move_date in ('inmediato', '1_a_3_meses', 'mas_de_3_meses')),
  status             text not null default 'nuevo' check (status in ('nuevo', 'contactado', 'visita_agendada', 'en_negociacion', 'cerrado', 'descartado')),
  appointment_date   date,
  appointment_time   text,
  notes              text[] not null default '{}',
  source             text not null check (source in ('asistente_ia', 'ficha_propiedad', 'formulario_contacto', 'captacion_propietarios')),
  attachments        text[] not null default '{}',
  property_specs     jsonb,
  created_at         timestamptz not null default now()
);

create index leads_tenant_status_idx on public.leads (tenant_id, status);
create index leads_tenant_created_idx on public.leads (tenant_id, created_at desc);

alter table public.properties enable row level security;
alter table public.leads      enable row level security;

-- Propiedades ---------------------------------------------------------------

create policy "properties: catálogo público de lectura"
  on public.properties for select
  to anon, authenticated
  using (true);

create policy "properties: crear en mi corredora"
  on public.properties for insert
  to authenticated
  with check (
    exists (select 1 from public.memberships m
            where m.tenant_id = properties.tenant_id and m.user_id = (select auth.uid()))
  );

create policy "properties: editar en mi corredora"
  on public.properties for update
  to authenticated
  using (
    exists (select 1 from public.memberships m
            where m.tenant_id = properties.tenant_id and m.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.memberships m
            where m.tenant_id = properties.tenant_id and m.user_id = (select auth.uid()))
  );

create policy "properties: borrar solo admin"
  on public.properties for delete
  to authenticated
  using (
    exists (select 1 from public.memberships m
            where m.tenant_id = properties.tenant_id and m.user_id = (select auth.uid()) and m.role = 'admin')
  );

-- Leads ---------------------------------------------------------------------

-- Las visitas del sitio crean leads nuevos; no pueden leerlos ni cambiarlos.
create policy "leads: el sitio puede crear un lead nuevo"
  on public.leads for insert
  to anon, authenticated
  with check (status = 'nuevo');

create policy "leads: ver los de mi corredora"
  on public.leads for select
  to authenticated
  using (
    exists (select 1 from public.memberships m
            where m.tenant_id = leads.tenant_id and m.user_id = (select auth.uid()))
  );

create policy "leads: editar los de mi corredora"
  on public.leads for update
  to authenticated
  using (
    exists (select 1 from public.memberships m
            where m.tenant_id = leads.tenant_id and m.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.memberships m
            where m.tenant_id = leads.tenant_id and m.user_id = (select auth.uid()))
  );

create policy "leads: borrar solo admin"
  on public.leads for delete
  to authenticated
  using (
    exists (select 1 from public.memberships m
            where m.tenant_id = leads.tenant_id and m.user_id = (select auth.uid()) and m.role = 'admin')
  );
