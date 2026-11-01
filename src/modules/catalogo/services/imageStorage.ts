import type { SupabaseClient } from '@supabase/supabase-js';
import { remoteContext } from '../../../core/data/dataSource';
import { throwIfError } from '../../../core/data/repository';
import { newUuid } from '../../../core/utils/newId';

const BUCKET = 'property-images';

const EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Sube la foto a la carpeta de la corredora (<tenant_id>/<id>.<ext>) y devuelve su URL pública.
export async function uploadPropertyImage(client: SupabaseClient, tenantId: string, file: File): Promise<string> {
  const path = `${tenantId}/${newUuid()}.${EXTENSIONS[file.type] ?? 'jpg'}`;
  const { error } = await client.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  throwIfError(error);
  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Con Supabase configurado sube la foto y devuelve su URL; si no, devuelve null y quien llama usa la imagen local como hasta hoy.
export async function uploadIfRemote(file: File): Promise<string | null> {
  const ctx = remoteContext();
  if (!ctx) return null;
  return uploadPropertyImage(ctx.client, ctx.tenantId, file);
}
