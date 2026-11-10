-- H-068.3: registro de las propiedades publicadas en un portal (hoy, Mercado Libre / Portal Inmobiliario).
--  * portal_listings: una fila por propiedad y portal, con el número del aviso, su enlace y su estado.
--  * Los miembros de la corredora LEEN las de su corredora (para mostrar el enlace y el estado en el catálogo);
--    NADIE escribe desde el navegador: solo las funciones del servidor (clave de servicio) crean y cambian filas.
--  * Si se borra la propiedad o la corredora, se borra el registro (el aviso en el portal no se toca desde aquí).

create table public.portal_listings (
  property_id  uuid not null references public.properties (id) on delete cascade,
  portal       text not null check (portal in ('mercadolibre')),
  tenant_id    uuid not null references public.tenants (id) on delete cascade,
  external_id  text not null check (length(external_id) between 1 and 100),
  permalink    text check (length(permalink) <= 500),
  status       text not null default 'activa' check (status in ('activa', 'pausada', 'cerrada')),
  last_error   text check (length(last_error) <= 300),
  published_at timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (property_id, portal)
);

create index portal_listings_tenant_idx on public.portal_listings (tenant_id);

alter table public.portal_listings enable row level security;

-- Solo lectura para los miembros de la corredora; sin permisos de escritura para nadie con sesión.
revoke all on table public.portal_listings from public, anon, authenticated;
grant select on table public.portal_listings to authenticated;

create policy "portal_listings: los miembros ven los de su corredora"
  on public.portal_listings for select
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = portal_listings.tenant_id and m.user_id = (select auth.uid())
    )
  );
