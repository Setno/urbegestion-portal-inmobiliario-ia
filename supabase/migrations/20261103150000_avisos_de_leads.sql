-- H-054: avisar a la corredora cuando entra un lead nuevo, venga de donde venga (sitio, landing, chat).
--  * lead_alert_settings: a quién avisa cada corredora (hasta 3 correos y un chat de Telegram). Solo el administrador
--    la ve y la cambia, con set_lead_alerts, start_telegram_link y unlink_telegram.
--  * Al crearse un lead, la base llama a la función `alerta-lead` (Supabase Edge Functions) con su id. La dirección de
--    la función vive en el Vault (`lead_alert_url`), una por ambiente; sin ella no se llama a nadie.
--  * claim_lead_alert(): la función reclama el aviso de un lead una sola vez (leads.alert_sent_at). Aunque alguien
--    la llame a mano, nunca manda dos avisos del mismo lead ni datos de otra corredora: todo sale de la base.
--  * link_telegram_chat(): el bot de Telegram conecta el chat con el código de un solo uso que pidió el administrador.
--  * Tiempo real: los leads se publican para que el panel abierto los muestre al instante (sujeto a RLS).

create extension if not exists pg_net with schema extensions;

alter table public.leads add column alert_sent_at timestamptz;

create table public.lead_alert_settings (
  tenant_id                uuid primary key references public.tenants (id) on delete cascade,
  emails                   text[] not null default '{}' check (cardinality(emails) <= 3),
  email_enabled            boolean not null default false,
  telegram_chat_id         text check (telegram_chat_id ~ '^-?[0-9]{1,20}$'),
  telegram_enabled         boolean not null default false,
  telegram_link_code       text unique,
  telegram_link_expires_at timestamptz,
  updated_at               timestamptz not null default now(),
  updated_by               uuid references auth.users (id) on delete set null
);

alter table public.lead_alert_settings enable row level security;

-- Solo el administrador ve a quién se avisa; nadie escribe directo.
create policy "lead_alert_settings: el administrador ve la de su corredora"
  on public.lead_alert_settings for select
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = lead_alert_settings.tenant_id and m.user_id = (select auth.uid()) and m.role = 'admin'
    )
  );

create or replace function public.require_tenant_admin(p_tenant uuid)
returns void
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.memberships m
     where m.tenant_id = p_tenant and m.user_id = (select auth.uid()) and m.role = 'admin'
  ) then
    raise exception 'Solo el administrador de la corredora puede cambiar los avisos' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.require_tenant_admin(uuid) from public, anon, authenticated;

-- Correos en minúsculas y sin repetir. Uno mal escrito responde 23514.
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
  values (p_tenant, v_emails, p_email_enabled and cardinality(v_emails) > 0, false, (select auth.uid()))
  on conflict (tenant_id) do update
    set emails = excluded.emails,
        email_enabled = excluded.email_enabled,
        telegram_enabled = p_telegram_enabled and s.telegram_chat_id is not null,
        updated_at = now(),
        updated_by = excluded.updated_by;
end;
$$;

revoke all on function public.set_lead_alerts(uuid, text[], boolean, boolean) from public, anon;
grant execute on function public.set_lead_alerts(uuid, text[], boolean, boolean) to authenticated;

-- Código de un solo uso para el enlace t.me/<bot>?start=<código>; vence en 30 minutos.
create or replace function public.start_telegram_link(p_tenant uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_code text := encode(gen_random_bytes(12), 'hex');
begin
  perform public.require_tenant_admin(p_tenant);
  insert into public.lead_alert_settings as s (tenant_id, telegram_link_code, telegram_link_expires_at, updated_by)
  values (p_tenant, v_code, now() + interval '30 minutes', (select auth.uid()))
  on conflict (tenant_id) do update
    set telegram_link_code = excluded.telegram_link_code,
        telegram_link_expires_at = excluded.telegram_link_expires_at,
        updated_at = now(),
        updated_by = excluded.updated_by;
  return v_code;
end;
$$;

revoke all on function public.start_telegram_link(uuid) from public, anon;
grant execute on function public.start_telegram_link(uuid) to authenticated;

create or replace function public.unlink_telegram(p_tenant uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_tenant_admin(p_tenant);
  update public.lead_alert_settings
     set telegram_chat_id = null, telegram_enabled = false, telegram_link_code = null, telegram_link_expires_at = null,
         updated_at = now(), updated_by = (select auth.uid())
   where tenant_id = p_tenant;
end;
$$;

revoke all on function public.unlink_telegram(uuid) from public, anon;
grant execute on function public.unlink_telegram(uuid) to authenticated;

-- Solo la clave de servicio (la función alerta-lead). Marca el lead como avisado y devuelve qué avisar y a quién;
-- null si ya se avisó, si no existe o si la corredora no tiene avisos prendidos.
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

revoke all on function public.claim_lead_alert(uuid) from public, anon, authenticated;
grant execute on function public.claim_lead_alert(uuid) to service_role;

-- Solo la clave de servicio (el bot de Telegram). Devuelve el nombre de la corredora conectada, o null si el código
-- no existe o venció.
create or replace function public.link_telegram_chat(p_code text, p_chat_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
begin
  update public.lead_alert_settings
     set telegram_chat_id = p_chat_id, telegram_enabled = true, telegram_link_code = null, telegram_link_expires_at = null,
         updated_at = now()
   where telegram_link_code = p_code and telegram_link_expires_at > now()
  returning tenant_id into v_tenant;
  if v_tenant is null then
    return null;
  end if;
  return (select t.name from public.tenants t where t.id = v_tenant);
end;
$$;

revoke all on function public.link_telegram_chat(text, text) from public, anon, authenticated;
grant execute on function public.link_telegram_chat(text, text) to service_role;

-- Al crearse un lead se avisa en segundo plano: si falla la llamada, el lead igual se guarda.
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
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  end if;
  return new;
exception when others then
  raise warning 'No se pudo pedir el aviso del lead %: %', new.id, sqlerrm;
  return new;
end;
$$;

revoke all on function public.leads_notify_alert() from public, anon, authenticated;

create trigger leads_notify_alert_after
  after insert on public.leads
  for each row execute function public.leads_notify_alert();

-- El panel abierto recibe los leads nuevos al instante (Supabase Realtime respeta las políticas de lectura).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.leads;
  end if;
end $$;
