-- H-045 (ADR-009): derechos de la corredora visibles para el sitio público y cupo de propiedades publicadas en la base.
--  * get_tenant_public_entitlements(): el sitio público (sin sesión) necesita saber qué funciones tiene prendidas la
--    corredora (chat, formulario de propietarios). Devuelve solo estado, funciones y fechas: nunca el plan, los cupos
--    ni la referencia de ventas.
--  * Disparador properties_zz_published_limit: hace cumplir `limit.properties_published` aunque se evite el panel.
--    Corre después del disparador del flujo de aprobación (orden alfabético), así ve el estado ya resuelto.
-- No limita ni cuenta leads: un lead perdido es un cliente perdido para la corredora; el uso se mide con platform_metrics().

create or replace function public.get_tenant_public_entitlements(p_tenant uuid)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'status', e.status,
    'graceEndsAt', e.grace_ends_at,
    'features', e.features,
    'contractVersion', e.contract_version,
    'updatedAt', e.source_updated_at
  )
    from public.tenant_entitlements e
   where e.tenant_id = p_tenant
$$;

revoke all on function public.get_tenant_public_entitlements(uuid) from public;
grant execute on function public.get_tenant_public_entitlements(uuid) to anon, authenticated;

create or replace function public.enforce_published_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit numeric;
  v_count integer;
begin
  -- Solo importa al pasar a "publicada"; seguir publicada no suma
  if new.publication_status <> 'publicada' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.publication_status = 'publicada' then
    return new;
  end if;

  select case when jsonb_typeof(e.limits -> 'limit.properties_published') = 'number'
              then (e.limits ->> 'limit.properties_published')::numeric end
    into v_limit
    from public.tenant_entitlements e
   where e.tenant_id = new.tenant_id;

  if v_limit is null then
    return new;
  end if;

  select count(*) into v_count
    from public.properties p
   where p.tenant_id = new.tenant_id
     and p.publication_status = 'publicada'
     and p.id <> new.id;

  if v_count >= v_limit then
    raise exception 'limit_reached: el plan de la corredora permite hasta % propiedades publicadas', v_limit::integer;
  end if;
  return new;
end;
$$;

create trigger properties_zz_published_limit
  before insert or update on public.properties
  for each row execute function public.enforce_published_limit();
