import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { config, proxy } from './proxy';

const pedir = (ruta: string, host = 'casasur.cl') => proxy(new NextRequest(`https://${host}${ruta}`, { headers: { host } }));
const destino = (respuesta: Response) => respuesta.headers.get('x-middleware-rewrite');

describe('proxy del sitio', () => {
  it('atiende cada visita en la carpeta de su dirección, sin el puerto ni mayúsculas (H-030)', () => {
    expect(destino(pedir('/', 'CasaSur.cl'))).toBe('https://casasur.cl/casasur.cl');
    expect(destino(pedir('/sitemap.xml', 'casasur.localhost:3001'))).toBe('https://casasur.localhost:3001/casasur.localhost/sitemap.xml');
  });

  it('deja pasar una ficha con identificador válido', () => {
    expect(destino(pedir('/propiedades/11111111-1111-4111-8111-111111111111'))).toBe(
      'https://casasur.cl/casasur.cl/propiedades/11111111-1111-4111-8111-111111111111',
    );
  });

  it('responde 404 sin generar página para una ficha inventada', () => {
    for (const ruta of ['/propiedades/x1', '/propiedades/11111111-1111-4111-8111-11111111111A', '/propiedades/']) {
      const respuesta = pedir(ruta);
      expect(respuesta.status).toBe(404);
      expect(destino(respuesta)).toBeNull();
    }
  });

  it('una dirección rara no llega a las páginas', () => {
    const respuesta = pedir('/', 'casa_sur.cl');
    expect(respuesta.status).toBe(404);
    expect(destino(respuesta)).toBeNull();
  });

  it('pedir a mano la carpeta de otra corredora queda dentro de la propia', () => {
    expect(destino(pedir('/otra.cl/'))).toBe('https://casasur.cl/casasur.cl/otra.cl/');
  });

  it('no toca los archivos internos de Next', () => {
    expect(config.matcher).toBe('/((?!_next/).*)');
  });
});
