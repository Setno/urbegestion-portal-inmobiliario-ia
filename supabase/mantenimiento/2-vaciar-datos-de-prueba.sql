-- PASO 2 de 2 · Vaciar los datos de prueba para dejar la base lista como "CRM producción".
-- No es una migración: se pega a mano en el Editor SQL de Supabase, y SOLO en el proyecto que será producción.
--
-- ⚠ BORRA DATOS. No se puede deshacer una vez confirmado.
-- Por seguridad, el script termina en ROLLBACK: al ejecutarlo se hace todo, se muestra el resultado
-- y se DESHACE. Revisa el resultado; si es el esperado, cambia la última línea de "rollback;" a "commit;"
-- y ejecútalo otra vez. Hazlo con un respaldo reciente (Database → Backups) y cuando estés seguro del proyecto.
--
-- Qué borra:
--   · todas las corredoras y, en cascada, sus membresías, propiedades, leads, historiales, derechos,
--     textos, direcciones del sitio y avisos;
--   · todos los usuarios de Authentication, EXCEPTO los correos que escribas abajo.
-- Qué NO toca:
--   · las tablas, funciones y políticas (las migraciones);
--   · los secretos del Vault (por ejemplo lead_alert_url: revísalo aparte, debe apuntar a las funciones de producción);
--   · los archivos de Storage (las fotos): bórralos desde Storage → property-images → seleccionar todo → Delete.
--     Borrarlos por SQL deja los archivos huérfanos, por eso no se hace aquí.

begin;

-- 1) Correos que se CONSERVAN (el dueño de la plataforma). Cambia el ejemplo por el tuyo.
--    Mientras diga "cambiar@ejemplo.com" el script se detiene.
create temp table _conservar (email text primary key) on commit drop;
insert into _conservar (email) values
  ('cambiar@ejemplo.com');
  -- , ('otro-correo-a-conservar@ejemplo.com')

do $$
begin
  if exists (select 1 from _conservar where email = 'cambiar@ejemplo.com') then
    raise exception 'Escribe tu correo en la lista "_conservar" antes de ejecutar este script.';
  end if;
  if (select count(*) from auth.users u join _conservar c on lower(u.email) = lower(c.email)) = 0 then
    raise exception 'Ninguno de los correos de "_conservar" existe en auth.users: se detiene para no dejarte sin acceso.';
  end if;
end $$;

-- 2) Borrar corredoras (en cascada se van sus datos).
delete from public.tenants;

-- 3) Borrar usuarios que no estén en la lista de conservados.
delete from auth.users u
where not exists (select 1 from _conservar c where lower(c.email) = lower(u.email));

-- 4) Resultado: todo en 0, y solo tus usuarios.
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
union all select 'usuarios conservados',       count(*) from auth.users
union all select 'archivos en Storage (borrar a mano)', count(*) from storage.objects
order by 1;

-- 5) Cambia "rollback;" por "commit;" SOLO cuando el resultado de arriba sea el esperado.
rollback;
