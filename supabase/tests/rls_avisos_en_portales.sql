-- Prueba de seguridad de los avisos publicados en portales (H-068.3).
-- Se ejecuta DESPUÉS de aplicar la migración 20261109130000, en el proyecto de DESARROLLO.
-- Termina SIEMPRE con un "error" para que Postgres deshaga todo:
--   * "RLS OK ..." = todas las comprobaciones pasaron (es el resultado esperado).
--   * "FALLO: ..." = algo está mal; el mensaje dice qué regla se rompió.

insert into auth.users (id, instance_id, aud, role, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-admin-a@ejemplo.test'),
  ('cccccccc-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-agente-a@ejemplo.test'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-admin-b@ejemplo.test');

insert into public.tenants (id, name) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Corredora A (prueba RLS)'),
  ('b2b2b2b2-0000-0000-0000-0000000000b2', 'Corredora B (prueba RLS)');

insert into public.memberships (tenant_id, user_id, role) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-00000000000a', 'admin'),
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'cccccccc-0000-0000-0000-00000000000c', 'agente'),
  ('b2b2b2b2-0000-0000-0000-0000000000b2', 'bbbbbbbb-0000-0000-0000-00000000000b', 'admin');

insert into public.properties (id, tenant_id, title, operation, property_type, price_amount, commune) values
  ('a0a0a0a0-0000-0000-0000-0000000000a0', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Casa A', 'venta', 'casa', 1000, 'Ñuñoa'),
  ('b0b0b0b0-0000-0000-0000-0000000000b0', 'b2b2b2b2-0000-0000-0000-0000000000b2', 'Casa B', 'venta', 'casa', 1000, 'Ñuñoa');

-- Como lo haría el servidor (clave de servicio)
insert into public.portal_listings (property_id, portal, tenant_id, external_id, permalink) values
  ('a0a0a0a0-0000-0000-0000-0000000000a0', 'mercadolibre', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'MLC-A', 'https://casa.mercadolibre.cl/MLC-A'),
  ('b0b0b0b0-0000-0000-0000-0000000000b0', 'mercadolibre', 'b2b2b2b2-0000-0000-0000-0000000000b2', 'MLC-B', 'https://casa.mercadolibre.cl/MLC-B');

-- 1. Un visitante no ve nada -----------------------------------------------------------------------
set local role anon;
do $$
begin
  begin
    perform 1 from public.portal_listings;
    raise exception 'FALLO: un visitante pudo leer los avisos de portales';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 2. Administrador y agente ven solo los de su corredora ------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
declare
  v_filas int;
begin
  select count(*) into v_filas from public.portal_listings;
  if v_filas <> 1 then
    raise exception 'FALLO: el administrador debía ver 1 aviso (el suyo) y vio %', v_filas;
  end if;
  if exists (select 1 from public.portal_listings where external_id = 'MLC-B') then
    raise exception 'FALLO: el administrador vio el aviso de otra corredora';
  end if;
end $$;

select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}', true);
do $$
declare
  v_filas int;
begin
  select count(*) into v_filas from public.portal_listings;
  if v_filas <> 1 then
    raise exception 'FALLO: el agente debía ver 1 aviso (el de su corredora) y vio %', v_filas;
  end if;
end $$;

-- 3. Nadie con sesión escribe: ni insertar, ni cambiar, ni borrar -----------------------------------
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  begin
    insert into public.portal_listings (property_id, portal, tenant_id, external_id)
    values ('a0a0a0a0-0000-0000-0000-0000000000a0', 'mercadolibre', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'FALSO');
    raise exception 'FALLO: el administrador insertó un aviso desde el navegador';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.portal_listings set external_id = 'ROBADO';
    raise exception 'FALLO: el administrador cambió un aviso desde el navegador';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.portal_listings;
    raise exception 'FALLO: el administrador borró avisos desde el navegador';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 4. Al borrar la propiedad se borra su registro ----------------------------------------------------
delete from public.properties where id = 'a0a0a0a0-0000-0000-0000-0000000000a0';
do $$
begin
  if exists (select 1 from public.portal_listings where external_id = 'MLC-A') then
    raise exception 'FALLO: el registro del aviso sobrevivió a la propiedad borrada';
  end if;
  if not exists (select 1 from public.portal_listings where external_id = 'MLC-B') then
    raise exception 'FALLO: se borró el registro de otra corredora';
  end if;
  raise exception 'RLS OK: los avisos de portales son de lectura para su corredora y de escritura solo del servidor';
end $$;
