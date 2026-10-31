-- Datos de DESARROLLO (proyecto urbegestion-dev). No es una migración: se ejecuta a mano en el SQL Editor.
-- Asocia tu usuario de prueba a la corredora "UrbeGestión (dev)" como administrador.
-- Antes de ejecutar, cambia el correo de la línea marcada por el de tu usuario de prueba.

insert into public.tenants (name) values ('UrbeGestión (dev)')
on conflict (name) do nothing;

insert into public.memberships (tenant_id, user_id, role)
select t.id, u.id, 'admin'
from public.tenants t
join auth.users u on u.email = 'setnoboigres@gmail.com'   -- <- tu correo de prueba
where t.name = 'UrbeGestión (dev)'
on conflict (tenant_id, user_id) do nothing;

-- Para probar el rol de agente, crea otro usuario de prueba en Authentication > Users y usa:
-- insert into public.memberships (tenant_id, user_id, role)
-- select t.id, u.id, 'agente' from public.tenants t join auth.users u on u.email = 'OTRO-CORREO@ejemplo.com'
-- where t.name = 'UrbeGestión (dev)' on conflict (tenant_id, user_id) do nothing;
