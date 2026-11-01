-- H-040 (ADR-008): mercado de la corredora y zonas donde trabaja.
--
-- Reglas:
--  * Cada corredora tiene un mercado (paquete de país): por defecto 'cl'. Lo asigna el dueño de la plataforma al crearla.
--  * service_areas guarda los códigos de las áreas donde trabaja (en Chile, regiones ISO 3166-2, p. ej. 'CL-VS').
--    Vacío significa "todo el mercado": las corredoras que ya existen siguen viendo todo, sin cambios.
--  * Solo el administrador de la corredora cambia sus zonas, con la función set_service_areas.
--  * El sitio público (sin sesión) lee solo el mercado y las zonas de su corredora, con get_tenant_public_settings.

alter table public.tenants
  add column market text not null default 'cl'
    check (market ~ '^[a-z]{2}$'),
  add column service_areas text[] not null default '{}'
    check (cardinality(service_areas) <= 40);

create or replace function public.set_service_areas(p_areas text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_clean  text[];
begin
  select m.tenant_id into v_tenant
    from public.memberships m
   where m.user_id = (select auth.uid()) and m.role = 'admin'
   limit 1;
  if v_tenant is null then
    raise exception 'Solo el administrador de la corredora puede cambiar sus zonas de trabajo' using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct a order by a), '{}') into v_clean from unnest(coalesce(p_areas, '{}')) as a;
  if exists (select 1 from unnest(v_clean) as a where a !~ '^[A-Z]{2}-[A-Z0-9]{1,3}$') then
    raise exception 'Código de zona no válido';
  end if;
  if cardinality(v_clean) > 40 then
    raise exception 'Demasiadas zonas';
  end if;

  update public.tenants set service_areas = v_clean where id = v_tenant;
end;
$$;

revoke all on function public.set_service_areas(text[]) from public, anon;
grant execute on function public.set_service_areas(text[]) to authenticated;

-- El sitio público necesita saber en qué mercado y zonas trabaja su corredora para armar el buscador.
-- Solo expone esos dos datos (la política de lectura de tenants sigue limitada a los miembros).
create or replace function public.get_tenant_public_settings(p_tenant uuid)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object('market', t.market, 'service_areas', t.service_areas)
    from public.tenants t
   where t.id = p_tenant
$$;

revoke all on function public.get_tenant_public_settings(uuid) from public;
grant execute on function public.get_tenant_public_settings(uuid) to anon, authenticated;
