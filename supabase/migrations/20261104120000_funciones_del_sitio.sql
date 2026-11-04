-- H-028.4b: qué herramientas de captación incluye el plan de la corredora, para que el sitio las muestre u oculte.
-- Devuelve solo dos sí/no (chat y valorizador), nunca el plan completo ni precios.
-- Sin fila de derechos todo está prendido (ADR-009); si la corredora no puede mostrar su sitio, devuelve null.
create or replace function public.get_site_features(p_tenant uuid)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'chat', not exists (
      select 1 from public.tenant_entitlements e
       where e.tenant_id = p_tenant and e.features->>'ai.chat' = 'false'
    ),
    'valuation', not exists (
      select 1 from public.tenant_entitlements e
       where e.tenant_id = p_tenant and e.features->>'valuation.owner_form' = 'false'
    )
  )
  where public.site_is_public(p_tenant)
$$;

revoke all on function public.get_site_features(uuid) from public;
grant execute on function public.get_site_features(uuid) to anon, authenticated;
