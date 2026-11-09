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

// El sitio muestra las fotos en un marco de 16:10: se ajustan a esa proporción al subirlas para que se vean completas
// y pesen poco (H-065).
export const IMAGE_RATIO = 16 / 10;
export const IMAGE_GUIDE =
  'Recomendado: foto horizontal de 1600 × 1000 px (proporción 16:10), JPG, PNG o WEBP. Se recorta al centro y se reduce sola al subirla.';

// Tamaño que cabe en un cuadrado de `max` px por lado, sin cambiar la proporción ni agrandar.
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

// Rectángulo centrado de la foto original que tiene la proporción pedida (ancho / alto).
export function cropToRatio(width: number, height: number, ratio: number): { sx: number; sy: number; sw: number; sh: number } {
  if (width / height > ratio) {
    const sw = Math.round(height * ratio);
    return { sx: Math.floor((width - sw) / 2), sy: 0, sw, sh: height };
  }
  const sh = Math.round(width / ratio);
  return { sx: 0, sy: Math.floor((height - sh) / 2), sw: width, sh };
}

// Recorta la foto a 16:10 y la reduce a un máximo de 1600 px de ancho (JPEG) para que pese poco. Si el navegador no puede, devuelve la original.
export async function resizeImage(file: File, maxSide = MAX_SIDE): Promise<File> {
  try {
    if (typeof createImageBitmap !== 'function' || !file.type.startsWith('image/') || file.type === 'image/gif') return file;
    const bitmap = await createImageBitmap(file);
    const { sx, sy, sw, sh } = cropToRatio(bitmap.width, bitmap.height, IMAGE_RATIO);
    const { width, height } = fitWithin(sw, sh, maxSide);
    if (sw === bitmap.width && sh === bitmap.height && width === bitmap.width && file.size <= 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob || (blob.size >= file.size && sw === bitmap.width && sh === bitmap.height)) return file;
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
