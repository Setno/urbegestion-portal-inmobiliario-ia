-- Prueba de seguridad (RLS) de propiedades y leads (H-009.2 y H-009.3).
-- Se ejecuta a mano en el SQL Editor del proyecto de DESARROLLO.
-- Crea dos corredoras (A y B), tres usuarios ficticios, propiedades y leads, y comprueba quién puede qué.
-- Termina SIEMPRE con un "error" para que Postgres deshaga todo y no deje datos:
--   * "RLS OK ..." = todas las comprobaciones pasaron (es el resultado esperado).
--   * "FALLO: ..." = algo está mal; el mensaje dice qué regla se rompió.

insert into auth.users (id, instance_id, aud, role, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-admin-a@ejemplo.test'),
  ('cccccccc-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-agente-a@ejemplo.test'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-agente-b@ejemplo.test');

insert into public.tenants (id, name) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Corredora A (prueba RLS)'),
  ('b2b2b2b2-0000-0000-0000-0000000000b2', 'Corredora B (prueba RLS)');

insert into public.memberships (tenant_id, user_id, role) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-00000000000a', 'admin'),
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'cccccccc-0000-0000-0000-00000000000c', 'agente'),
  ('b2b2b2b2-0000-0000-0000-0000000000b2', 'bbbbbbbb-0000-0000-0000-00000000000b', 'agente');

insert into public.properties (id, tenant_id, title, operation, property_type, price_amount, commune) values
  ('a0a0a0a0-0000-0000-0000-0000000000a1', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Propiedad A', 'venta', 'casa', 1000, 'Vitacura'),
  ('b0b0b0b0-0000-0000-0000-0000000000b2', 'b2b2b2b2-0000-0000-0000-0000000000b2', 'Propiedad B', 'venta', 'casa', 2000, 'Las Condes');

insert into public.leads (id, tenant_id, full_name, operation_interest, source) values
  ('a1000000-0000-0000-0000-0000000000a1', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Lead A', 'compra', 'asistente_ia'),
  ('b2000000-0000-0000-0000-0000000000b2', 'b2b2b2b2-0000-0000-0000-0000000000b2', 'Lead B', 'compra', 'asistente_ia');

-- 1. Visitante sin sesión (anon) ---------------------------------------------
set local role anon;

do $$
declare n int;
begin
  -- Solo las de las corredoras de prueba: la base de desarrollo puede traer propiedades de ejemplo.
  select count(*) into n from public.properties where tenant_id in ('a1a1a1a1-0000-0000-0000-0000000000a1', 'b2b2b2b2-0000-0000-0000-0000000000b2');
  if n <> 2 then raise exception 'FALLO: el visitante ve % propiedades (debería ver las 2 del catálogo público)', n; end if;

  select count(*) into n from public.leads;
  if n <> 0 then raise exception 'FALLO: el visitante lee % leads (debería ver 0)', n; end if;

  -- Desde H-052 el visitante crea leads con la función de la base, no insertando directo.
  perform public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1',
    '{"phone":"+56 9 7000 0000","full_name":"Visita web","operation_interest":"compra","source":"ficha_propiedad"}'::jsonb);

  begin
    insert into public.leads (tenant_id, full_name, operation_interest, source)
    values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Intruso', 'compra', 'ficha_propiedad');
    raise exception 'FALLO: el visitante pudo insertar directo en leads';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1',
      '{"phone":"+56 9 7000 0000","full_name":"Intruso","operation_interest":"compra","source":"ficha_propiedad","status":"cerrado"}'::jsonb);
    raise exception 'FALLO: el visitante pudo crear un lead con estado distinto de nuevo';
  exception when sqlstate 'P0001' then null;
  end;

  begin
    insert into public.properties (tenant_id, title, operation, property_type, price_amount, commune)
    values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Intrusa', 'venta', 'casa', 1, 'X');
    raise exception 'FALLO: el visitante pudo crear una propiedad';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.properties set title = 'hackeada';
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FALLO: el visitante modificó % propiedades', n; end if;
  exception when insufficient_privilege then null;
  end;

  begin
    delete from public.leads;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FALLO: el visitante borró % leads', n; end if;
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;

-- 2. Admin de la corredora A -------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);

do $$
declare n int;
begin
  select count(*) into n from public.leads;
  if n <> 2 then raise exception 'FALLO: el admin de A ve % leads (debería ver los 2 de A, el original y el de la web)', n; end if;

  select count(*) into n from public.leads where tenant_id = 'b2b2b2b2-0000-0000-0000-0000000000b2';
  if n <> 0 then raise exception 'FALLO: el admin de A ve leads de B'; end if;

  update public.leads set status = 'contactado' where id = 'b2000000-0000-0000-0000-0000000000b2';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: el admin de A modificó un lead de B'; end if;

  update public.properties set title = 'hackeada' where id = 'b0b0b0b0-0000-0000-0000-0000000000b2';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: el admin de A modificó una propiedad de B'; end if;

  begin
    insert into public.properties (tenant_id, title, operation, property_type, price_amount, commune)
    values ('b2b2b2b2-0000-0000-0000-0000000000b2', 'Colada', 'venta', 'casa', 1, 'X');
    raise exception 'FALLO: el admin de A creó una propiedad en B';
  exception when insufficient_privilege then null;
  end;

  insert into public.properties (tenant_id, title, operation, property_type, price_amount, commune)
  values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Nueva de A', 'venta', 'casa', 1, 'X');

  update public.properties set title = 'Editada' where id = 'a0a0a0a0-0000-0000-0000-0000000000a1';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FALLO: el admin de A no pudo editar su propiedad'; end if;

  delete from public.properties where title = 'Nueva de A';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FALLO: el admin de A no pudo borrar su propiedad'; end if;
end $$;

reset role;

-- 3. Agente de la corredora A ------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}', true);

do $$
declare n int;
begin
  update public.leads set status = 'contactado' where id = 'a1000000-0000-0000-0000-0000000000a1';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FALLO: el agente de A no pudo cambiar el estado de un lead de A'; end if;

  delete from public.leads where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: el agente borró % leads (solo el admin puede)', n; end if;

  delete from public.properties where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: el agente borró % propiedades (solo el admin puede)', n; end if;

  insert into public.properties (tenant_id, title, operation, property_type, price_amount, commune)
  values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Del agente', 'arriendo', 'departamento', 40, 'X');
end $$;

reset role;

-- 4. Agente de la corredora B ------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}', true);

do $$
declare n int;
begin
  select count(*) into n from public.leads;
  if n <> 1 then raise exception 'FALLO: el agente de B ve % leads (debería ver solo el 1 de B)', n; end if;

  update public.leads set status = 'contactado' where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: el agente de B modificó % leads de A', n; end if;

  update public.properties set title = 'hackeada' where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: el agente de B modificó % propiedades de A', n; end if;
end $$;

reset role;

do $$ begin raise exception 'RLS OK: propiedades y leads aislados por corredora (este "error" deshace los datos de prueba a propósito)'; end $$;
