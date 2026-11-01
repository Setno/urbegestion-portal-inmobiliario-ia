-- Prueba de seguridad (RLS) de fotos en Storage y de append_lead_note (H-009.5).
-- Se ejecuta en el proyecto de DESARROLLO. Termina SIEMPRE con un "error" para que Postgres deshaga todo:
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

insert into public.leads (id, tenant_id, full_name, operation_interest, source, notes) values
  ('a1000000-0000-0000-0000-0000000000a1', 'a1a1a1a1-0000-0000-0000-0000000000a1', 'Lead A', 'compra', 'asistente_ia', '{n1}');

-- Storage bloquea los DELETE directos salvo que se avise; aquí solo vale dentro de esta prueba que se deshace.
select set_config('storage.allow_delete_query', 'true', true);

-- 1. Visitante sin sesión ----------------------------------------------------
set local role anon;

do $$
begin
  begin
    insert into storage.objects (bucket_id, name, owner_id)
    values ('property-images', 'a1a1a1a1-0000-0000-0000-0000000000a1/visita.jpg', null);
    raise exception 'FALLO: el visitante pudo subir una foto';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.append_lead_note('a1000000-0000-0000-0000-0000000000a1', 'intruso');
    raise exception 'FALLO: el visitante pudo ejecutar append_lead_note';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;

-- 2. Agente de la corredora A --------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}', true);

do $$
declare n int; notas text[];
begin
  insert into storage.objects (bucket_id, name, owner_id)
  values ('property-images', 'a1a1a1a1-0000-0000-0000-0000000000a1/foto1.jpg', 'cccccccc-0000-0000-0000-00000000000c');

  begin
    insert into storage.objects (bucket_id, name, owner_id)
    values ('property-images', 'b2b2b2b2-0000-0000-0000-0000000000b2/intruso.jpg', 'cccccccc-0000-0000-0000-00000000000c');
    raise exception 'FALLO: un agente de A subió una foto a la carpeta de B';
  exception when insufficient_privilege then null;
  end;

  delete from storage.objects where bucket_id = 'property-images' and name = 'a1a1a1a1-0000-0000-0000-0000000000a1/foto1.jpg';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: un agente pudo borrar una foto (solo el admin puede)'; end if;

  perform public.append_lead_note('a1000000-0000-0000-0000-0000000000a1', 'n2');
  select notes into notas from public.leads where id = 'a1000000-0000-0000-0000-0000000000a1';
  if notas <> array['n1', 'n2'] then raise exception 'FALLO: la nota no se agregó al final (quedó %)', notas; end if;
end $$;

reset role;

-- 3. Agente de la corredora B --------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}', true);

do $$
declare n int;
begin
  begin
    insert into storage.objects (bucket_id, name, owner_id)
    values ('property-images', 'a1a1a1a1-0000-0000-0000-0000000000a1/de-b.jpg', 'bbbbbbbb-0000-0000-0000-00000000000b');
    raise exception 'FALLO: un agente de B subió una foto a la carpeta de A';
  exception when insufficient_privilege then null;
  end;

  select count(*) into n from storage.objects where bucket_id = 'property-images' and name like 'a1a1a1a1%';
  if n <> 0 then raise exception 'FALLO: un agente de B ve % fotos de la carpeta de A', n; end if;

  perform public.append_lead_note('a1000000-0000-0000-0000-0000000000a1', 'ajena');
end $$;

reset role;

do $$
declare notas text[];
begin
  select notes into notas from public.leads where id = 'a1000000-0000-0000-0000-0000000000a1';
  if 'ajena' = any(notas) then raise exception 'FALLO: un agente de B agregó una nota a un lead de A'; end if;
end $$;

-- 4. Administrador de la corredora A ---------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);

do $$
declare n int;
begin
  delete from storage.objects where bucket_id = 'property-images' and name = 'a1a1a1a1-0000-0000-0000-0000000000a1/foto1.jpg';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FALLO: el administrador no pudo borrar una foto de su corredora'; end if;
end $$;

reset role;

do $$ begin raise exception 'RLS OK: fotos y notas aisladas por corredora (este "error" deshace los datos de prueba a propósito)'; end $$;
