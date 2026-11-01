-- Prueba de las reglas de precio con moneda (H-041).
-- Se ejecuta DESPUÉS de aplicar la migración 20261101210000_precio_con_moneda.sql, en el proyecto de DESARROLLO.
-- Termina SIEMPRE con un "error" para que Postgres deshaga todo:
--   * "PRECIO OK ..." = todas las comprobaciones pasaron (es el resultado esperado).
--   * "FALLO: ..." = algo está mal; el mensaje dice qué regla se rompió.

insert into public.tenants (id, name) values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Corredora A (prueba precio)');

do $$
declare p uuid; r text; a numeric;
begin
  -- una propiedad en dólares se acepta y conserva su moneda (los disparadores de publicación siguen funcionando)
  insert into public.properties (tenant_id, title, operation, property_type, price_amount, price_currency, commune)
  values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'En dólares', 'venta', 'casa', 250000.50, 'USD', 'Cancún') returning id into p;
  select price_currency, price_amount into r, a from public.properties where id = p;
  if r <> 'USD' or a <> 250000.50 then raise exception 'FALLO: el precio en USD no quedó guardado (% %)', r, a; end if;

  -- sin indicar moneda queda en UF
  insert into public.properties (tenant_id, title, operation, property_type, price_amount, commune)
  values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Sin moneda', 'venta', 'casa', 100, 'X') returning id into p;
  if (select price_currency from public.properties where id = p) <> 'UF' then raise exception 'FALLO: la moneda por defecto no es UF'; end if;

  begin
    insert into public.properties (tenant_id, title, operation, property_type, price_amount, price_currency, commune)
    values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Moneda mala', 'venta', 'casa', 1, 'usd', 'X');
    raise exception 'FALLO: se aceptó una moneda en minúsculas';
  exception when check_violation then null;
  end;

  begin
    insert into public.properties (tenant_id, title, operation, property_type, price_amount, commune)
    values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Precio negativo', 'venta', 'casa', -5, 'X');
    raise exception 'FALLO: se aceptó un precio negativo';
  exception when check_violation then null;
  end;

  -- el presupuesto de un lead acepta cualquier código de moneda válido
  insert into public.leads (tenant_id, full_name, operation_interest, source, budget_amount, budget_currency)
  values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Lead USD', 'compra', 'asistente_ia', 1000, 'USD');
  begin
    insert into public.leads (tenant_id, full_name, operation_interest, source, budget_amount, budget_currency)
    values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Lead malo', 'compra', 'asistente_ia', 1000, 'x');
    raise exception 'FALLO: se aceptó un código de moneda inválido en el lead';
  exception when check_violation then null;
  end;
end $$;

do $$ begin raise exception 'PRECIO OK: moneda por propiedad y por lead validada (este "error" deshace los datos de prueba a propósito)'; end $$;
