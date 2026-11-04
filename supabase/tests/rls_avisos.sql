-- Prueba de seguridad de los avisos de leads (H-054).
-- Se ejecuta DESPUÉS de aplicar la migración 20261103150000, en el proyecto de DESARROLLO.
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

-- 1. Visitantes, agentes y el administrador de otra corredora no cambian los avisos -----------------
set local role anon;
do $$
begin
  begin
    perform public.set_lead_alerts('a1a1a1a1-0000-0000-0000-0000000000a1', array['robado@x.cl'], true, false);
    raise exception 'FALLO: un visitante cambió los avisos';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.claim_lead_alert('00000000-0000-0000-0000-000000000001');
    raise exception 'FALLO: un visitante pudo reclamar un aviso';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.link_telegram_chat('a', '1');
    raise exception 'FALLO: un visitante pudo conectar un chat';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.set_lead_alerts('a1a1a1a1-0000-0000-0000-0000000000a1', array['agente@x.cl'], true, false);
    raise exception 'FALLO: un agente cambió los avisos';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.start_telegram_link('a1a1a1a1-0000-0000-0000-0000000000a1');
    raise exception 'FALLO: un agente pidió un enlace de Telegram';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.claim_lead_alert('00000000-0000-0000-0000-000000000001');
    raise exception 'FALLO: un usuario con sesión pudo reclamar un aviso';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.set_lead_alerts('a1a1a1a1-0000-0000-0000-0000000000a1', array['b@x.cl'], true, false);
    raise exception 'FALLO: el administrador de B cambió los avisos de A';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.unlink_telegram('a1a1a1a1-0000-0000-0000-0000000000a1');
    raise exception 'FALLO: el administrador de B desconectó el Telegram de A';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 2. El administrador guarda correos limpios; uno mal escrito o más de tres se rechazan ---------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.set_lead_alerts('a1a1a1a1-0000-0000-0000-0000000000a1', array[' Ana@CasaSur.cl ', 'ana@casasur.cl', ''], true, true);
do $$
begin
  if (select emails from public.lead_alert_settings where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1') <> array['ana@casasur.cl'] then
    raise exception 'FALLO: los correos no quedaron en minúsculas y sin repetir';
  end if;
  if (select telegram_enabled from public.lead_alert_settings where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1') then
    raise exception 'FALLO: Telegram quedó prendido sin un chat conectado';
  end if;
  begin
    perform public.set_lead_alerts('a1a1a1a1-0000-0000-0000-0000000000a1', array['mal correo'], true, false);
    raise exception 'FALLO: se aceptó un correo mal escrito';
  exception when check_violation then null;
  end;
  begin
    perform public.set_lead_alerts('a1a1a1a1-0000-0000-0000-0000000000a1', array['a@x.cl', 'b@x.cl', 'c@x.cl', 'd@x.cl'], true, false);
    raise exception 'FALLO: se aceptaron más de tres correos';
  exception when check_violation then null;
  end;
end $$;
reset role;

-- 3. Solo el administrador lee la configuración ------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from public.lead_alert_settings) <> 0 then raise exception 'FALLO: un agente leyó los avisos'; end if;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from public.lead_alert_settings) <> 0 then raise exception 'FALLO: el administrador de B leyó los avisos de A'; end if;
end $$;
reset role;

-- 4. Conectar Telegram con el código de un solo uso --------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select set_config('prueba.codigo', public.start_telegram_link('a1a1a1a1-0000-0000-0000-0000000000a1'), true);
reset role;
set local role service_role;
do $$
declare v_codigo text := current_setting('prueba.codigo');
begin
  if v_codigo !~ '^[0-9a-f]{24}$' then raise exception 'FALLO: el código no tiene el formato esperado (%)', v_codigo; end if;
  if public.link_telegram_chat(v_codigo, '987654') <> 'Corredora A (prueba RLS)' then
    raise exception 'FALLO: el código válido no conectó el chat';
  end if;
  if public.link_telegram_chat(v_codigo, '111') is not null then
    raise exception 'FALLO: un código se pudo usar dos veces';
  end if;
end $$;
reset role;
do $$ begin
  if (select telegram_chat_id || '/' || telegram_enabled from public.lead_alert_settings where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1') <> '987654/true' then
    raise exception 'FALLO: el chat no quedó conectado y prendido';
  end if;
end $$;
update public.lead_alert_settings set telegram_link_code = 'ffffffffffffffffffffffff', telegram_link_expires_at = now() - interval '1 minute'
 where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
set local role service_role;
do $$ begin
  if public.link_telegram_chat('ffffffffffffffffffffffff', '222') is not null then raise exception 'FALLO: un código vencido conectó un chat'; end if;
end $$;
reset role;

-- 5. El aviso de un lead se reclama una sola vez y trae solo lo de su corredora ------------------------
insert into public.leads (id, tenant_id, full_name, phone, operation_interest, status, source, notes)
values ('dddddddd-0000-0000-0000-00000000000d', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Luis Prueba', '+56911112222', 'compra', 'nuevo', 'ficha_propiedad', '{}'),
       ('eeeeeeee-0000-0000-0000-00000000000e', 'b2b2b2b2-0000-0000-0000-0000000000b2', 'Sin avisos', '+56933334444', 'compra', 'nuevo', 'ficha_propiedad', '{}');
set local role service_role;
do $$
declare d jsonb;
begin
  d := public.claim_lead_alert('dddddddd-0000-0000-0000-00000000000d');
  if d->>'corredora' <> 'Corredora A (prueba RLS)' or d->'emails' <> '["ana@casasur.cl"]'::jsonb
     or d->>'telegramChatId' <> '987654' or d->'lead'->>'nombre' <> 'Luis Prueba' then
    raise exception 'FALLO: el aviso no trae lo esperado (%)', d;
  end if;
  if public.claim_lead_alert('dddddddd-0000-0000-0000-00000000000d') is not null then
    raise exception 'FALLO: el mismo lead se pudo avisar dos veces';
  end if;
  if public.claim_lead_alert('eeeeeeee-0000-0000-0000-00000000000e') is not null then
    raise exception 'FALLO: una corredora sin avisos configurados recibió uno';
  end if;
end $$;
reset role;

-- 6. Desconectar Telegram lo apaga ------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.unlink_telegram('a1a1a1a1-0000-0000-0000-0000000000a1');
do $$ begin
  if (select telegram_chat_id is null and not telegram_enabled from public.lead_alert_settings where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1') is not true then
    raise exception 'FALLO: desconectar no borró el chat';
  end if;
end $$;
reset role;

-- 7. Correcciones (20261103160000): nulo no cambia el canal, un lead avisado no vuelve atrás, tope de avisos ----
update public.lead_alert_settings set telegram_chat_id = '555', telegram_enabled = true where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.set_lead_alerts('a1a1a1a1-0000-0000-0000-0000000000a1', array['ana@casasur.cl'], true, null);
reset role;
do $$ begin
  if not (select telegram_enabled from public.lead_alert_settings where tenant_id = 'a1a1a1a1-0000-0000-0000-0000000000a1') then
    raise exception 'FALLO: guardar los correos sin tocar Telegram lo apagó';
  end if;
end $$;
update public.leads set alert_sent_at = null where id = 'dddddddd-0000-0000-0000-00000000000d';
do $$ begin
  if (select alert_sent_at from public.leads where id = 'dddddddd-0000-0000-0000-00000000000d') is null then
    raise exception 'FALLO: un lead avisado volvió a "sin avisar"';
  end if;
end $$;
insert into public.leads (tenant_id, full_name, phone, operation_interest, status, source, notes)
select 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Ráfaga ' || n, '+5690000' || lpad(n::text, 4, '0'), 'compra', 'nuevo', 'ficha_propiedad', '{}'
  from generate_series(1, 21) n;
set local role service_role;
do $$
declare v_avisados int := 0; r record;
begin
  for r in select id from public.leads where full_name like 'Ráfaga %' order by full_name loop
    if public.claim_lead_alert(r.id) is not null then v_avisados := v_avisados + 1; end if;
  end loop;
  -- El lead "dddd" ya contó como avisado en estos 10 minutos: quedan 19 avisos para la ráfaga
  if v_avisados <> 19 then raise exception 'FALLO: el tope de avisos no funcionó (se avisaron %)', v_avisados; end if;
end $$;
reset role;

do $$ begin raise exception 'RLS OK: los avisos de leads solo los configura el administrador, se envían una vez por lead y Telegram se conecta con un código de un solo uso (este "error" deshace los datos de prueba a propósito)'; end $$;
