import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { uploadPropertyImage, uploadIfRemote, fitWithin, resizeImage } from './imageStorage';

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
