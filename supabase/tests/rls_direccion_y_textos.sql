-- Prueba de seguridad de la dirección y los textos del sitio (H-030 y H-032).
-- Se ejecuta DESPUÉS de aplicar las migraciones 20261103120000, 20261103130000 y 20261103140000, en el proyecto de DESARROLLO.
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

-- 1. Visitantes, agentes y el administrador de otra corredora no cambian la dirección ni los textos ----
set local role anon;
do $$
begin
  begin
    perform public.set_site_address('a1a1a1a1-0000-0000-0000-0000000000a1', 'robada', null);
    raise exception 'FALLO: un visitante cambió la dirección';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_site_content('a1a1a1a1-0000-0000-0000-0000000000a1', '{"hero":{"badge":"Hackeado"}}');
    raise exception 'FALLO: un visitante cambió los textos';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.set_site_address('a1a1a1a1-0000-0000-0000-0000000000a1', 'del-agente', null);
    raise exception 'FALLO: un agente cambió la dirección';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_site_content('a1a1a1a1-0000-0000-0000-0000000000a1', '{"hero":{"badge":"Del agente"}}');
    raise exception 'FALLO: un agente cambió los textos';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.set_site_address('a1a1a1a1-0000-0000-0000-0000000000a1', 'de-b', null);
    raise exception 'FALLO: el administrador de B cambió la dirección de A';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_site_content('a1a1a1a1-0000-0000-0000-0000000000a1', '{"hero":{"badge":"De B"}}');
    raise exception 'FALLO: el administrador de B cambió los textos de A';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 2. El administrador de A guarda su dirección y sus textos; la marca no se toca -------------------
insert into public.site_content (tenant_id, brand) values ('a1a1a1a1-0000-0000-0000-0000000000a1', '{"brandName":"Casa Sur"}');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.set_site_address('a1a1a1a1-0000-0000-0000-0000000000a1', '  CasaSur-Prueba ', 'WWW.CasaSur-Prueba.cl');
select public.set_site_content('a1a1a1a1-0000-0000-0000-0000000000a1', '{"hero":{"badge":"Nuevo texto"}}');
do $$
begin
  if (select count(*) from public.site_addresses where subdomain = 'casasur-prueba' and custom_domain = 'casasur-prueba.cl') <> 1 then
    raise exception 'FALLO: el administrador no ve su dirección guardada en minúsculas y sin www';
  end if;
  begin
    perform public.set_site_content('a1a1a1a1-0000-0000-0000-0000000000a1', jsonb_build_object('hero', jsonb_build_object('badge', repeat('A', 140000))));
    raise exception 'FALLO: se aceptaron textos demasiado grandes';
  exception when check_violation then null;
  end;
end $$;
reset role;
set local role anon;
do $$
declare s jsonb;
begin
  s := public.get_tenant_public_site('a1a1a1a1-0000-0000-0000-0000000000a1');
  if s->'content'->'hero'->>'badge' <> 'Nuevo texto' then
    raise exception 'FALLO: el visitante no ve los textos guardados (leyó %)', s;
  end if;
  if s->'brand'->>'brandName' <> 'Casa Sur' then
    raise exception 'FALLO: guardar los textos borró la marca';
  end if;
  begin
    if (select count(*) from public.site_addresses) <> 0 then
      raise exception 'FALLO: un visitante puede leer la tabla site_addresses';
    end if;
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 3. Resolver la dirección --------------------------------------------------------------------------
set local role anon;
do $$
declare
  a constant uuid := 'a1a1a1a1-0000-0000-0000-0000000000a1';
  b constant uuid := 'b2b2b2b2-0000-0000-0000-0000000000b2';
begin
  if (public.resolve_site('casasur-prueba', null, b)->>'tenantId')::uuid is distinct from a then
    raise exception 'FALLO: el subdominio no lleva a su corredora';
  end if;
  if (public.resolve_site(null, 'casasur-prueba.cl', b)->>'tenantId')::uuid is distinct from a
     or (public.resolve_site(null, 'www.CASASUR-PRUEBA.cl', b)->>'tenantId')::uuid is distinct from a then
    raise exception 'FALLO: el dominio propio (con o sin www) no lleva a su corredora';
  end if;
  if public.resolve_site('casasur-prueba', null, b) <> jsonb_build_object('tenantId', a, 'subdomain', 'casasur-prueba', 'customDomain', 'casasur-prueba.cl') then
    raise exception 'FALLO: la resolución no trae el subdominio y el dominio para la dirección canónica';
  end if;
  if (public.resolve_site('no-existe', null, b)->>'tenantId')::uuid is not null then
    raise exception 'FALLO: un subdominio desconocido mostró otra corredora';
  end if;
  if (public.resolve_site(null, 'localhost', b)->>'tenantId')::uuid is distinct from b then
    raise exception 'FALLO: una dirección sin dueño no usa la corredora configurada';
  end if;
  if (public.resolve_site(null, 'localhost', null)->>'tenantId')::uuid is not null
     or (public.resolve_site(null, 'localhost', '00000000-0000-0000-0000-000000000000')->>'tenantId')::uuid is not null then
    raise exception 'FALLO: sin corredora configurada (o inexistente) se resolvió una';
  end if;
end $$;
reset role;

-- 4. Direcciones repetidas o mal escritas se rechazan ------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.set_site_address('b2b2b2b2-0000-0000-0000-0000000000b2', 'casasur-prueba', null);
    raise exception 'FALLO: B tomó el subdominio de A';
  exception when unique_violation then null;
  end;
  begin
    perform public.set_site_address('b2b2b2b2-0000-0000-0000-0000000000b2', null, 'casasur-prueba.cl');
    raise exception 'FALLO: B tomó el dominio de A';
  exception when unique_violation then null;
  end;
  begin
    perform public.set_site_address('b2b2b2b2-0000-0000-0000-0000000000b2', 'www', null);
    raise exception 'FALLO: se aceptó un subdominio reservado';
  exception when check_violation then null;
  end;
  begin
    perform public.set_site_address('b2b2b2b2-0000-0000-0000-0000000000b2', 'con espacio', null);
    raise exception 'FALLO: se aceptó un subdominio mal escrito';
  exception when check_violation then null;
  end;
  begin
    perform public.set_site_address('b2b2b2b2-0000-0000-0000-0000000000b2', null, 'otra-corredora.vercel.app');
    raise exception 'FALLO: se aceptó un dominio de Vercel';
  exception when check_violation then null;
  end;
  begin
    perform public.set_site_address('b2b2b2b2-0000-0000-0000-0000000000b2', null, 'https://sitio.cl/ruta');
    raise exception 'FALLO: se aceptó un dominio mal escrito';
  exception when check_violation then null;
  end;
end $$;
reset role;

-- 5. Sin dominio propio en el plan: no se guarda ni se resuelve -------------------------------------
insert into public.tenant_entitlements (tenant_id, features) values ('a1a1a1a1-0000-0000-0000-0000000000a1', '{"site.custom_domain":false}');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.set_site_address('a1a1a1a1-0000-0000-0000-0000000000a1', 'casasur-prueba', 'otro-dominio.cl');
    raise exception 'FALLO: se guardó un dominio propio sin site.custom_domain';
  exception when insufficient_privilege then null;
  end;
  -- Solo el subdominio sí se puede
  perform public.set_site_address('a1a1a1a1-0000-0000-0000-0000000000a1', 'casasur-prueba', null);
end $$;
reset role;
update public.site_addresses set custom_domain = 'casasur-prueba.cl' where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
-- Tras bajar de plan se puede cambiar el subdominio conservando el dominio ya guardado
select public.set_site_address('a1a1a1a1-0000-0000-0000-0000000000a1', 'casasur-prueba', 'casasur-prueba.cl');
reset role;
set local role anon;
do $$
begin
  if (public.resolve_site(null, 'casasur-prueba.cl', null)->>'tenantId')::uuid is not null then
    raise exception 'FALLO: un dominio propio sin site.custom_domain mostró el sitio';
  end if;
  if public.resolve_site(null, 'casasur-prueba.cl', 'b2b2b2b2-0000-0000-0000-0000000000b2') is not null then
    raise exception 'FALLO: un dominio propio bloqueado mostró la corredora por defecto (y le mandaría sus leads)';
  end if;
  if public.resolve_site('casasur-prueba', null, null)->>'customDomain' is not null then
    raise exception 'FALLO: un dominio bloqueado se ofreció como dirección canónica';
  end if;
  if (public.resolve_site('casasur-prueba', null, null)->>'tenantId')::uuid is null then
    raise exception 'FALLO: sin dominio propio el subdominio dejó de funcionar';
  end if;
end $$;
reset role;

-- 6. Sitio apagado en el plan, suspendida o cancelada: no se muestra; pago vencido sí ---------------
update public.tenant_entitlements set features = '{"site.enabled":false}' where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
set local role anon;
do $$ begin
  if (public.resolve_site('casasur-prueba', null, null)->>'tenantId')::uuid is not null then raise exception 'FALLO: con site.enabled apagado se mostró el sitio'; end if;
end $$;
reset role;
update public.tenant_entitlements set features = '{}', status = 'suspended' where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
set local role anon;
do $$ begin
  if (public.resolve_site('casasur-prueba', null, null)->>'tenantId')::uuid is not null then raise exception 'FALLO: una corredora suspendida mostró su sitio'; end if;
  if (public.resolve_site(null, 'localhost', 'a1a1a1a1-0000-0000-0000-0000000000a1')->>'tenantId')::uuid is not null then raise exception 'FALLO: la corredora configurada se mostró estando suspendida'; end if;
end $$;
reset role;
update public.tenant_entitlements set status = 'cancelled' where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
set local role anon;
do $$ begin
  if (public.resolve_site('casasur-prueba', null, null)->>'tenantId')::uuid is not null then raise exception 'FALLO: una corredora cancelada mostró su sitio'; end if;
end $$;
reset role;
update public.tenant_entitlements set status = 'past_due', grace_ends_at = now() - interval '1 day' where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
set local role anon;
do $$ begin
  if (public.resolve_site('casasur-prueba', null, null)->>'tenantId')::uuid is null then raise exception 'FALLO: un pago vencido apagó el sitio'; end if;
end $$;
reset role;

-- 7. Con el plazo de gracia vencido o sin branding.edit no se editan los textos ---------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.set_site_content('a1a1a1a1-0000-0000-0000-0000000000a1', '{"hero":{"badge":"Vencida"}}');
    raise exception 'FALLO: con el plazo de gracia vencido se editaron los textos';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
update public.tenant_entitlements set status = 'active', features = '{"branding.edit":false}' where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.set_site_content('a1a1a1a1-0000-0000-0000-0000000000a1', '{"hero":{"badge":"Sin plan"}}');
    raise exception 'FALLO: con branding.edit apagado se editaron los textos';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 8. Un miembro de B no ve la dirección de A ---------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from public.site_addresses where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1') <> 0 then
    raise exception 'FALLO: el administrador de B leyó la dirección de A';
  end if;
end $$;
reset role;

do $$ begin raise exception 'RLS OK: la dirección y los textos del sitio solo los cambia el administrador de la corredora, y un sitio apagado no se muestra (este "error" deshace los datos de prueba a propósito)'; end $$;
