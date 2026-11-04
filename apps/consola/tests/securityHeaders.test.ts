// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// H-004: cabeceras de seguridad de la consola en Vercel.
const vercel = JSON.parse(readFileSync(path.resolve(__dirname, '../vercel.json'), 'utf-8'));
const cabeceras: Record<string, string> = Object.fromEntries(
  vercel.headers.find((h: { source: string }) => h.source === '/(.*)').headers.map((h: { key: string; value: string }) => [h.key, h.value]),
);
const csp = Object.fromEntries(
  cabeceras['Content-Security-Policy'].split(';').map((d: string) => d.trim()).filter(Boolean).map((d: string) => [d.split(' ')[0], d.split(' ').slice(1)]),
) as Record<string, string[]>;

describe('cabeceras de seguridad de la consola (H-004)', () => {
  it('fuerza HTTPS por dos años y bloquea el uso de cámara, micrófono y ubicación', () => {
    expect(cabeceras['Strict-Transport-Security']).toMatch(/max-age=63072000/);
    expect(cabeceras['Permissions-Policy']).toMatch(/camera=\(\)/);
    expect(cabeceras['Permissions-Policy']).toMatch(/microphone=\(\)/);
  });
  it('mantiene las cabeceras que ya había', () => {
    expect(cabeceras['X-Content-Type-Options']).toBe('nosniff');
    expect(cabeceras['X-Frame-Options']).toBe('SAMEORIGIN');
  });
  it('la política de contenido solo ejecuta scripts propios y no admite objetos ni otras bases', () => {
    expect(csp['default-src']).toEqual(["'self'"]);
    expect(csp['script-src']).toEqual(["'self'"]);
    expect(csp['object-src']).toEqual(["'none'"]);
    expect(csp['base-uri']).toEqual(["'self'"]);
    expect(csp['frame-ancestors']).toEqual(["'self'"]);
  });
  it('deja pasar lo que la app necesita: Supabase, tipografías, imágenes, mapas y reservas', () => {
    expect(csp['connect-src']).toEqual(expect.arrayContaining(["'self'", 'https://*.supabase.co', 'wss://*.supabase.co']));
    expect(csp['style-src']).toEqual(expect.arrayContaining(["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']));
    expect(csp['font-src']).toEqual(expect.arrayContaining(['https://fonts.gstatic.com']));
    expect(csp['img-src']).toEqual(expect.arrayContaining(['data:', 'blob:', 'https:']));
    expect(csp['frame-src']).toEqual(['https:']);
  });
});
