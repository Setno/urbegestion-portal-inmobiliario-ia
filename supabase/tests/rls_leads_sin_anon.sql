-- Prueba de seguridad de H-063: la función create_site_lead ya no se puede llamar con la clave pública.
-- Se ejecuta DESPUÉS de aplicar la migración 20261105100000, en el proyecto de DESARROLLO.
-- Termina SIEMPRE con un "error" para que Postgres deshaga todo:
--   * "RLS OK ..." = todas las comprobaciones pasaron (es el resultado esperado).
--   * "FALLO: ..." = algo está mal; el mensaje dice qué regla se rompió.

insert into public.tenants (id, name) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Corredora A (prueba H-063)');

-- 1. Un visitante (clave pública) ya no puede crear leads llamando a la función -------------------
set local role anon;
do $$
begin
  begin
    perform public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1',
      '{"full_name":"Ana Pérez","phone":"+56 9 1111 2222","operation_interest":"compra","source":"ficha_propiedad"}'::jsonb);
    raise exception 'FALLO: un visitante con la clave pública pudo llamar a create_site_lead';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 2. Una sesión iniciada tampoco: sus leads se insertan directo, con las reglas de su corredora -----
set local role authenticated;
do $$
begin
  begin
    perform public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1',
      '{"full_name":"Beto Soto","phone":"+56 9 3333 4444","operation_interest":"compra","source":"ficha_propiedad"}'::jsonb);
    raise exception 'FALLO: una sesión iniciada pudo llamar a create_site_lead';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 3. El servidor (clave de servicio) sí puede --------------------------------------------------------
set local role service_role;
do $$
declare v uuid;
begin
  v := public.create_site_lead('a1a1a1a1-0000-0000-0000-0000000000a1',
    '{"full_name":"Carla Díaz","phone":"+56 9 5555 6666","operation_interest":"compra","source":"ficha_propiedad"}'::jsonb);
  if v is null then raise exception 'FALLO: el servidor no pudo crear el lead'; end if;
end $$;
reset role;

do $$ begin raise exception 'RLS OK: create_site_lead solo para el servidor'; end $$;
