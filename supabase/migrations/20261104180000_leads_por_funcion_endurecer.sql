-- Correcciones de la auditoría de seguridad sobre 20261104160000 y 20261104170000 (esas migraciones ya están aplicadas
-- y no se modifican).
--
-- 1. create_site_lead:
--    * exige un dato de contacto real (teléfono con 8 o más dígitos, o un correo): un envío sin contacto no sirve a la
--      corredora y era la forma más barata de gastar su cupo;
--    * ignora el `id` que mande el cliente (siempre lo genera la base): evita choques y sondeos de identificadores;
--    * cualquier otro error (fecha, número o identificador mal formados, restricciones) sale como `lead_invalido`,
--      sin mensajes internos de Postgres;
--    * search_path vacío: todos los nombres van calificados.
-- 2. Un usuario con sesión ya no lee las propiedades publicadas de OTRAS corredoras con todas las columnas: la
--    política de catálogo público pasa a aplicar solo a visitantes sin sesión. Los miembros siguen viendo todo lo
--    de su corredora con la política "ver todas las de mi corredora".

create or replace function public.create_site_lead(p_tenant uuid, p_lead jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
  v_name text;
  v_email text;
  v_phone text;
  v_digits text;
  v_status text;
  v_prop uuid;
  v_notes text[];
  v_attachments text[];
  v_privacy jsonb;
  v_specs jsonb;
begin
  if p_tenant is null or p_lead is null or jsonb_typeof(p_lead) <> 'object' then
    raise exception 'lead_invalido' using errcode = 'P0001';
  end if;
  if not public.site_is_public(p_tenant) then
    raise exception 'sitio_no_disponible' using errcode = 'P0001';
  end if;

  v_name := btrim(coalesce(p_lead->>'full_name', ''));
  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'lead_invalido' using errcode = 'P0001';
  end if;
  v_email := left(btrim(coalesce(p_lead->>'email', '')), 200);
  v_phone := left(btrim(coalesce(p_lead->>'phone', '')), 30);
  v_digits := regexp_replace(v_phone, '\D', '', 'g');
  if char_length(v_digits) < 8 and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'lead_invalido' using errcode = 'P0001';
  end if;

  v_status := coalesce(p_lead->>'status', 'nuevo');
  if v_status not in ('nuevo', 'visita_agendada') then
    raise exception 'lead_invalido' using errcode = 'P0001';
  end if;

  if (select count(*) from public.leads l
       where l.tenant_id = p_tenant and l.created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'limite_corredora' using errcode = 'P0001';
  end if;
  if char_length(v_digits) >= 8 and (
       select count(*) from public.leads l
        where l.tenant_id = p_tenant and l.created_at > now() - interval '1 hour'
          and right(regexp_replace(l.phone, '\D', '', 'g'), 8) = right(v_digits, 8)) >= 3 then
    raise exception 'limite_contacto' using errcode = 'P0001';
  end if;
  if v_email <> '' and (
       select count(*) from public.leads l
        where l.tenant_id = p_tenant and l.created_at > now() - interval '1 hour'
          and lower(l.email) = lower(v_email)) >= 3 then
    raise exception 'limite_contacto' using errcode = 'P0001';
  end if;

  v_prop := nullif(p_lead->>'property_id', '')::uuid;
  if v_prop is not null and not exists (
       select 1 from public.properties p where p.id = v_prop and p.tenant_id = p_tenant) then
    raise exception 'lead_invalido' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(left(x, 2000)), '{}') into v_notes
    from jsonb_array_elements_text(coalesce(p_lead->'notes', '[]'::jsonb)) as x;
  if cardinality(v_notes) > 20 then
    raise exception 'lead_invalido' using errcode = 'P0001';
  end if;
  select coalesce(array_agg(left(x, 500)), '{}') into v_attachments
    from jsonb_array_elements_text(coalesce(p_lead->'attachments', '[]'::jsonb)) as x;
  if cardinality(v_attachments) > 10 then
    raise exception 'lead_invalido' using errcode = 'P0001';
  end if;

  v_privacy := p_lead->'privacy_notice';
  v_specs := p_lead->'property_specs';
  if (v_privacy is not null and octet_length(v_privacy::text) > 500)
     or (v_specs is not null and octet_length(v_specs::text) > 2000) then
    raise exception 'lead_invalido' using errcode = 'P0001';
  end if;

  insert into public.leads (
    id, tenant_id, full_name, email, phone, property_id, property_title, operation_interest,
    budget_amount, budget_currency, mortgage_status, target_move_date, status,
    appointment_date, appointment_time, notes, source, attachments, property_specs, privacy_notice, attribution
  ) values (
    v_id, p_tenant, v_name, v_email, v_phone, v_prop, left(p_lead->>'property_title', 200), p_lead->>'operation_interest',
    nullif(p_lead->>'budget_amount', '')::numeric, nullif(p_lead->>'budget_currency', ''),
    nullif(p_lead->>'mortgage_status', ''), nullif(p_lead->>'target_move_date', ''), v_status,
    nullif(p_lead->>'appointment_date', '')::date, left(p_lead->>'appointment_time', 10), v_notes,
    p_lead->>'source', v_attachments, v_specs, v_privacy, p_lead->'attribution'
  );
  return v_id;
exception
  when sqlstate 'P0001' then
    raise;
  when others then
    raise exception 'lead_invalido' using errcode = 'P0001';
end;
$$;

revoke all on function public.create_site_lead(uuid, jsonb) from public;
grant execute on function public.create_site_lead(uuid, jsonb) to anon, authenticated;

-- El catálogo público es solo para visitantes sin sesión.
drop policy "properties: catálogo público (solo publicadas)" on public.properties;

create policy "properties: catálogo público (solo publicadas)"
  on public.properties for select
  to anon
  using (publication_status = 'publicada');
