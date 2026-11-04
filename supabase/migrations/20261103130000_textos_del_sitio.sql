-- H-032 (ADR-011): la corredora edita los textos de su sitio (portada, "Sobre nosotros", testimonios y pie).
--  * set_site_content(): guarda solo `content`, sin tocar la marca, los colores ni la plantilla (guardar por partes:
--    lo que un formulario no muestra no se borra). Mismas reglas que set_site_brand: solo el administrador de esa
--    corredora, si su plan incluye `branding.edit` y no está suspendida, cancelada ni con el plazo de gracia vencido.
--    El tamaño lo sigue limitando la tabla (128 KB): las fotos van al almacenamiento, no como texto.

create or replace function public.set_site_content(p_tenant uuid, p_content jsonb)
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
    raise exception 'Solo el administrador de la corredora puede cambiar los textos de su sitio' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.tenant_entitlements e
     where e.tenant_id = p_tenant
       and (
         e.status in ('suspended', 'cancelled')
         or (e.status = 'past_due' and e.grace_ends_at < now())
         or e.features->>'branding.edit' = 'false'
       )
  ) then
    raise exception 'El plan de la corredora no permite editar el sitio' using errcode = '42501';
  end if;

  insert into public.site_content as s (tenant_id, content, updated_by)
  values (p_tenant, p_content, v_uid)
  on conflict (tenant_id) do update
    set content = excluded.content,
        updated_at = now(),
        updated_by = v_uid;
end;
$$;

revoke all on function public.set_site_content(uuid, jsonb) from public, anon;
grant execute on function public.set_site_content(uuid, jsonb) to authenticated;
