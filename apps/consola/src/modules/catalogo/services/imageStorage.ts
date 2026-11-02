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

const MAX_SIDE = 1600;

// Tamaño que cabe en un cuadrado de `max` px por lado, sin cambiar la proporción ni agrandar.
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

// Reduce la foto a un máximo de 1600 px por lado (JPEG) para que pese poco. Si el navegador no puede, devuelve la original.
export async function resizeImage(file: File, maxSide = MAX_SIDE): Promise<File> {
  try {
    if (typeof createImageBitmap !== 'function' || !file.type.startsWith('image/') || file.type === 'image/gif') return file;
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height, maxSide);
    if (width === bitmap.width && file.size <= 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch (err) {
    console.warn('[imageStorage] No se pudo redimensionar la foto, se usa la original:', err);
    return file;
  }
}

// Para logos y fotos de marca: se suben tal cual, porque reducir a JPEG le quitaría la transparencia a un logo.
export async function uploadOriginalIfRemote(file: File): Promise<string | null> {
  const ctx = remoteContext();
  if (!ctx) return null;
  return uploadPropertyImage(ctx.client, ctx.tenantId, file);
}

// Con Supabase configurado reduce y sube la foto y devuelve su URL; si no, devuelve null y quien llama usa la imagen local como hasta hoy.
export async function uploadIfRemote(file: File): Promise<string | null> {
  const ctx = remoteContext();
  if (!ctx) return null;
  return uploadPropertyImage(ctx.client, ctx.tenantId, await resizeImage(file));
}
