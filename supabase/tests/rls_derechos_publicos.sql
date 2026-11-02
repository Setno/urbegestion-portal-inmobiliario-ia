-- Prueba de la función pública de derechos y del cupo de propiedades publicadas (H-045).
-- Se ejecuta DESPUÉS de aplicar la migración 20261101240000_derechos_publicos_y_cupo_publicadas.sql, en DESARROLLO.
-- Termina SIEMPRE con un "error" para que Postgres deshaga todo:
--   * "RLS OK ..." = todas las comprobaciones pasaron (es el resultado esperado).
--   * "FALLO: ..." = algo está mal; el mensaje dice qué regla se rompió.

insert into public.tenants (id, name) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Corredora A (prueba cupo)'),
  ('b2b2b2b2-0000-0000-0000-0000000000b2', 'Corredora B (prueba cupo)');

insert into public.tenant_entitlements (tenant_id, tenant_ref, plan_code, status, features, limits) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'ventas-A', 'secreto_comercial', 'active',
   '{"ai.chat": false, "valuation.owner_form": true}', '{"limit.properties_published": 2, "limit.agents": 5}');

-- 1. El visitante lee funciones y estado, pero nada comercial ---------------------------------------------
set local role anon;
do $$
declare r jsonb;
begin
  r := public.get_tenant_public_entitlements('a1a1a1a1-0000-0000-0000-0000000000a1');
  if r is null then raise exception 'FALLO: el visitante no pudo leer los derechos públicos'; end if;
  if r ->> 'status' <> 'active' then raise exception 'FALLO: estado público incorrecto: %', r; end if;
  if (r -> 'features' ->> 'ai.chat')::boolean is distinct from false then raise exception 'FALLO: ai.chat debería venir apagado: %', r; end if;
  if r ? 'planCode' or r ? 'plan_code' or r ? 'limits' or r ? 'tenantRef' or r::text like '%secreto_comercial%' or r::text like '%ventas-A%' then
    raise exception 'FALLO: la función pública filtró datos comerciales: %', r;
  end if;
  if public.get_tenant_public_entitlements('b2b2b2b2-0000-0000-0000-0000000000b2') is not null then
    raise exception 'FALLO: una corredora sin derechos guardados debería devolver null';
  end if;
  if public.get_tenant_public_entitlements('00000000-0000-0000-0000-000000000000') is not null then
    raise exception 'FALLO: una corredora que no existe debería devolver null';
  end if;
  -- La tabla sigue cerrada para el visitante
  if (select count(*) from public.tenant_entitlements) <> 0 then
    raise exception 'FALLO: el visitante leyó la tabla de derechos';
  end if;
end $$;
reset role;

-- 2. Cupo de publicadas: 2 caben, la tercera no -------------------------------------------------------------
insert into public.properties (id, tenant_id, title, operation, property_type, price_amount, commune, publication_status) values
  ('a0a0a0a0-0000-0000-0000-0000000000a1', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Publicada 1', 'venta', 'casa', 1000, 'Vitacura', 'publicada'),
  ('a0a0a0a0-0000-0000-0000-0000000000a2', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Publicada 2', 'venta', 'casa', 1000, 'Vitacura', 'publicada'),
  ('a0a0a0a0-0000-0000-0000-0000000000a3', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Borrador 3', 'venta', 'casa', 1000, 'Vitacura', 'borrador');

do $$
begin
  begin
    insert into public.properties (id, tenant_id, title, operation, property_type, price_amount, commune, publication_status)
    values ('a0a0a0a0-0000-0000-0000-0000000000a4', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Publicada 3', 'venta', 'casa', 1000, 'Vitacura', 'publicada');
    raise exception 'FALLO: se publicó una propiedad sobre el cupo';
  exception when raise_exception then
    if sqlerrm not like 'limit_reached%' then raise; end if;
  end;
  begin
    update public.properties set publication_status = 'publicada' where id = 'a0a0a0a0-0000-0000-0000-0000000000a3';
    raise exception 'FALLO: se aprobó un borrador sobre el cupo';
  exception when raise_exception then
    if sqlerrm not like 'limit_reached%' then raise; end if;
  end;
end $$;

-- 3. Lo que no suma al cupo sigue funcionando ----------------------------------------------------------------
do $$
begin
  -- editar una ya publicada no cuenta como publicar otra
  update public.properties set title = 'Publicada 1 editada' where id = 'a0a0a0a0-0000-0000-0000-0000000000a1';
  -- los borradores no tienen tope
  insert into public.properties (id, tenant_id, title, operation, property_type, price_amount, commune, publication_status)
  values ('a0a0a0a0-0000-0000-0000-0000000000a5', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Borrador 5', 'venta', 'casa', 1000, 'Vitacura', 'borrador');
  -- despublicar libera cupo y luego se puede aprobar otra
  update public.properties set publication_status = 'borrador' where id = 'a0a0a0a0-0000-0000-0000-0000000000a2';
  update public.properties set publication_status = 'publicada' where id = 'a0a0a0a0-0000-0000-0000-0000000000a3';
  if (select count(*) from public.properties where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1' and publication_status = 'publicada') <> 2 then
    raise exception 'FALLO: debían quedar 2 publicadas';
  end if;
end $$;

-- 4. Sin cupo definido (o sin derechos) no se limita nada -----------------------------------------------------
insert into public.properties (id, tenant_id, title, operation, property_type, price_amount, commune, publication_status) values
  ('b0b0b0b0-0000-0000-0000-0000000000b1', 'b2b2b2b2-0000-0000-0000-0000000000b2', 'B1', 'venta', 'casa', 1, 'Vitacura', 'publicada'),
  ('b0b0b0b0-0000-0000-0000-0000000000b2', 'b2b2b2b2-0000-0000-0000-0000000000b2', 'B2', 'venta', 'casa', 1, 'Vitacura', 'publicada'),
  ('b0b0b0b0-0000-0000-0000-0000000000b3', 'b2b2b2b2-0000-0000-0000-0000000000b2', 'B3', 'venta', 'casa', 1, 'Vitacura', 'publicada');

update public.tenant_entitlements set limits = '{"limit.properties_published": null}' where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
insert into public.properties (id, tenant_id, title, operation, property_type, price_amount, commune, publication_status)
values ('a0a0a0a0-0000-0000-0000-0000000000a6', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Publicada sin límite', 'venta', 'casa', 1, 'Vitacura', 'publicada');

do $$ begin raise exception 'RLS OK: derechos públicos sin datos comerciales y cupo de publicadas en la base (este "error" deshace los datos de prueba a propósito)'; end $$;
