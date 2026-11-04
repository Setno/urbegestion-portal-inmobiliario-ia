-- Prueba de seguridad del historial de contacto (H-057).
-- Se ejecuta DESPUÉS de aplicar la migración 20261104140000, en el proyecto de DESARROLLO.
-- Termina SIEMPRE con un "error" para que Postgres deshaga todo:
--   * "RLS OK ..." = todas las comprobaciones pasaron (es el resultado esperado).
--   * "FALLO: ..." = algo está mal; el mensaje dice qué regla se rompió.

insert into auth.users (id, instance_id, aud, role, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@ejemplo.test'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@ejemplo.test');

insert into public.tenants (id, name) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Corredora A (prueba RLS)'),
  ('b2b2b2b2-0000-0000-0000-0000000000b2', 'Corredora B (prueba RLS)');

insert into public.memberships (tenant_id, user_id, role) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-00000000000a', 'agente'),
  ('b2b2b2b2-0000-0000-0000-0000000000b2', 'bbbbbbbb-0000-0000-0000-00000000000b', 'admin');

insert into public.leads (id, tenant_id, full_name, operation_interest, status, source) values
  ('a0a0a0a0-0000-0000-0000-0000000000a1', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Lead A', 'compra', 'nuevo', 'asistente_ia'),
  ('b0b0b0b0-0000-0000-0000-0000000000b1', 'b2b2b2b2-0000-0000-0000-0000000000b2', 'Lead B', 'compra', 'nuevo', 'asistente_ia');

-- 1. Un visitante anónimo no puede agregar ni ver historial ---------------------------------------
set local role anon;
do $$
begin
  begin
    insert into public.lead_events (tenant_id, lead_id, kind, text)
      values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'a0a0a0a0-0000-0000-0000-0000000000a1', 'nota', 'x');
    raise exception 'FALLO: un visitante agregó historial';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 2. Un miembro de A agrega un evento y la base fija autor y fechas ------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated","email":"rls-a@ejemplo.test"}', true);
do $$
declare ev record;
begin
  insert into public.lead_events (tenant_id, lead_id, kind, text, author_email, occurred_at, created_at)
    values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'a0a0a0a0-0000-0000-0000-0000000000a1', 'llamada', 'Llamé',
            'falso@otro.cl', now() + interval '10 days', now() - interval '10 days')
    returning * into ev;
  if ev.author_email <> 'rls-a@ejemplo.test' then raise exception 'FALLO: el autor se pudo falsificar (%)', ev.author_email; end if;
  if ev.occurred_at > now() + interval '1 minute' then raise exception 'FALLO: se aceptó una fecha futura'; end if;
  if ev.created_at < now() - interval '1 minute' then raise exception 'FALLO: la fecha de registro se pudo falsificar'; end if;

  -- no puede escribir en la corredora B, ni apuntar a un lead ajeno
  begin
    insert into public.lead_events (tenant_id, lead_id, kind, text)
      values ('b2b2b2b2-0000-0000-0000-0000000000b2', 'b0b0b0b0-0000-0000-0000-0000000000b1', 'nota', 'x');
    raise exception 'FALLO: escribió en otra corredora';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.lead_events (tenant_id, lead_id, kind, text)
      values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'b0b0b0b0-0000-0000-0000-0000000000b1', 'nota', 'x');
    raise exception 'FALLO: apuntó a un lead de otra corredora';
  exception when insufficient_privilege then null;
  end;
  -- tipo inválido y texto vacío
  begin
    insert into public.lead_events (tenant_id, lead_id, kind, text)
      values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'a0a0a0a0-0000-0000-0000-0000000000a1', 'otro', 'x');
    raise exception 'FALLO: aceptó un tipo inválido';
  exception when check_violation then null;
  end;
  begin
    insert into public.lead_events (tenant_id, lead_id, kind, text)
      values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'a0a0a0a0-0000-0000-0000-0000000000a1', 'nota', '');
    raise exception 'FALLO: aceptó un texto vacío';
  exception when check_violation then null;
  end;
end $$;

-- 3. El historial no se edita ni se borra -------------------------------------------------------
do $$
declare n int;
begin
  update public.lead_events set text = 'cambiado';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: se editó el historial'; end if;
  delete from public.lead_events;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: se borró el historial'; end if;
end $$;
reset role;

-- 4. Otra corredora no ve el historial de A -----------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated","email":"rls-b@ejemplo.test"}', true);
do $$
begin
  if (select count(*) from public.lead_events) <> 0 then raise exception 'FALLO: la corredora B ve historial de A'; end if;
end $$;
reset role;

do $$
begin
  if (select count(*) from public.lead_events) <> 1 then raise exception 'FALLO: debía quedar un solo evento'; end if;
  raise exception 'RLS OK: historial de contacto';
end $$;
