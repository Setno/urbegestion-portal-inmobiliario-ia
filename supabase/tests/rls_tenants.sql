-- Prueba de aislamiento entre corredoras (RLS). Se ejecuta a mano en el SQL Editor del proyecto de DESARROLLO.
-- Crea dos corredoras y dos usuarios ficticios dentro de una transacción y la deshace al final (rollback):
-- no deja datos. Si algo falla, el script termina con un error que dice qué se rompió.
-- Si termina con el aviso "RLS OK", un usuario de la corredora A solo ve lo suyo.

begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('aaaaaaaa-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@ejemplo.test'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@ejemplo.test');

insert into public.tenants (id, name) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Corredora A (prueba RLS)'),
  ('b2b2b2b2-0000-0000-0000-0000000000b2', 'Corredora B (prueba RLS)');

insert into public.memberships (tenant_id, user_id, role) values
  ('a1a1a1a1-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-00000000000a', 'admin'),
  ('b2b2b2b2-0000-0000-0000-0000000000b2', 'bbbbbbbb-0000-0000-0000-00000000000b', 'agente');

-- Actuar como el usuario A
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);

do $$
declare n int;
begin
  select count(*) into n from public.tenants;
  if n <> 1 then raise exception 'FALLO: el usuario A ve % corredoras (debería ver 1)', n; end if;

  select count(*) into n from public.tenants where name like 'Corredora B%';
  if n <> 0 then raise exception 'FALLO: el usuario A ve la corredora B'; end if;

  select count(*) into n from public.memberships;
  if n <> 1 then raise exception 'FALLO: el usuario A ve % membresías (debería ver 1)', n; end if;

  select count(*) into n from public.memberships where role = 'agente';
  if n <> 0 then raise exception 'FALLO: el usuario A ve la membresía de B'; end if;
end $$;

-- Intentar modificar la corredora B como A no debe afectar ninguna fila
do $$
declare n int;
begin
  update public.tenants set name = 'hackeada' where name like 'Corredora B%';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: A pudo modificar % corredoras', n; end if;

  delete from public.memberships;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: A pudo borrar % membresías', n; end if;
end $$;

-- Intentar insertar una membresía propia como A debe ser rechazado
do $$
begin
  begin
    insert into public.memberships (tenant_id, user_id, role)
    values ('b2b2b2b2-0000-0000-0000-0000000000b2', 'aaaaaaaa-0000-0000-0000-00000000000a', 'admin');
    raise exception 'FALLO: A pudo agregarse a la corredora B';
  exception when insufficient_privilege or others then
    if sqlerrm like 'FALLO:%' then raise; end if;
  end;
end $$;

reset role;
do $$ begin raise notice 'RLS OK: el aislamiento entre corredoras funciona'; end $$;

rollback;
