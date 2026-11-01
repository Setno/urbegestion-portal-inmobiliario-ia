-- Corrección de 20261101120000: Storage necesita permiso de lectura (select) sobre storage.objects
-- para que el administrador pueda borrar y para que se pueda reemplazar una foto. Sin esta política,
-- borrar no hacía nada (0 filas). Las fotos siguen siendo visibles para todos por su URL pública:
-- esta política solo afecta consultas directas a la tabla, y solo para miembros de la corredora.
-- Aprobada y aplicada en el Supabase de desarrollo el 2026-11-01.

create policy "property-images: ver en mi corredora"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'property-images'
    and exists (select 1 from public.memberships m
                where m.tenant_id::text = (storage.foldername(name))[1] and m.user_id = (select auth.uid()))
  );
