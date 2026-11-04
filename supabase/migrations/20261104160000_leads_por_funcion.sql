-- H-052 / H-055: los visitantes dejan de insertar directo en `leads`.
--
-- Hasta ahora la política de insert permitía, con la clave pública, crear un lead en CUALQUIER corredora (aunque su
-- sitio estuviera apagado), con cualquier columna y en cualquier cantidad. Ahora el sitio y la landing llaman a
-- `create_site_lead`, que valida todo en la base:
--   * la corredora existe y su sitio está activo (plan vigente);
--   * solo se aceptan las columnas de un contacto (nada de aviso de alerta, próxima acción ni vínculos internos);
--   * tamaños acotados y la propiedad, si viene, debe ser de la misma corredora;
--   * topes: 60 leads por corredora cada 10 minutos, y 3 por mismo teléfono o correo en una hora.
-- Los miembros de una corredora siguen pudiendo crear leads desde el panel, pero solo en su propia corredora.

create or replace function public.create_site_lead(p_tenant uuid, p_lead jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
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

  v_status := coalesce(p_lead->>'status', 'nuevo');
  if v_status not in ('nuevo', 'visita_agendada') then
    raise exception 'lead_invalido' using errcode = 'P0001';
  end if;

  -- Topes de envío
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

  v_id := coalesce(nullif(p_lead->>'id', '')::uuid, gen_random_uuid());

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
end;
$$;

revoke all on function public.create_site_lead(uuid, jsonb) from public;
grant execute on function public.create_site_lead(uuid, jsonb) to anon, authenticated;

-- Insert directo: solo los miembros de la corredora, y solo en la suya.
drop policy "leads: el sitio puede crear un lead nuevo" on public.leads;

create policy "leads: mi corredora crea leads"
  on public.leads for insert
  to authenticated
  with check (
    exists (select 1 from public.memberships m
            where m.tenant_id = leads.tenant_id and m.user_id = (select auth.uid()))
    and cardinality(notes) <= 20
    and (
      property_id is null
      or exists (select 1 from public.properties p
                 where p.id = leads.property_id and p.tenant_id = leads.tenant_id)
    )
  );
