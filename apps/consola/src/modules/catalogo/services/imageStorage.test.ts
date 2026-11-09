import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { uploadPropertyImage, uploadIfRemote, fitWithin, resizeImage, cropToRatio, IMAGE_RATIO, IMAGE_GUIDE } from './imageStorage';

function clienteConStorage(upload = vi.fn().mockResolvedValue({ error: null })) {
  const getPublicUrl = vi.fn((path: string) => ({ data: { publicUrl: `https://x.supabase.co/storage/v1/object/public/property-images/${path}` } }));
  const from = vi.fn(() => ({ upload, getPublicUrl }));
  return { client: { storage: { from } } as unknown as SupabaseClient, from, upload, getPublicUrl };
}

const foto = () => new File([new Uint8Array([1, 2, 3])], 'casa.jpg', { type: 'image/jpeg' });

describe('uploadPropertyImage', () => {
  it('sube la foto a la carpeta de la corredora y devuelve su URL pública', async () => {
    const { client, from, upload } = clienteConStorage();

    const url = await uploadPropertyImage(client, 'tenant-1', foto());

    expect(from).toHaveBeenCalledWith('property-images');
    const ruta = upload.mock.calls[0][0] as string;
    expect(ruta).toMatch(/^tenant-1\/[0-9a-f-]+\.jpg$/);
    expect(upload.mock.calls[0][2]).toMatchObject({ contentType: 'image/jpeg' });
    expect(url).toBe(`https://x.supabase.co/storage/v1/object/public/property-images/${ruta}`);
  });

  it('lanza un error si la base rechaza la subida', async () => {
    const { client } = clienteConStorage(vi.fn().mockResolvedValue({ error: { message: 'rechazado' } }));
    await expect(uploadPropertyImage(client, 'tenant-1', foto())).rejects.toThrow('rechazado');
  });
});

describe('uploadIfRemote', () => {
  it('sin Supabase configurado devuelve null para que se use la imagen local como hoy', async () => {
    expect(await uploadIfRemote(foto())).toBeNull();
  });
});

describe('fitWithin', () => {
  it('reduce una foto grande manteniendo la proporción', () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it('no agranda una foto que ya cabe', () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
});

describe('resizeImage', () => {
  it('si el navegador no puede redimensionar, devuelve la foto original sin fallar', async () => {
    const original = foto();
    expect(await resizeImage(original)).toBe(original);
  });
});

describe('cropToRatio (H-065)', () => {
  it('una foto más ancha que 16:10 se recorta a los lados, centrada', () => {
    // 4000 x 1500 (muy panorámica): alto completo, ancho = 1500 * 1.6 = 2400, margen 800 a cada lado
    expect(cropToRatio(4000, 1500, IMAGE_RATIO)).toEqual({ sx: 800, sy: 0, sw: 2400, sh: 1500 });
  });

  it('una foto vertical se recorta arriba y abajo, centrada', () => {
    // 3000 x 4000: ancho completo, alto = 3000 / 1.6 = 1875, margen 1062,5 → 1063 (redondeo hacia arriba no pasa del borde)
    const r = cropToRatio(3000, 4000, IMAGE_RATIO);
    expect(r.sx).toBe(0);
    expect(r.sw).toBe(3000);
    expect(r.sh).toBe(1875);
    expect(r.sy + r.sh).toBeLessThanOrEqual(4000);
    expect(Math.abs(r.sy - (4000 - 1875) / 2)).toBeLessThanOrEqual(1);
  });

  it('una foto que ya tiene la proporción no se recorta', () => {
    expect(cropToRatio(1600, 1000, IMAGE_RATIO)).toEqual({ sx: 0, sy: 0, sw: 1600, sh: 1000 });
  });
});

describe('guía de imágenes (H-065)', () => {
  it('dice las medidas recomendadas que usa el ajuste automático', () => {
    expect(IMAGE_GUIDE).toMatch(/1600 × 1000/);
    expect(IMAGE_GUIDE).toMatch(/16:10/);
  });
});
