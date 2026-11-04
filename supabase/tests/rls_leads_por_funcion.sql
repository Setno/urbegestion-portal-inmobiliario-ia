-- Prueba de seguridad de la creación de leads por función (H-052 / H-055).
-- Se ejecuta DESPUÉS de aplicar la migración 20261104160000, en el proyecto de DESARROLLO.
-- Termina SIEMPRE con un "error" para que Postgres deshaga todo:
--   * "RLS OK ..." = todas las comprobaciones pasaron (es el resultado esperado).
--   * "FALLO: ..." = algo está mal; el mensaje dice qué regla se rompió.

insert into auth.users (id, instance_id, aud, role, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@ejemplo.test');

insert into public.tenants (id, name) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Corredora A (prueba RLS)'),
  ('b2b2b2b2-0000-0000-0000-0000000000b2', 'Corredora B (prueba RLS)');

insert into public.memberships (tenant_id, user_id, role) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-00000000000a', 'agente');

insert into public.properties (id, tenant_id, title, operation, property_type, commune, price_amount, price_currency)
  values ('b0b0b0b0-0000-0000-0000-0000000000b1', 'b2b2b2b2-0000-0000-0000-0000000000b2', 'Casa de B', 'venta', 'casa', 'Vitacura', 100, 'UF');

-- 1. Un visitante no puede insertar directo, pero sí por la función ------------------------------
set local role anon;
do $$
declare v uuid;
begin
  begin
    insert into public.leads (tenant_id, full_name, operation_interest, source)
      values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Intruso', 'compra', 'ficha_propiedad');
    raise exception 'FALLO: un visitante insertó directo en leads';
  exception when insufficient_privilege then null;
  end;

  v := public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1',
    '{"full_name":"Ana Pérez","email":"ana@x.cl","phone":"+56 9 1111 2222","operation_interest":"compra","source":"ficha_propiedad","notes":["hola"]}'::jsonb);
  if v is null then raise exception 'FALLO: la función no devolvió el id'; end if;

  -- corredora inexistente o sitio no disponible
  begin
    perform public.create_site_lead('99999999-0000-0000-0000-000000000099',
      '{"phone":"+56 9 7000 0000","full_name":"Ana","operation_interest":"compra","source":"ficha_propiedad"}'::jsonb);
    raise exception 'FALLO: aceptó una corredora inexistente';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'sitio_no_disponible' then raise; end if;
  end;

  -- estado que un visitante no puede elegir
  begin
    perform public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1',
      '{"phone":"+56 9 7000 0000","full_name":"Beto","operation_interest":"compra","source":"ficha_propiedad","status":"cerrado"}'::jsonb);
    raise exception 'FALLO: un visitante creó un lead cerrado';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'lead_invalido' then raise; end if;
  end;

  -- propiedad de otra corredora
  begin
    perform public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1',
      '{"phone":"+56 9 7000 0000","full_name":"Carla","operation_interest":"compra","source":"ficha_propiedad","property_id":"b0b0b0b0-0000-0000-0000-0000000000b1"}'::jsonb);
    raise exception 'FALLO: aceptó una propiedad de otra corredora';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'lead_invalido' then raise; end if;
  end;

  -- nombre vacío
  begin
    perform public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1',
      '{"phone":"+56 9 7000 0000","full_name":" ","operation_interest":"compra","source":"ficha_propiedad"}'::jsonb);
    raise exception 'FALLO: aceptó un nombre vacío';
  exception when sqlstate 'P0001' then null;
  end;

  -- Columnas internas: se ignoran (no existe forma de colocarlas)
  v := public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1',
    '{"full_name":"Dani","phone":"+56 9 2222 3333","operation_interest":"compra","source":"ficha_propiedad","alert_sent_at":"2020-01-01","next_action_text":"hackeado","converted_property_id":"b0b0b0b0-0000-0000-0000-0000000000b1","tenant_id":"b2b2b2b2-0000-0000-0000-0000000000b2"}'::jsonb);
end $$;
reset role;

do $$
begin
  if (select count(*) from public.leads where full_name = 'Dani' and tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1'
        and alert_sent_at is null and next_action_text is null and converted_property_id is null) <> 1 then
    raise exception 'FALLO: el visitante pudo fijar columnas internas o cambiar de corredora';
  end if;
end $$;

-- 2. Tope por teléfono: el cuarto envío en una hora se rechaza --------------------------------------
set local role anon;
do $$
begin
  perform public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1', '{"full_name":"Eva 1","phone":"+56 9 5555 0001","operation_interest":"compra","source":"ficha_propiedad"}'::jsonb);
  perform public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1', '{"full_name":"Eva 2","phone":"56955550001","operation_interest":"compra","source":"ficha_propiedad"}'::jsonb);
  perform public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1', '{"full_name":"Eva 3","phone":"9 5555 0001","operation_interest":"compra","source":"ficha_propiedad"}'::jsonb);
  begin
    perform public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1', '{"full_name":"Eva 4","phone":"+56 9 5555 0001","operation_interest":"compra","source":"ficha_propiedad"}'::jsonb);
    raise exception 'FALLO: no hubo tope por teléfono';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'limite_contacto' then raise; end if;
  end;
end $$;
reset role;

-- 3. Tope por corredora: 60 en 10 minutos --------------------------------------------------------
insert into public.leads (tenant_id, full_name, operation_interest, source)
  select 'b2b2b2b2-0000-0000-0000-0000000000b2', 'Masivo ' || g, 'compra', 'ficha_propiedad' from generate_series(1, 60) g;
set local role anon;
do $$
begin
  begin
    perform public.create_site_lead('b2b2b2b2-0000-0000-0000-0000000000b2', '{"phone":"+56 9 7000 0000","full_name":"Uno más","operation_interest":"compra","source":"ficha_propiedad"}'::jsonb);
    raise exception 'FALLO: no hubo tope por corredora';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'limite_corredora' then raise; end if;
  end;
end $$;
reset role;

-- 4. Un miembro crea leads en su corredora, no en otra -------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated","email":"rls-a@ejemplo.test"}', true);
do $$
begin
  insert into public.leads (tenant_id, full_name, operation_interest, source, status)
    values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Manual', 'compra', 'formulario_contacto', 'contactado');
  begin
    insert into public.leads (tenant_id, full_name, operation_interest, source)
      values ('b2b2b2b2-0000-0000-0000-0000000000b2', 'En otra', 'compra', 'formulario_contacto');
    raise exception 'FALLO: un miembro creó un lead en otra corredora';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;


-- 5. Endurecimiento (migración 20261104180000) -----------------------------------------------------
set local role anon;
do $$
declare v uuid;
begin
  -- sin ningún dato de contacto
  begin
    perform public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1', '{"full_name":"Sin contacto","operation_interest":"compra","source":"ficha_propiedad"}'::jsonb);
    raise exception 'FALLO: aceptó un lead sin teléfono ni correo';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'lead_invalido' then raise; end if;
  end;
  -- con solo correo sí
  perform public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1', '{"full_name":"Solo correo","email":"solo@correo.cl","operation_interest":"compra","source":"ficha_propiedad"}'::jsonb);
  -- el id que propone el cliente se respeta (la consola lo necesita); repetido o mal formado se rechaza
  v := public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1', '{"id":"11111111-1111-4111-8111-111111111111","full_name":"Con id","phone":"+56 9 8000 0001","operation_interest":"compra","source":"ficha_propiedad"}'::jsonb);
  if v <> '11111111-1111-4111-8111-111111111111' then raise exception 'FALLO: no se respetó el id del cliente'; end if;
  begin
    perform public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1', '{"id":"11111111-1111-4111-8111-111111111111","full_name":"Repetido","phone":"+56 9 8000 0004","operation_interest":"compra","source":"ficha_propiedad"}'::jsonb);
    raise exception 'FALLO: aceptó un id repetido';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'lead_invalido' then raise exception 'FALLO: el error filtra detalles internos (%)', sqlerrm; end if;
  end;
  begin
    perform public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1', '{"id":"no-es-uuid","full_name":"Id malo","phone":"+56 9 8000 0005","operation_interest":"compra","source":"ficha_propiedad"}'::jsonb);
    raise exception 'FALLO: aceptó un id mal formado';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'lead_invalido' then raise exception 'FALLO: el error filtra detalles internos (%)', sqlerrm; end if;
  end;
  -- una fecha mal formada sale como lead_invalido, sin mensajes internos de Postgres
  begin
    perform public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1', '{"full_name":"Fecha mala","phone":"+56 9 8000 0002","operation_interest":"compra","source":"ficha_propiedad","appointment_date":"no-es-fecha"}'::jsonb);
    raise exception 'FALLO: aceptó una fecha mal formada';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'lead_invalido' then raise exception 'FALLO: el error filtra detalles internos (%)', sqlerrm; end if;
  end;
  begin
    perform public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1', '{"full_name":"Operación mala","phone":"+56 9 8000 0003","operation_interest":"inventada","source":"ficha_propiedad"}'::jsonb);
    raise exception 'FALLO: aceptó una operación inventada';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'lead_invalido' then raise exception 'FALLO: el error filtra detalles internos (%)', sqlerrm; end if;
  end;
end $$;
reset role;

do $$ begin raise exception 'RLS OK: leads por función'; end $$;
