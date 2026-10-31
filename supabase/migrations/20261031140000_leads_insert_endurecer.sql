-- Correcciones de la revisión de H-009 sobre la migración 20261031130000 (ya aplicada, no se modifica).
--
-- 1. Un visitante que agenda una visita crea el lead ya con estado 'visita_agendada' (modal de agenda y asistente).
--    La política anterior solo admitía 'nuevo' y esos leads se perdían en silencio.
-- 2. El lead creado desde el sitio solo puede apuntar a una propiedad de la MISMA corredora y no puede traer
--    una cantidad desproporcionada de notas.
-- 3. Una fila no puede cambiar de corredora después de creada (evita que un usuario con membresía en dos
--    corredoras mueva datos de una a otra).
-- 4. properties.updated_at lo mantiene la base, no el navegador.

drop policy "leads: el sitio puede crear un lead nuevo" on public.leads;

create policy "leads: el sitio puede crear un lead nuevo"
  on public.leads for insert
  to anon, authenticated
  with check (
    status in ('nuevo', 'visita_agendada')
    and cardinality(notes) <= 20
    and (
      property_id is null
      or exists (select 1 from public.properties p
                 where p.id = leads.property_id and p.tenant_id = leads.tenant_id)
    )
  );

create function public.impedir_cambio_de_corredora()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.tenant_id is distinct from old.tenant_id then
    raise exception 'No se puede cambiar la corredora de un registro';
  end if;
  return new;
end;
$$;

create trigger leads_tenant_inmutable
  before update on public.leads
  for each row execute function public.impedir_cambio_de_corredora();

create trigger properties_tenant_inmutable
  before update on public.properties
  for each row execute function public.impedir_cambio_de_corredora();

create function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger properties_updated_at
  before update on public.properties
  for each row execute function public.tocar_updated_at();
