-- H-058: de qué anuncio o enlace llegó cada lead (parámetros utm del enlace).
-- Guarda {fuente, medio, campana} con textos cortos; sin valor significa que llegó directo.
-- Solo agrega una columna opcional. Como el insert de leads es público, la columna solo admite esas tres claves
-- con texto y un tamaño máximo: nadie puede guardar otra cosa llamando a la base directo.
-- Aplicar ANTES de publicar el sitio nuevo: sin la columna, un lead con campaña no se guardaría.
alter table public.leads
  add column attribution jsonb check (
    attribution is null
    or (
      jsonb_typeof(attribution) = 'object'
      and octet_length(attribution::text) <= 500
      and (attribution - 'fuente' - 'medio' - 'campana') = '{}'::jsonb
      and (not attribution ? 'fuente' or jsonb_typeof(attribution -> 'fuente') = 'string')
      and (not attribution ? 'medio' or jsonb_typeof(attribution -> 'medio') = 'string')
      and (not attribution ? 'campana' or jsonb_typeof(attribution -> 'campana') = 'string')
    )
  );
