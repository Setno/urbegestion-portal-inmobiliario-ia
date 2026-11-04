-- Prueba de las columnas públicas de las propiedades (H-047).
-- Se ejecuta DESPUÉS de aplicar la migración 20261104170000, en el proyecto de DESARROLLO.
-- Termina SIEMPRE con un "error" para que Postgres deshaga todo:
--   * "RLS OK ..." = todas las comprobaciones pasaron (es el resultado esperado).
--   * "FALLO: ..." = algo está mal; el mensaje dice qué regla se rompió.

insert into public.tenants (id, name) values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Corredora A (prueba RLS)');
insert into public.properties (id, tenant_id, title, operation, property_type, commune, price_amount, price_currency, lat, lng, rejection_reason)
  values ('a0a0a0a0-0000-0000-0000-0000000000a1', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Casa pública', 'venta', 'casa', 'Vitacura', 100, 'UF', -33.4, -70.6, 'motivo interno');

set local role anon;
do $$
declare n int;
begin
  -- Lo público se lee igual que antes
  select count(*) into n from public.properties where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1'
     and publication_status = 'publicada' and status in ('disponible', 'reservada');
  if n <> 1 then raise exception 'FALLO: el visitante no puede leer las columnas públicas (%)', n; end if;
  perform id, title, price_amount, price_currency, images, description, features, map_query, created_at from public.properties;

  -- Lo interno no
  begin
    perform created_by from public.properties;
    raise exception 'FALLO: el visitante lee quién creó la propiedad';
  exception when insufficient_privilege then null;
  end;
  begin
    perform approved_by from public.properties;
    raise exception 'FALLO: el visitante lee quién aprobó la propiedad';
  exception when insufficient_privilege then null;
  end;
  begin
    perform rejection_reason from public.properties;
    raise exception 'FALLO: el visitante lee el motivo de rechazo';
  exception when insufficient_privilege then null;
  end;
  begin
    perform lat, lng from public.properties;
    raise exception 'FALLO: el visitante lee las coordenadas exactas';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.properties;
    raise exception 'FALLO: select * funciona para un visitante';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;


-- Un usuario con sesión de OTRA corredora no ve las propiedades de esta (ni sus columnas internas)
insert into auth.users (id, instance_id, aud, role, email) values
  ('bbbbbbbb-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@ejemplo.test');
insert into public.tenants (id, name) values ('b2b2b2b2-0000-0000-0000-0000000000b2', 'Corredora B (prueba RLS)');
insert into public.memberships (tenant_id, user_id, role) values ('b2b2b2b2-0000-0000-0000-0000000000b2', 'bbbbbbbb-0000-0000-0000-00000000000b', 'agente');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated","email":"rls-b@ejemplo.test"}', true);
do $$
begin
  if (select count(*) from public.properties where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1') <> 0 then
    raise exception 'FALLO: un usuario de otra corredora lee propiedades de la corredora A';
  end if;
end $$;
reset role;

do $$ begin raise exception 'RLS OK: columnas públicas de propiedades'; end $$;
