-- Prueba de seguridad (RLS y reglas del flujo) de aprobación de publicaciones (H-037).
-- Se ejecuta DESPUÉS de aplicar la migración 20261101150000_publicacion_aprobacion.sql, en el proyecto de DESARROLLO.
-- Termina SIEMPRE con un "error" para que Postgres deshaga todo:
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

-- Datos de ejemplo cargados sin usuario (como el SQL Editor): una publicada y una en revisión de la corredora A.
insert into public.properties (id, tenant_id, title, operation, property_type, price_amount, commune, publication_status) values
  ('a0a0a0a0-0000-0000-0000-0000000000a1', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Publicada A', 'venta', 'casa', 1000, 'Vitacura', 'publicada'),
  ('a0a0a0a0-0000-0000-0000-0000000000a2', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Borrador A', 'venta', 'casa', 1000, 'Vitacura', 'borrador');

-- 1. Visitante sin sesión: solo ve lo publicado -------------------------------
set local role anon;
do $$
declare n int;
begin
  select count(*) into n from public.properties where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
  if n <> 1 then raise exception 'FALLO: el visitante ve % propiedades de la corredora A (debería ver 1: solo la publicada)', n; end if;
end $$;
reset role;

-- 2. Agente de la corredora A -------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}', true);
do $$
declare n int; st text; ab uuid;
begin
  select count(*) into n from public.properties where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
  if n <> 2 then raise exception 'FALLO: el agente ve % propiedades de su corredora (debería ver 2)', n; end if;

  -- Intenta crear directamente publicada: la base la deja en borrador y fija quién la creó.
  insert into public.properties (id, tenant_id, title, operation, property_type, price_amount, commune, publication_status)
  values ('a0a0a0a0-0000-0000-0000-0000000000a3', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Del agente', 'venta', 'casa', 500, 'Lo Barnechea', 'publicada');
  select publication_status, approved_by into st, ab from public.properties where id = 'a0a0a0a0-0000-0000-0000-0000000000a3';
  if st <> 'borrador' then raise exception 'FALLO: un agente creó una propiedad "%" (debería quedar borrador)', st; end if;
  if ab is not null then raise exception 'FALLO: una propiedad del agente quedó con aprobador'; end if;
  if (select created_by from public.properties where id = 'a0a0a0a0-0000-0000-0000-0000000000a3') <> 'cccccccc-0000-0000-0000-00000000000c' then
    raise exception 'FALLO: created_by no es el agente que la creó';
  end if;

  -- Enviar a revisión sí puede.
  update public.properties set publication_status = 'en_revision' where id = 'a0a0a0a0-0000-0000-0000-0000000000a3';
  select publication_status into st from public.properties where id = 'a0a0a0a0-0000-0000-0000-0000000000a3';
  if st <> 'en_revision' then raise exception 'FALLO: el agente no pudo enviar a revisión (quedó %)', st; end if;

  -- Intenta publicarla él mismo: se queda en revisión.
  update public.properties set publication_status = 'publicada' where id = 'a0a0a0a0-0000-0000-0000-0000000000a3';
  select publication_status, approved_by into st, ab from public.properties where id = 'a0a0a0a0-0000-0000-0000-0000000000a3';
  if st = 'publicada' or ab is not null then raise exception 'FALLO: un agente pudo publicar una propiedad'; end if;

  -- Editar una propiedad ya publicada la devuelve a revisión.
  update public.properties set title = 'Publicada A (editada)' where id = 'a0a0a0a0-0000-0000-0000-0000000000a1';
  select publication_status into st from public.properties where id = 'a0a0a0a0-0000-0000-0000-0000000000a1';
  if st <> 'en_revision' then raise exception 'FALLO: editar una publicada no la devolvió a revisión (quedó %)', st; end if;

  -- No puede escribir en el registro de eventos.
  begin
    insert into public.property_events (property_id, tenant_id, action)
    values ('a0a0a0a0-0000-0000-0000-0000000000a1', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'falsa');
    raise exception 'FALLO: un agente escribió en property_events';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 3. Agente de la corredora B: no ve borradores ni revisiones de A, no los cambia ----
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.properties where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
  if n <> 0 then raise exception 'FALLO: un agente de B ve % propiedades de A (todas están en borrador o revisión)', n; end if;

  update public.properties set title = 'intruso' where id = 'a0a0a0a0-0000-0000-0000-0000000000a2';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: un agente de B cambió una propiedad de A'; end if;

  select count(*) into n from public.property_events;
  if n <> 0 then raise exception 'FALLO: un agente de B ve % eventos de A', n; end if;
end $$;
reset role;

-- 4. Administrador de la corredora A: aprueba y rechaza -----------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
declare st text; ab uuid; aa timestamptz; motivo text; n int;
begin
  update public.properties set publication_status = 'publicada' where id = 'a0a0a0a0-0000-0000-0000-0000000000a3';
  select publication_status, approved_by, approved_at into st, ab, aa from public.properties where id = 'a0a0a0a0-0000-0000-0000-0000000000a3';
  if st <> 'publicada' then raise exception 'FALLO: el administrador no pudo aprobar (quedó %)', st; end if;
  if ab <> 'aaaaaaaa-0000-0000-0000-00000000000a' or aa is null then raise exception 'FALLO: la base no registró quién aprobó y cuándo'; end if;

  begin
    update public.properties set publication_status = 'rechazada' where id = 'a0a0a0a0-0000-0000-0000-0000000000a1';
    raise exception 'FALLO: el administrador rechazó sin motivo';
  exception when raise_exception then
    if sqlerrm like 'FALLO%' then raise; end if;
  end;

  update public.properties set publication_status = 'rechazada', rejection_reason = 'Faltan fotos' where id = 'a0a0a0a0-0000-0000-0000-0000000000a1';
  select publication_status, rejection_reason into st, motivo from public.properties where id = 'a0a0a0a0-0000-0000-0000-0000000000a1';
  if st <> 'rechazada' or motivo <> 'Faltan fotos' then raise exception 'FALLO: el rechazo con motivo no quedó guardado'; end if;

  select count(*) into n from public.property_events where property_id = 'a0a0a0a0-0000-0000-0000-0000000000a3';
  if n < 3 then raise exception 'FALLO: el registro de eventos tiene % entradas de la propiedad del agente (esperaba al menos 3)', n; end if;
  if not exists (select 1 from public.property_events where property_id = 'a0a0a0a0-0000-0000-0000-0000000000a3' and action = 'aprobada' and actor = 'aaaaaaaa-0000-0000-0000-00000000000a') then
    raise exception 'FALLO: no quedó el evento "aprobada" con el administrador como autor';
  end if;
end $$;
reset role;

-- 5. Modo "directa": el administrador lo activa y cada agente publica lo suyo ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.set_publication_mode('directa');
    raise exception 'FALLO: un agente pudo cambiar el modo de publicación';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.set_publication_mode('directa');
reset role;

do $$
begin
  if (select publication_mode from public.tenants where id = 'a1a1a1a1-0000-0000-0000-0000000000a1') <> 'directa' then
    raise exception 'FALLO: el administrador no pudo activar el modo directa';
  end if;
  if (select publication_mode from public.tenants where id = 'b2b2b2b2-0000-0000-0000-0000000000b2') <> 'con_aprobacion' then
    raise exception 'FALLO: el cambio afectó a otra corredora';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}', true);
do $$
declare st text; ab uuid;
begin
  insert into public.properties (id, tenant_id, title, operation, property_type, price_amount, commune, publication_status)
  values ('a0a0a0a0-0000-0000-0000-0000000000a4', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Directa del agente', 'venta', 'casa', 700, 'Vitacura', 'publicada');
  select publication_status, approved_by into st, ab from public.properties where id = 'a0a0a0a0-0000-0000-0000-0000000000a4';
  if st <> 'publicada' then raise exception 'FALLO: en modo directa el agente no pudo publicar (quedó %)', st; end if;
  if ab <> 'cccccccc-0000-0000-0000-00000000000c' then raise exception 'FALLO: no quedó registrado el agente como responsable de la publicación'; end if;

  update public.properties set title = 'Directa editada' where id = 'a0a0a0a0-0000-0000-0000-0000000000a4';
  select publication_status into st from public.properties where id = 'a0a0a0a0-0000-0000-0000-0000000000a4';
  if st <> 'publicada' then raise exception 'FALLO: en modo directa editar una publicada la sacó del sitio (quedó %)', st; end if;
end $$;
reset role;

-- Un agente de la corredora B (con aprobación) sigue sin poder publicar.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
declare st text;
begin
  insert into public.properties (id, tenant_id, title, operation, property_type, price_amount, commune, publication_status)
  values ('b0b0b0b0-0000-0000-0000-0000000000b9', 'b2b2b2b2-0000-0000-0000-0000000000b2', 'De B', 'venta', 'casa', 700, 'Providencia', 'publicada');
  select publication_status into st from public.properties where id = 'b0b0b0b0-0000-0000-0000-0000000000b9';
  if st <> 'borrador' then raise exception 'FALLO: un agente de una corredora con aprobación pudo publicar (quedó %)', st; end if;
end $$;
reset role;

do $$ begin raise exception 'RLS OK: el flujo de aprobación y su trazabilidad funcionan y están aislados por corredora (este "error" deshace los datos de prueba a propósito)'; end $$;
