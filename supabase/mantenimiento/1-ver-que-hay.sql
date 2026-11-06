-- PASO 1 de 2 · Ver qué hay en la base (SOLO LECTURA, no cambia nada).
-- No es una migración: se pega a mano en el Editor SQL de Supabase.
-- Úsalo en el proyecto que será "CRM producción" ANTES de vaciarlo, y de nuevo DESPUÉS, para comprobar el resultado.
-- Guía completa: docs/guia-produccion.md, sección 1.

-- A) Migraciones aplicadas (el repositorio tiene 27; la última es 20261105100000).
select count(*) as migraciones_registradas,
       max(version) as ultima_version
from supabase_migrations.schema_migrations;
-- Si "migraciones_registradas" da 0 porque las pegaste a mano en el editor, no es un error:
-- mira el bloque B, que comprueba que las tablas existan.

-- B) Tablas esperadas (deben aparecer las 10).
select t.nombre as tabla, (to_regclass('public.' || t.nombre) is not null) as existe
from (values ('tenants'), ('memberships'), ('properties'), ('leads'), ('property_events'),
             ('lead_events'), ('tenant_entitlements'), ('site_content'), ('site_addresses'),
             ('lead_alert_settings')) as t(nombre)
order by t.nombre;

-- C) Cuántos datos hay hoy (en un proyecto limpio todo debe dar 0, salvo tus usuarios).
select 'corredoras (tenants)'        as dato, count(*) as filas from public.tenants
union all select 'membresías',                 count(*) from public.memberships
union all select 'propiedades',                count(*) from public.properties
union all select 'leads',                      count(*) from public.leads
union all select 'historial de leads',         count(*) from public.lead_events
union all select 'historial de propiedades',   count(*) from public.property_events
union all select 'derechos por corredora',     count(*) from public.tenant_entitlements
union all select 'textos del sitio',           count(*) from public.site_content
union all select 'direcciones del sitio',      count(*) from public.site_addresses
union all select 'avisos de leads',            count(*) from public.lead_alert_settings
union all select 'usuarios (auth.users)',      count(*) from auth.users
union all select 'archivos en Storage',        count(*) from storage.objects
order by 1;

-- D) Corredoras y usuarios existentes, para decidir qué conservar.
select 'corredora' as tipo, name as detalle, created_at from public.tenants
union all
select 'usuario', email, created_at from auth.users
order by tipo, created_at;
