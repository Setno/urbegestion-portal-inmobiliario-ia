-- Prueba de seguridad de los datos del sitio (H-027).
-- Se ejecuta DESPUÉS de aplicar las migraciones 20261102120000 y 20261102130000, en el proyecto de DESARROLLO.
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

-- 1. Sin fila: un visitante ve solo el nombre, con la plantilla predeterminada ---------------------
set local role anon;
do $$
declare s jsonb;
begin
  s := public.get_tenant_public_site('a1a1a1a1-0000-0000-0000-0000000000a1');
  if s->>'tenantName' <> 'Corredora A (prueba RLS)' or s->>'templateId' <> 'clasica' or s->'brand' <> '{}'::jsonb then
    raise exception 'FALLO: corredora sin datos no se leyó neutra (leyó %)', s;
  end if;
  if public.get_tenant_public_site('00000000-0000-0000-0000-000000000000') is not null then
    raise exception 'FALLO: una corredora que no existe devolvió datos';
  end if;
  begin
    perform public.set_site_brand('a1a1a1a1-0000-0000-0000-0000000000a1', '{"brandName":"Hackeada"}', '{}', '{}');
    raise exception 'FALLO: un visitante pudo cambiar la marca';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 2. El agente no puede cambiarla ---------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.set_site_brand('a1a1a1a1-0000-0000-0000-0000000000a1', '{"brandName":"Del agente"}', '{}', '{}');
    raise exception 'FALLO: un agente pudo cambiar la marca';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 3. El administrador de otra corredora tampoco ----------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.set_site_brand('a1a1a1a1-0000-0000-0000-0000000000a1', '{"brandName":"De B"}', '{}', '{}');
    raise exception 'FALLO: el administrador de B pudo cambiar la marca de A';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 4. El administrador de A guarda; un visitante lo ve; los textos no se tocan ---------------------
insert into public.site_content (tenant_id, content) values ('a1a1a1a1-0000-0000-0000-0000000000a1', '{"hero":{"badge":"Texto cargado"}}');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.set_site_brand('a1a1a1a1-0000-0000-0000-0000000000a1', '{"brandName":"Casa Sur"}', '{"primary":"#112233"}', '{"showAiChat":false}');
reset role;
set local role anon;
do $$
declare s jsonb;
begin
  s := public.get_tenant_public_site('a1a1a1a1-0000-0000-0000-0000000000a1');
  if s->'brand'->>'brandName' <> 'Casa Sur' or s->'theme'->>'primary' <> '#112233' or s->'layout'->>'showAiChat' <> 'false' then
    raise exception 'FALLO: el visitante no ve lo que guardó el administrador (leyó %)', s;
  end if;
  if s->'content'->'hero'->>'badge' <> 'Texto cargado' then
    raise exception 'FALLO: guardar la marca borró los textos';
  end if;
  begin
    if (select count(*) from public.site_content) <> 0 then
      raise exception 'FALLO: un visitante puede leer la tabla site_content';
    end if;
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 5. Nadie escribe directo en la tabla, ni siquiera el administrador ------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
declare n integer;
begin
  begin
    update public.site_content set template_id = 'otra' where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FALLO: un administrador escribió directo en site_content'; end if;
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 6. Un miembro de B no lee la fila de A -------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
begin
  if (select count(*) from public.site_content where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1') <> 0 then
    raise exception 'FALLO: el administrador de B leyó la fila de A';
  end if;
end $$;
reset role;

-- 7. Tamaño máximo: una foto incrustada como texto no cabe ----------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.set_site_brand('a1a1a1a1-0000-0000-0000-0000000000a1', jsonb_build_object('logoUrl', repeat('A', 40000)), '{}', '{}');
    raise exception 'FALLO: se aceptó una marca demasiado grande';
  exception when check_violation then null;
  end;
end $$;
reset role;

-- 8. Con la función apagada en el plan, o la corredora suspendida, se rechaza ---------------------
insert into public.tenant_entitlements (tenant_id, features) values ('a1a1a1a1-0000-0000-0000-0000000000a1', '{"branding.edit":false}');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.set_site_brand('a1a1a1a1-0000-0000-0000-0000000000a1', '{"brandName":"Sin plan"}', '{}', '{}');
    raise exception 'FALLO: se editó la marca con branding.edit apagado';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
update public.tenant_entitlements set features = '{}', status = 'suspended' where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.set_site_brand('a1a1a1a1-0000-0000-0000-0000000000a1', '{"brandName":"Suspendida"}', '{}', '{}');
    raise exception 'FALLO: una corredora suspendida editó su marca';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

update public.tenant_entitlements set status = 'cancelled' where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.set_site_brand('a1a1a1a1-0000-0000-0000-0000000000a1', '{"brandName":"Cancelada"}', '{}', '{}');
    raise exception 'FALLO: una corredora cancelada editó su marca';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 9. Pago vencido: dentro del plazo de gracia se edita, pasado el plazo no ---------------------------
update public.tenant_entitlements set status = 'past_due', grace_ends_at = now() + interval '1 day' where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.set_site_brand('a1a1a1a1-0000-0000-0000-0000000000a1', '{"brandName":"En gracia"}', '{}', '{}');
reset role;
update public.tenant_entitlements set grace_ends_at = now() - interval '1 day' where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.set_site_brand('a1a1a1a1-0000-0000-0000-0000000000a1', '{"brandName":"Vencida"}', '{}', '{}');
    raise exception 'FALLO: una corredora con el plazo de gracia vencido editó su marca';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

do $$ begin raise exception 'RLS OK: los datos del sitio son públicos para leer y solo el administrador de la corredora los cambia (este "error" deshace los datos de prueba a propósito)'; end $$;
