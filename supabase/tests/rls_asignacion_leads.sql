-- Prueba de seguridad de la asignación de leads (H-069.1).
-- Se ejecuta DESPUÉS de aplicar la migración 20261115100000, en el proyecto de DESARROLLO.
-- Termina SIEMPRE con un "error" para que Postgres deshaga todo:
--   * "RLS OK ..." = todas las comprobaciones pasaron (es el resultado esperado).
--   * "FALLO: ..." = algo está mal; el mensaje dice qué regla se rompió.

insert into auth.users (id, instance_id, aud, role, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-admin-a@ejemplo.test'),
  ('cccccccc-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-agente-a@ejemplo.test'),
  ('dddddddd-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-agente2-a@ejemplo.test'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-admin-b@ejemplo.test');

insert into public.tenants (id, name) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Corredora A (prueba RLS)'),
  ('b2b2b2b2-0000-0000-0000-0000000000b2', 'Corredora B (prueba RLS)');

insert into public.memberships (tenant_id, user_id, role) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-00000000000a', 'admin'),
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'cccccccc-0000-0000-0000-00000000000c', 'agente'),
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'dddddddd-0000-0000-0000-00000000000d', 'agente'),
  ('b2b2b2b2-0000-0000-0000-0000000000b2', 'bbbbbbbb-0000-0000-0000-00000000000b', 'admin');

insert into public.leads (id, tenant_id, full_name, operation_interest, source) values
  ('a1000000-0000-0000-0000-0000000000a1', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Lead A1', 'compra', 'asistente_ia'),
  ('a2000000-0000-0000-0000-0000000000a2', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Lead A2', 'compra', 'asistente_ia');

-- 1. El servidor (sin usuario) no puede asignar a alguien de otra corredora ------------------------
do $$
begin
  begin
    update public.leads set assigned_to = 'bbbbbbbb-0000-0000-0000-00000000000b' where id = 'a1000000-0000-0000-0000-0000000000a1';
    raise exception 'FALLO: se asignó un lead a un miembro de otra corredora';
  exception when check_violation then null;
  end;
end $$;

-- 2. El equipo: lo ve un miembro, no alguien de otra corredora ni un visitante ---------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}', true);
do $$
declare
  v_filas int;
begin
  select count(*) into v_filas from public.team_members('a1a1a1a1-0000-0000-0000-0000000000a1');
  if v_filas <> 3 then
    raise exception 'FALLO: el agente debía ver 3 miembros de su corredora y vio %', v_filas;
  end if;
  select count(*) into v_filas from public.team_members('b2b2b2b2-0000-0000-0000-0000000000b2');
  if v_filas <> 0 then
    raise exception 'FALLO: el agente vio % miembros de otra corredora', v_filas;
  end if;
end $$;
reset role;

set local role anon;
do $$
begin
  begin
    perform 1 from public.team_members('a1a1a1a1-0000-0000-0000-0000000000a1');
    raise exception 'FALLO: un visitante pudo ver el equipo';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 3. El administrador asigna a cualquiera de su corredora -------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
update public.leads set assigned_to = 'dddddddd-0000-0000-0000-00000000000d' where id = 'a1000000-0000-0000-0000-0000000000a1';
do $$
begin
  if not exists (select 1 from public.leads where id = 'a1000000-0000-0000-0000-0000000000a1'
                 and assigned_to = 'dddddddd-0000-0000-0000-00000000000d') then
    raise exception 'FALLO: el administrador no pudo asignar el lead';
  end if;
end $$;

-- 4. Un agente: no quita el lead de otro, no asigna a otro; sí toma uno libre y lo suelta ----------
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}', true);
do $$
begin
  begin
    update public.leads set assigned_to = 'cccccccc-0000-0000-0000-00000000000c' where id = 'a1000000-0000-0000-0000-0000000000a1';
    raise exception 'FALLO: un agente se quedó con el lead de otro agente';
  exception when raise_exception then null;
  end;
  begin
    update public.leads set assigned_to = null where id = 'a1000000-0000-0000-0000-0000000000a1';
    raise exception 'FALLO: un agente soltó el lead de otro agente';
  exception when raise_exception then null;
  end;
  begin
    update public.leads set assigned_to = 'dddddddd-0000-0000-0000-00000000000d' where id = 'a2000000-0000-0000-0000-0000000000a2';
    raise exception 'FALLO: un agente asignó un lead libre a otro agente';
  exception when raise_exception then null;
  end;
end $$;

update public.leads set assigned_to = 'cccccccc-0000-0000-0000-00000000000c' where id = 'a2000000-0000-0000-0000-0000000000a2';
update public.leads set assigned_to = null where id = 'a2000000-0000-0000-0000-0000000000a2';
-- Cambiar otra cosa de un lead ajeno sigue permitido (la visibilidad y la edición no cambian)
update public.leads set status = 'contactado' where id = 'a1000000-0000-0000-0000-0000000000a1';

-- 5. Al crear: un agente no crea un lead asignado a otro, pero sí a sí mismo ---------------------------
do $$
begin
  begin
    insert into public.leads (tenant_id, full_name, operation_interest, source, assigned_to)
    values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Lead para otro', 'compra', 'formulario_contacto', 'dddddddd-0000-0000-0000-00000000000d');
    raise exception 'FALLO: un agente creó un lead asignado a otro agente';
  exception when raise_exception then null;
  end;
end $$;
insert into public.leads (id, tenant_id, full_name, operation_interest, source, assigned_to)
values ('a3000000-0000-0000-0000-0000000000a3', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Lead propio', 'compra', 'formulario_contacto', 'cccccccc-0000-0000-0000-00000000000c');

-- 6. El administrador no asigna a alguien de otra corredora -------------------------------------------
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  begin
    update public.leads set assigned_to = 'bbbbbbbb-0000-0000-0000-00000000000b' where id = 'a2000000-0000-0000-0000-0000000000a2';
    raise exception 'FALLO: el administrador asignó un lead a un miembro de otra corredora';
  exception when check_violation then null;
  end;
end $$;

-- 7. Alguien de otra corredora: no reasigna, y no puede averiguar quién es miembro de A ------------
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
declare
  v_filas int;
begin
  with cambio as (
    update public.leads set assigned_to = 'bbbbbbbb-0000-0000-0000-00000000000b'
    where id = 'a2000000-0000-0000-0000-0000000000a2' returning 1
  ) select count(*) into v_filas from cambio;
  if v_filas <> 0 then
    raise exception 'FALLO: el administrador de otra corredora cambió el responsable de un lead de A';
  end if;
  -- Un miembro real de A y un id cualquiera tienen que dar el MISMO rechazo
  begin
    insert into public.leads (tenant_id, full_name, operation_interest, source, assigned_to)
    values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Sondeo', 'compra', 'formulario_contacto', 'cccccccc-0000-0000-0000-00000000000c');
    raise exception 'FALLO: alguien de otra corredora creó un lead en A';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.leads (tenant_id, full_name, operation_interest, source, assigned_to)
    values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Sondeo', 'compra', 'formulario_contacto', '99999999-0000-0000-0000-000000000099');
    raise exception 'FALLO: alguien de otra corredora creó un lead en A';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

do $$
begin
  if not exists (select 1 from public.leads where id = 'a3000000-0000-0000-0000-0000000000a3' and assigned_to = 'cccccccc-0000-0000-0000-00000000000c') then
    raise exception 'FALLO: el agente no pudo crear un lead asignado a sí mismo';
  end if;
  if exists (select 1 from public.leads where id = 'a2000000-0000-0000-0000-0000000000a2' and assigned_to is not null) then
    raise exception 'FALLO: el agente no pudo soltar el lead que tomó';
  end if;
  if not exists (select 1 from public.leads where id = 'a1000000-0000-0000-0000-0000000000a1'
                 and status = 'contactado' and assigned_to = 'dddddddd-0000-0000-0000-00000000000d') then
    raise exception 'FALLO: el agente no pudo cambiar la etapa de un lead ajeno, o cambió su responsable';
  end if;
  raise exception 'RLS OK: solo miembros de la corredora son responsables, el administrador asigna y el agente toma o suelta lo suyo';
end $$;
