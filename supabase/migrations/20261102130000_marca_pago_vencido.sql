-- H-027 (ADR-009, ADR-011): pasado el plazo de gracia de un pago vencido, la corredora queda en solo lectura
-- (igual que accessMode() en el panel), así que tampoco puede cambiar su marca aunque evite el panel.

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
       and (
         e.status in ('suspended', 'cancelled')
         or (e.status = 'past_due' and e.grace_ends_at < now())
         or e.features->>'branding.edit' = 'false'
       )
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
