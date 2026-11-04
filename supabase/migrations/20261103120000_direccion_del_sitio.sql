-- H-030 (ADR-012): dirección del sitio de cada corredora, por subdominio de la plataforma o dominio propio.
--  * site_addresses: una fila por corredora con su subdominio (la etiqueta, sin el dominio de la plataforma)
--    y su dominio propio. Ambos son únicos en toda la plataforma.
--  * resolve_site_tenant(): lo que el sitio pregunta en cada visita: ¿qué corredora atiende esta dirección?
--    Devuelve null si la corredora no puede mostrar su sitio (cancelada, suspendida o sin `site.enabled`),
--    lo que cierra la decisión pendiente de ADR-011.
--  * set_site_address(): solo el administrador de esa corredora; el dominio propio exige `site.custom_domain`.

create table public.site_addresses (
  tenant_id     uuid primary key references public.tenants (id) on delete cascade,
  subdomain     text unique check (
    subdomain ~ '^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$'
    and subdomain not in ('www', 'app', 'api', 'admin', 'consola', 'panel', 'mail', 'correo', 'soporte', 'ayuda', 'blog', 'static', 'cdn')
  ),
  custom_domain text unique check (
    length(custom_domain) between 4 and 253
    and custom_domain ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$'
    and custom_domain !~ '^www\.'
  ),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null
);

alter table public.site_addresses enable row level security;

-- Los miembros ven la dirección de su corredora; nadie escribe directo: se guarda con set_site_address.
create policy "site_addresses: ver la de mi corredora"
  on public.site_addresses for select
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = site_addresses.tenant_id and m.user_id = (select auth.uid())
    )
  );

-- ¿La corredora puede mostrar su sitio? Sin fila de derechos todo está prendido (ADR-009).
-- Un pago vencido no apaga el sitio: la corredora sigue recibiendo clientes mientras regulariza.
create or replace function public.site_is_public(p_tenant uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.tenants t where t.id = p_tenant)
     and not exists (
       select 1 from public.tenant_entitlements e
        where e.tenant_id = p_tenant
          and (e.status in ('suspended', 'cancelled') or e.features->>'site.enabled' = 'false')
     )
$$;

revoke all on function public.site_is_public(uuid) from public, anon, authenticated;

-- p_subdomain: la etiqueta cuando la visita llega por el dominio de la plataforma (casasur.<plataforma>).
-- p_domain: la dirección completa en cualquier otro caso (casasur.cl, www.casasur.cl, localhost, un preview).
-- p_fallback: la corredora configurada en el sitio (SITIO_TENANT_ID); solo se usa si la dirección no es de nadie
-- y no es un subdominio de la plataforma: un subdominio desconocido nunca muestra otra corredora.
create or replace function public.resolve_site_tenant(p_subdomain text, p_domain text, p_fallback uuid)
returns uuid
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_tenant uuid;
begin
  if coalesce(p_subdomain, '') <> '' then
    select a.tenant_id into v_tenant from public.site_addresses a where a.subdomain = lower(btrim(p_subdomain));
  else
    if coalesce(p_domain, '') <> '' then
      select a.tenant_id into v_tenant
        from public.site_addresses a
       where a.custom_domain = regexp_replace(lower(btrim(p_domain)), '^www\.', '')
         and not exists (
           select 1 from public.tenant_entitlements e
            where e.tenant_id = a.tenant_id and e.features->>'site.custom_domain' = 'false'
         );
    end if;
    v_tenant := coalesce(v_tenant, p_fallback);
  end if;

  if v_tenant is null or not public.site_is_public(v_tenant) then
    return null;
  end if;
  return v_tenant;
end;
$$;

revoke all on function public.resolve_site_tenant(text, text, uuid) from public;
grant execute on function public.resolve_site_tenant(text, text, uuid) to anon, authenticated;

-- Vacío deja la dirección sin usar. Una dirección repetida responde 23505 y una mal escrita, 23514.
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
begin
  if not exists (
    select 1 from public.memberships m
     where m.tenant_id = p_tenant and m.user_id = v_uid and m.role = 'admin'
  ) then
    raise exception 'Solo el administrador de la corredora puede cambiar la dirección de su sitio' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.tenant_entitlements e
     where e.tenant_id = p_tenant
       and (
         e.status in ('suspended', 'cancelled')
         or (e.status = 'past_due' and e.grace_ends_at < now())
         or (v_domain is not null and e.features->>'site.custom_domain' = 'false')
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

revoke all on function public.set_site_address(uuid, text, text) from public, anon;
grant execute on function public.set_site_address(uuid, text, text) to authenticated;
