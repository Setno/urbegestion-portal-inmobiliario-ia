-- H-012: aviso de privacidad (Ley 21.719, deber de información). Guarda qué aviso se mostró al enviar el formulario:
-- {"shownAt": fecha y hora, "version": versión del texto, "purpose": finalidad}.
-- Es opcional (null) para los leads anteriores a esta columna. No cambia las políticas RLS existentes.
-- Aprobada y aplicada en el Supabase de desarrollo el 2026-11-01.

alter table public.leads add column privacy_notice jsonb;
