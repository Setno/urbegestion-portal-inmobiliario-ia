-- H-054, correcciones de la revisión:
--  * Tope de avisos: como cualquiera con la clave pública puede crear leads (hasta H-052), una ráfaga de leads falsos
--    gastaría el cupo de correos de toda la plataforma. Más de 20 avisos en 10 minutos para una corredora se marcan
--    como avisados sin enviar (los leads igual quedan en el CRM y se ven en vivo en el panel).
--  * Un lead avisado no vuelve a "sin avisar": si no, editarlo permitiría repetir el aviso.
--  * set_lead_alerts: un valor nulo deja el canal como estaba (así el panel no apaga un Telegram recién conectado).
--  * La llamada a la función espera hasta 20 segundos (envía correo y Telegram, cada uno con hasta 8 segundos).
--  * Los leads anteriores a los avisos quedan marcados como avisados: nadie puede pedir un aviso de un lead viejo.

create or replace function public.set_lead_alerts(p_tenant uuid, p_emails text[], p_email_enabled boolean, p_telegram_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_emails text[];
begin
  perform public.require_tenant_admin(p_tenant);
  select coalesce(array_agg(distinct e), '{}') into v_emails
    from (select lower(btrim(x)) e from unnest(coalesce(p_emails, '{}')) x) t
   where e <> '';
  if exists (select 1 from unnest(v_emails) e where e !~ '^[^\s@"<>,;]+@[^\s@"<>,;]+\.[^\s@"<>,;]+$' or length(e) > 200)
     or cardinality(v_emails) > 3 then
    raise exception 'Correo no válido o más de tres correos' using errcode = '23514';
  end if;

  insert into public.lead_alert_settings as s (tenant_id, emails, email_enabled, telegram_enabled, updated_by)
  -- Telegram solo se prende con un chat ya conectado
  values (p_tenant, v_emails, coalesce(p_email_enabled, false) and cardinality(v_emails) > 0, false, (select auth.uid()))
  on conflict (tenant_id) do update
    set emails = excluded.emails,
        email_enabled = coalesce(p_email_enabled, s.email_enabled) and cardinality(excluded.emails) > 0,
        telegram_enabled = coalesce(p_telegram_enabled, s.telegram_enabled) and s.telegram_chat_id is not null,
        updated_at = now(),
        updated_by = excluded.updated_by;
end;
$$;

create or replace function public.claim_lead_alert(p_lead uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.leads;
  v_cfg  public.lead_alert_settings;
begin
  update public.leads set alert_sent_at = now()
   where id = p_lead and alert_sent_at is null
  returning * into v_lead;
  if not found then
    return null;
  end if;

  -- Tope por corredora: 20 avisos en 10 minutos (incluido este)
  if (select count(*) from public.leads l
       where l.tenant_id = v_lead.tenant_id and l.alert_sent_at > now() - interval '10 minutes') > 20 then
    raise warning 'Tope de avisos alcanzado para la corredora %', v_lead.tenant_id;
    return null;
  end if;

  select * into v_cfg from public.lead_alert_settings where tenant_id = v_lead.tenant_id;
  if not found or not (v_cfg.email_enabled or (v_cfg.telegram_enabled and v_cfg.telegram_chat_id is not null)) then
    return null;
  end if;

  return jsonb_build_object(
    'corredora', coalesce(nullif((select s.brand->>'brandName' from public.site_content s where s.tenant_id = v_lead.tenant_id), ''),
                          (select t.name from public.tenants t where t.id = v_lead.tenant_id)),
    'emails', case when v_cfg.email_enabled then to_jsonb(v_cfg.emails) else '[]'::jsonb end,
    'telegramChatId', case when v_cfg.telegram_enabled then v_cfg.telegram_chat_id end,
    'lead', jsonb_build_object(
      'nombre', v_lead.full_name,
      'telefono', v_lead.phone,
      'correo', v_lead.email,
      'propiedad', v_lead.property_title,
      'origen', v_lead.source,
      'fechaVisita', v_lead.appointment_date,
      'horaVisita', v_lead.appointment_time,
      'creado', v_lead.created_at
    )
  );
end;
$$;

create or replace function public.leads_keep_alert_sent()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.alert_sent_at is not null then
    new.alert_sent_at := old.alert_sent_at;
  end if;
  return new;
end;
$$;

create trigger leads_keep_alert_sent_before
  before update on public.leads
  for each row execute function public.leads_keep_alert_sent();

create or replace function public.leads_notify_alert()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'lead_alert_url' limit 1;
  if v_url is not null then
    perform net.http_post(
      url := v_url,
      body := jsonb_build_object('leadId', new.id),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      timeout_milliseconds := 20000
    );
  end if;
  return new;
exception when others then
  raise warning 'No se pudo pedir el aviso del lead %: %', new.id, sqlerrm;
  return new;
end;
$$;

update public.leads set alert_sent_at = created_at where alert_sent_at is null and created_at < now() - interval '1 minute';
