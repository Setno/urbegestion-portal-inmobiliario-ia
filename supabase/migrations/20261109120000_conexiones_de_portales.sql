-- H-068.2: conectar la cuenta de la corredora en un portal (hoy, Mercado Libre / Portal Inmobiliario).
--  * portal_connections: guarda los tokens de la cuenta conectada. Es una tabla SOLO DEL SERVIDOR: ni los visitantes ni
--    los usuarios con sesión (ni siquiera el administrador) pueden leerla ni escribirla; solo la clave de servicio
--    (las funciones de api/). Así un token nunca llega al navegador.
--  * portal_connection_status(): lo único que ve el panel: a qué portales está conectada su corredora, con qué cuenta y
--    desde cuándo, sin ningún token. Lo ve cualquier miembro de la corredora.
--  * disconnect_portal(): el administrador borra la conexión de su corredora.

create table public.portal_connections (
  tenant_id     uuid not null references public.tenants (id) on delete cascade,
  portal        text not null check (portal in ('mercadolibre')),
  account_id    text not null check (length(account_id) between 1 and 100),
  access_token  text not null,
  refresh_token text not null,
  expires_at    timestamptz not null,
  connected_at  timestamptz not null default now(),
  connected_by  uuid references auth.users (id) on delete set null,
  last_error    text check (length(last_error) <= 300),
  primary key (tenant_id, portal)
);

alter table public.portal_connections enable row level security;

-- Sin políticas y sin permisos: RLS deja todo cerrado y, además, se quitan los permisos de la tabla.
revoke all on table public.portal_connections from public, anon, authenticated;

create or replace function public.portal_connection_status(p_tenant uuid)
returns table (portal text, account_id text, connected_at timestamptz, last_error text)
language sql
security definer
stable
set search_path = public
as $$
  select c.portal, c.account_id, c.connected_at, c.last_error
    from public.portal_connections c
   where c.tenant_id = p_tenant
     and exists (select 1 from public.memberships m where m.tenant_id = p_tenant and m.user_id = (select auth.uid()));
$$;

revoke all on function public.portal_connection_status(uuid) from public, anon;
grant execute on function public.portal_connection_status(uuid) to authenticated;

create or replace function public.disconnect_portal(p_tenant uuid, p_portal text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_tenant_admin(p_tenant);
  delete from public.portal_connections where tenant_id = p_tenant and portal = p_portal;
end;
$$;

revoke all on function public.disconnect_portal(uuid, text) from public, anon;
grant execute on function public.disconnect_portal(uuid, text) to authenticated;
