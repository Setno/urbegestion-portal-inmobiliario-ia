-- H-009.5 y cierre de H-009.4: fotos de propiedades en Storage y notas de leads sin pisarse.
-- Aprobada y aplicada en el Supabase de desarrollo el 2026-11-01.

-- 1) Bucket público de lectura para las fotos del catálogo. Máximo 5 MB por archivo, solo imágenes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Las rutas son <tenant_id>/<archivo>. Cualquiera puede ver las fotos (el bucket es público);
-- solo quien pertenece a la corredora de la carpeta puede subir, reemplazar o borrar.
create policy "property-images: subir en mi corredora"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'property-images'
    and exists (select 1 from public.memberships m
                where m.tenant_id::text = (storage.foldername(name))[1] and m.user_id = (select auth.uid()))
  );

create policy "property-images: reemplazar en mi corredora"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'property-images'
    and exists (select 1 from public.memberships m
                where m.tenant_id::text = (storage.foldername(name))[1] and m.user_id = (select auth.uid()))
  );

create policy "property-images: borrar solo admin de mi corredora"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'property-images'
    and exists (select 1 from public.memberships m
                where m.tenant_id::text = (storage.foldername(name))[1] and m.user_id = (select auth.uid())
                  and m.role = 'admin')
  );

-- 2) Agregar una nota en un solo paso dentro de la base, para que dos agentes a la vez no se pisen.
--    Corre con los permisos de quien llama (security invoker): la RLS de leads sigue mandando.
create or replace function public.append_lead_note(p_lead_id uuid, p_note text)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.leads
     set notes = array_append(notes, left(p_note, 2000))
   where id = p_lead_id
     and cardinality(notes) < 20;
$$;

revoke all on function public.append_lead_note(uuid, text) from public, anon;
grant execute on function public.append_lead_note(uuid, text) to authenticated;
