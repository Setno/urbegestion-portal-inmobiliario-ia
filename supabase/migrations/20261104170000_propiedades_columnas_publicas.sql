-- H-047: un visitante sin sesión solo puede leer las columnas públicas de las propiedades publicadas.
--
-- La política de lectura pública filtra FILAS (solo publicadas), pero no columnas: con la clave pública se podían
-- pedir también quién creó, editó y aprobó cada propiedad, el motivo de un rechazo y las coordenadas exactas.
-- Ahora el rol `anon` solo tiene permiso sobre una lista explícita de columnas. Los miembros de una corredora
-- (rol `authenticated`) siguen leyendo todo lo suyo.
--
-- Una columna nueva en `properties` NO queda visible para visitantes hasta agregarla aquí a propósito.
-- La consola pide estas mismas columnas cuando no hay sesión (PUBLIC_PROPERTY_COLUMNS_ANON en propertyRepository.ts);
-- una prueba comprueba que ambas listas coincidan.
revoke select on public.properties from anon;

grant select (
  id, tenant_id, title, operation, property_type, commune, address, bedrooms, bathrooms,
  built_area_m2, total_area_m2, parking_spots, storage_units, featured, status, images, video_url,
  description, features, virtual_tour_url, expenses_monthly_clp, map_query, created_at, updated_at,
  publication_status, price_amount, price_currency
) on public.properties to anon;
