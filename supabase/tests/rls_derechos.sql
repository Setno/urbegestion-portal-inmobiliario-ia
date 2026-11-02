-- Prueba de seguridad de derechos de la corredora y métricas de plataforma (H-043.2).
-- Se ejecuta DESPUÉS de aplicar la migración 20261101230000_derechos_de_corredora.sql, en el proyecto de DESARROLLO.
-- Termina SIEMPRE con un "error" para que Postgres deshaga todo:
--   * "RLS OK ..." = todas las comprobaciones pasaron (es el resultado esperado).
--   * "FALLO: ..." = algo está mal; el mensaje dice qué regla se rompió.

insert into auth.users (id, instance_id, aud, role, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-admin-a@ejemplo.test'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-admin-b@ejemplo.test');

insert into public.tenants (id, name) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Corredora A (prueba derechos)'),
  ('b2b2b2b2-0000-0000-0000-0000000000b2', 'Corredora B (prueba derechos)');

insert into public.memberships (tenant_id, user_id, role) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-00000000000a', 'admin'),
  ('b2b2b2b2-0000-0000-0000-0000000000b2', 'bbbbbbbb-0000-0000-0000-00000000000b', 'admin');

insert into public.tenant_entitlements (tenant_id, tenant_ref, plan_code, status, features, limits) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'ventas-A', 'completo', 'active', '{"ai.chat": false}', '{"limit.agents": 3}'),
  ('b2b2b2b2-0000-0000-0000-0000000000b2', 'ventas-B', 'solo_herramientas', 'trial', '{}', '{}');

-- 1. El administrador de A ve solo los derechos de A ----------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  if (select count(*) from public.tenant_entitlements) <> 1 then
    raise exception 'FALLO: el administrador de A ve % filas de derechos (debería ver 1)', (select count(*) from public.tenant_entitlements);
  end if;
  if (select plan_code from public.tenant_entitlements) <> 'completo' then
    raise exception 'FALLO: el administrador de A no ve los derechos de A';
  end if;
end $$;

-- 2. Nadie escribe desde la aplicación ---------------------------------------------------------------------
do $$
declare v_rows integer;
begin
  begin
    insert into public.tenant_entitlements (tenant_id, plan_code) values ('b2b2b2b2-0000-0000-0000-0000000000b2', 'x');
    raise exception 'FALLO: se pudo insertar derechos desde la aplicación';
  exception when insufficient_privilege or unique_violation then null;
  end;
  update public.tenant_entitlements set status = 'cancelled';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'FALLO: un administrador cambió derechos (% filas)', v_rows; end if;
  delete from public.tenant_entitlements;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'FALLO: un administrador borró derechos (% filas)', v_rows; end if;
end $$;

-- 3. Las métricas de plataforma no son accesibles desde la aplicación ---------------------------------------
do $$
begin
  begin
    perform * from public.platform_metrics();
    raise exception 'FALLO: un administrador pudo leer las métricas de plataforma';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set local role anon;
do $$
begin
  begin
    if (select count(*) from public.tenant_entitlements) <> 0 then
      raise exception 'FALLO: un visitante leyó derechos';
    end if;
  exception when insufficient_privilege then null; -- sin permiso de lectura: también es correcto
  end;
  begin
    perform * from public.platform_metrics();
    raise exception 'FALLO: un visitante leyó métricas de plataforma';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 4. Con la clave de servicio, las métricas incluyen las corredoras de prueba, solo con números -----------------
set local role service_role;
do $$
declare r record;
begin
  select * into r from public.platform_metrics() where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
  if r.agents_count <> 1 then raise exception 'FALLO: agents_count de A es %, debería ser 1', r.agents_count; end if;
  if r.properties_total <> 0 or r.leads_total <> 0 then raise exception 'FALLO: A debería partir sin propiedades ni leads'; end if;
end $$;
reset role;

-- 5. Un estado inválido se rechaza -------------------------------------------------------------------------
do $$
begin
  begin
    update public.tenant_entitlements set status = 'vip' where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
    raise exception 'FALLO: se aceptó un estado de suscripción inválido';
  exception when check_violation then null;
  end;
end $$;

do $$ begin raise exception 'RLS OK: derechos y métricas de plataforma aislados (este "error" deshace los datos de prueba a propósito)'; end $$;
