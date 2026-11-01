-- Prueba de seguridad de mercado y zonas de trabajo (H-040).
-- Se ejecuta DESPUÉS de aplicar la migración 20261101200000_mercado_y_zonas.sql, en el proyecto de DESARROLLO.
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

-- 1. Valores por defecto: mercado Chile y sin zonas elegidas (= todo el mercado) -----------------
do $$
begin
  if (select market from public.tenants where id = 'a1a1a1a1-0000-0000-0000-0000000000a1') <> 'cl' then
    raise exception 'FALLO: el mercado por defecto no es cl';
  end if;
  if cardinality((select service_areas from public.tenants where id = 'a1a1a1a1-0000-0000-0000-0000000000a1')) <> 0 then
    raise exception 'FALLO: una corredora nueva no debería tener zonas elegidas';
  end if;
end $$;

-- 2. Un agente no puede cambiar las zonas ---------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.set_service_areas(array['CL-VS']);
    raise exception 'FALLO: un agente pudo cambiar las zonas de trabajo';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 3. El administrador cambia las de su corredora, con códigos válidos y sin repetidos -----------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.set_service_areas(array['CL-VS', 'CL-RM', 'CL-VS']);
do $$
begin
  begin
    perform public.set_service_areas(array['valparaiso']);
    raise exception 'FALLO: se aceptó un código de zona no válido';
  exception when raise_exception then
    if sqlerrm like 'FALLO%' then raise; end if;
  end;
end $$;
reset role;

do $$
begin
  if (select service_areas from public.tenants where id = 'a1a1a1a1-0000-0000-0000-0000000000a1') <> array['CL-RM', 'CL-VS'] then
    raise exception 'FALLO: las zonas de A no quedaron como CL-RM y CL-VS (sin repetir): %',
      (select service_areas from public.tenants where id = 'a1a1a1a1-0000-0000-0000-0000000000a1');
  end if;
  if cardinality((select service_areas from public.tenants where id = 'b2b2b2b2-0000-0000-0000-0000000000b2')) <> 0 then
    raise exception 'FALLO: el cambio afectó a otra corredora';
  end if;
end $$;

-- 4. El administrador puede dejar las zonas vacías (todo el mercado) -------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.set_service_areas(array[]::text[]);
reset role;
do $$
begin
  if cardinality((select service_areas from public.tenants where id = 'a1a1a1a1-0000-0000-0000-0000000000a1')) <> 0 then
    raise exception 'FALLO: no se pudieron vaciar las zonas';
  end if;
end $$;

-- 5. El sitio público lee solo mercado y zonas de su corredora, sin sesión -------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.set_service_areas(array['CL-BI']);
reset role;

set local role anon;
do $$
declare s jsonb;
begin
  s := public.get_tenant_public_settings('a1a1a1a1-0000-0000-0000-0000000000a1');
  if s->>'market' <> 'cl' or s->'service_areas' <> '["CL-BI"]'::jsonb then
    raise exception 'FALLO: el sitio público no leyó el mercado y las zonas de A (leyó %)', s;
  end if;
  begin
    if (select count(*) from public.tenants) <> 0 then
      raise exception 'FALLO: un visitante puede leer la tabla tenants completa';
    end if;
  exception when insufficient_privilege then null; -- tampoco tiene permiso de lectura: también es correcto
  end;
  if public.get_tenant_public_settings('00000000-0000-0000-0000-000000000000') is not null then
    raise exception 'FALLO: una corredora que no existe devolvió datos';
  end if;
  begin
    perform public.set_service_areas(array['CL-VS']);
    raise exception 'FALLO: un visitante pudo cambiar zonas';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

do $$ begin raise exception 'RLS OK: mercado y zonas de trabajo funcionan, aisladas por corredora (este "error" deshace los datos de prueba a propósito)'; end $$;
