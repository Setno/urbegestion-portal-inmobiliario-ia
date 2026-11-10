-- Prueba de seguridad de las conexiones de portales (H-068.2).
-- Se ejecuta DESPUÉS de aplicar la migración 20261109120000, en el proyecto de DESARROLLO.
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

-- Como lo haría el servidor (clave de servicio): conecta a las dos corredoras
insert into public.portal_connections (tenant_id, portal, account_id, access_token, refresh_token, expires_at) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'mercadolibre', '111', 'TOKEN-A', 'REFRESCO-A', now() + interval '6 hours'),
  ('b2b2b2b2-0000-0000-0000-0000000000b2', 'mercadolibre', '222', 'TOKEN-B', 'REFRESCO-B', now() + interval '6 hours');

-- 1. Un visitante no ve ni escribe nada ---------------------------------------------------------------
set local role anon;
do $$
begin
  begin
    perform 1 from public.portal_connections;
    raise exception 'FALLO: un visitante pudo leer las conexiones';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.portal_connection_status('a1a1a1a1-0000-0000-0000-0000000000a1');
    raise exception 'FALLO: un visitante pudo pedir el estado de las conexiones';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.disconnect_portal('a1a1a1a1-0000-0000-0000-0000000000a1', 'mercadolibre');
    raise exception 'FALLO: un visitante pudo desconectar un portal';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 2. El administrador y el agente NO leen la tabla (los tokens no llegan al navegador) -----------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
declare
  v_filas int;
begin
  begin
    perform 1 from public.portal_connections;
    raise exception 'FALLO: el administrador pudo leer la tabla de tokens';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.portal_connections set access_token = 'robado';
    raise exception 'FALLO: el administrador pudo cambiar un token';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.portal_connections (tenant_id, portal, account_id, access_token, refresh_token, expires_at)
    values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'mercadolibre', '999', 'x', 'y', now());
    raise exception 'FALLO: el administrador pudo escribir en la tabla de tokens';
  exception when insufficient_privilege then null;
  end;

  -- El estado sí lo ve, sin tokens y solo de su corredora
  select count(*) into v_filas from public.portal_connection_status('a1a1a1a1-0000-0000-0000-0000000000a1');
  if v_filas <> 1 then
    raise exception 'FALLO: el administrador debía ver 1 conexión de su corredora y vio %', v_filas;
  end if;
  select count(*) into v_filas from public.portal_connection_status('b2b2b2b2-0000-0000-0000-0000000000b2');
  if v_filas <> 0 then
    raise exception 'FALLO: el administrador vio % conexiones de otra corredora', v_filas;
  end if;

  -- No puede desconectar la de otra corredora
  begin
    perform public.disconnect_portal('b2b2b2b2-0000-0000-0000-0000000000b2', 'mercadolibre');
    raise exception 'FALLO: un administrador desconectó el portal de otra corredora';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 3. Un agente ve el estado de su corredora pero no desconecta -------------------------------------------
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}', true);
do $$
declare
  v_filas int;
begin
  select count(*) into v_filas from public.portal_connection_status('a1a1a1a1-0000-0000-0000-0000000000a1');
  if v_filas <> 1 then
    raise exception 'FALLO: el agente debía ver el estado de su corredora y vio % filas', v_filas;
  end if;
  begin
    perform public.disconnect_portal('a1a1a1a1-0000-0000-0000-0000000000a1', 'mercadolibre');
    raise exception 'FALLO: un agente desconectó el portal';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 4. El administrador de la corredora A sí desconecta la suya, y solo esa ---------------------------------
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.disconnect_portal('a1a1a1a1-0000-0000-0000-0000000000a1', 'mercadolibre');
reset role;

do $$
begin
  if exists (select 1 from public.portal_connections where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1') then
    raise exception 'FALLO: la desconexión no borró la conexión';
  end if;
  if not exists (select 1 from public.portal_connections where tenant_id = 'b2b2b2b2-0000-0000-0000-0000000000b2') then
    raise exception 'FALLO: la desconexión borró la conexión de otra corredora';
  end if;
  raise exception 'RLS OK: las conexiones de portales quedan solo del servidor';
end $$;
