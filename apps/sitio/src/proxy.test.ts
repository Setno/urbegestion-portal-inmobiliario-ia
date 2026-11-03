import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { config, proxy } from './proxy';

const pedir = (ruta: string) => proxy(new NextRequest(`https://sitio.test${ruta}`));

describe('filtro de direcciones de ficha', () => {
  it('deja pasar un identificador válido', () => {
    expect(pedir('/propiedades/11111111-1111-4111-8111-111111111111').headers.get('x-middleware-next')).toBe('1');
  });

  it('responde 404 sin generar página para cualquier otra cosa', () => {
    for (const ruta of ['/propiedades/x1', '/propiedades/11111111-1111-4111-8111-11111111111A']) {
      const respuesta = pedir(ruta);
      expect(respuesta.status).toBe(404);
      expect(respuesta.headers.get('x-middleware-next')).toBeNull();
    }
  });

  it('solo actúa sobre las fichas', () => {
    expect(config.matcher).toBe('/propiedades/:id');
  });
});
