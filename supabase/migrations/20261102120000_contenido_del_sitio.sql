-- H-027 (ADR-011): datos públicos del sitio de cada corredora, separados del diseño.
--  * site_content: una fila por corredora con su plantilla, marca, colores, secciones activas y textos.
--    Sin fila, la corredora se muestra neutra (solo su nombre): nunca con datos de otra.
--  * get_tenant_public_site(): lo que el sitio lee sin sesión. Solo datos públicos.
--  * set_site_brand(): solo el administrador de esa corredora, y solo si su plan incluye `branding.edit`.
--    No toca los textos ni la plantilla: los textos los editará H-032 y la plantilla, H-029.

create table public.site_content (
  tenant_id   uuid primary key references public.tenants (id) on delete cascade,
  template_id text not null default 'clasica' check (template_id ~ '^[a-z0-9-]{1,40}$'),
  brand       jsonb not null default '{}'::jsonb check (jsonb_typeof(brand) = 'object' and octet_length(brand::text) <= 32768),
  theme       jsonb not null default '{}'::jsonb check (jsonb_typeof(theme) = 'object' and octet_length(theme::text) <= 2048),
  layout      jsonb not null default '{}'::jsonb check (jsonb_typeof(layout) = 'object' and octet_length(layout::text) <= 2048),
  content     jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object' and octet_length(content::text) <= 131072),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null
);

alter table public.site_content enable row level security;

-- Los miembros leen lo de su corredora; nadie escribe directo: se guarda con set_site_brand.
create policy "site_content: ver el de mi corredora"
  on public.site_content for select
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = site_content.tenant_id and m.user_id = (select auth.uid())
    )
  );

create or replace function public.get_tenant_public_site(p_tenant uuid)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'tenantName', t.name,
    'templateId', coalesce(s.template_id, 'clasica'),
    'brand', coalesce(s.brand, '{}'::jsonb),
    'theme', coalesce(s.theme, '{}'::jsonb),
    'layout', coalesce(s.layout, '{}'::jsonb),
    'content', coalesce(s.content, '{}'::jsonb)
  )
    from public.tenants t
    left join public.site_content s on s.tenant_id = t.id
   where t.id = p_tenant
$$;

revoke all on function public.get_tenant_public_site(uuid) from public;
grant execute on function public.get_tenant_public_site(uuid) to anon, authenticated;

create or replace function public.set_site_brand(p_tenant uuid, p_brand jsonb, p_theme jsonb, p_layout jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if not exists (
    select 1 from public.memberships m
     where m.tenant_id = p_tenant and m.user_id = v_uid and m.role = 'admin'
  ) then
    raise exception 'Solo el administrador de la corredora puede cambiar su marca' using errcode = '42501';
  end if;

  -- Sin fila de derechos todo está prendido (mismo criterio que el panel, ADR-009).
  if exists (
    select 1 from public.tenant_entitlements e
     where e.tenant_id = p_tenant
       and (e.status in ('suspended', 'cancelled') or e.features->>'branding.edit' = 'false')
  ) then
    raise exception 'El plan de la corredora no permite editar la marca' using errcode = '42501';
  end if;

  insert into public.site_content as s (tenant_id, brand, theme, layout, updated_by)
  values (p_tenant, p_brand, p_theme, p_layout, v_uid)
  on conflict (tenant_id) do update
    set brand = excluded.brand,
        theme = excluded.theme,
        layout = excluded.layout,
        updated_at = now(),
        updated_by = v_uid;
end;
$$;

revoke all on function public.set_site_brand(uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.set_site_brand(uuid, jsonb, jsonb, jsonb) to authenticated;
