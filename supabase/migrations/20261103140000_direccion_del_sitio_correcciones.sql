-- H-030 (ADR-012), correcciones de la revisión:
--  * resolve_site(): reemplaza a resolve_site_tenant(). Un dominio propio registrado nunca cae en la corredora por
--    defecto, aunque esté bloqueado por el plan (si no, mostraría otra corredora y le mandaría sus leads). Devuelve
--    además el subdominio y el dominio propio vigente, para que el sitio use una sola dirección canónica (SEO).
--  * set_site_address(): conservar el dominio propio ya guardado no exige `site.custom_domain` (tras bajar de plan se
--    puede seguir cambiando el subdominio), y no se aceptan dominios de Vercel ni locales.

drop function public.resolve_site_tenant(text, text, uuid);

-- Respuesta: {"tenantId", "subdomain", "customDomain"} o null si nadie atiende la dirección o el sitio está apagado.
create or replace function public.resolve_site(p_subdomain text, p_domain text, p_fallback uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_tenant  uuid;
  v_domain  text := regexp_replace(lower(btrim(coalesce(p_domain, ''))), '^www\.', '');
  v_blocked boolean := false;
begin
  if coalesce(p_subdomain, '') <> '' then
    select a.tenant_id into v_tenant from public.site_addresses a where a.subdomain = lower(btrim(p_subdomain));
  elsif v_domain <> '' then
    select a.tenant_id,
           exists (
             select 1 from public.tenant_entitlements e
              where e.tenant_id = a.tenant_id and e.features->>'site.custom_domain' = 'false'
           )
      into v_tenant, v_blocked
      from public.site_addresses a
     where a.custom_domain = v_domain;
    -- Un dominio que es de alguien nunca muestra a otra corredora
    if v_blocked then
      return null;
    end if;
    if not found then
      v_tenant := p_fallback;
    end if;
  else
    v_tenant := p_fallback;
  end if;

  if v_tenant is null or not public.site_is_public(v_tenant) then
    return null;
  end if;

  return (
    select jsonb_build_object(
      'tenantId', v_tenant,
      'subdomain', a.subdomain,
      'customDomain', case
        when exists (
          select 1 from public.tenant_entitlements e
           where e.tenant_id = v_tenant and e.features->>'site.custom_domain' = 'false'
        ) then null
        else a.custom_domain
      end
    )
      from (select 1) uno
      left join public.site_addresses a on a.tenant_id = v_tenant
  );
end;
$$;

revoke all on function public.resolve_site(text, text, uuid) from public;
grant execute on function public.resolve_site(text, text, uuid) to anon, authenticated;

create or replace function public.set_site_address(p_tenant uuid, p_subdomain text, p_custom_domain text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_sub    text := nullif(lower(btrim(coalesce(p_subdomain, ''))), '');
  v_domain text := nullif(regexp_replace(lower(btrim(coalesce(p_custom_domain, ''))), '^www\.', ''), '');
  v_saved  text;
begin
  if not exists (
    select 1 from public.memberships m
     where m.tenant_id = p_tenant and m.user_id = v_uid and m.role = 'admin'
  ) then
    raise exception 'Solo el administrador de la corredora puede cambiar la dirección de su sitio' using errcode = '42501';
  end if;

  -- Direcciones que nunca son de una corredora: las de Vercel y las locales
  if v_domain ~ '(^|\.)(vercel\.app|vercel-dns\.com|localhost)$' then
    raise exception 'Ese dominio no se puede usar' using errcode = '23514';
  end if;

  select a.custom_domain into v_saved from public.site_addresses a where a.tenant_id = p_tenant;

  if exists (
    select 1 from public.tenant_entitlements e
     where e.tenant_id = p_tenant
       and (
         e.status in ('suspended', 'cancelled')
         or (e.status = 'past_due' and e.grace_ends_at < now())
         -- Conservar el dominio ya guardado no cuenta como cambio
         or (v_domain is not null and v_domain is distinct from v_saved and e.features->>'site.custom_domain' = 'false')
       )
  ) then
    raise exception 'El plan de la corredora no permite este cambio' using errcode = '42501';
  end if;

  insert into public.site_addresses as s (tenant_id, subdomain, custom_domain, updated_by)
  values (p_tenant, v_sub, v_domain, v_uid)
  on conflict (tenant_id) do update
    set subdomain = excluded.subdomain,
        custom_domain = excluded.custom_domain,
        updated_at = now(),
        updated_by = v_uid;
end;
$$;
