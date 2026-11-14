import { describe, it, expect } from 'vitest';
import { diagnoseMercadoLibre } from './diagnostico';
import type { TokenFetcher } from './oauth';

const respuestas = (mapa: Record<string, { status: number; body: unknown }>): { fetcher: TokenFetcher; llamadas: { url: string; init?: RequestInit }[] } => {
  const llamadas: { url: string; init?: RequestInit }[] = [];
  const fetcher = (async (url: string, init?: RequestInit) => {
    llamadas.push({ url, init });
    const clave = Object.keys(mapa).find((k) => url.includes(k));
    const r = clave ? mapa[clave] : { status: 404, body: { message: 'no' } };
    return { ok: r.status < 400, status: r.status, json: async () => r.body };
  }) as unknown as TokenFetcher;
  return { fetcher, llamadas };
};

describe('diagnoseMercadoLibre (solo lectura)', () => {
  it('resume cuenta, paquetes, tipos de aviso y aplicación, solo con consultas GET', async () => {
    const { fetcher, llamadas } = respuestas({
      '/users/me': { status: 200, body: { id: 77, user_type: 'normal', country_id: 'CL', status: { site_status: 'active', list: { allow: true } }, tags: ['normal'] } },
      classifieds_promotion_packs: { status: 200, body: [] },
      available_listing_types: { status: 200, body: { available: [{ id: 'silver' }] } },
      '/applications/APP': { status: 200, body: { status: 'active', scopes: ['read', 'write'] } },
    });
    const lines = await diagnoseMercadoLibre({ accessToken: 'SECRETO', clientId: 'APP', categoryId: 'MLC1480', fetcher });
    const texto = lines.join('\n');
    expect(texto).toContain('tipo normal');
    expect(texto).toContain('Paquetes de publicación de inmuebles: 0');
    expect(texto).toContain('silver');
    expect(texto).toContain('read/write');
    expect(texto).not.toContain('SECRETO');
    // solo lectura: las únicas llamadas que no son GET son validaciones, que Mercado Libre no guarda
    expect(llamadas.every((l) => l.init?.method === 'GET' || l.url.endsWith('/items/validate'))).toBe(true);
    expect(llamadas.some((l) => l.url.endsWith('/items') || l.url.includes('/description'))).toBe(false);
    expect(texto).toContain('Validación de un artículo común');
    expect(texto).toContain('inmueble mínimo (tipo free)');
    expect(texto).toContain('inmueble mínimo (tipo silver)');
  });

  it('si la cuenta no se puede leer, lo dice con el motivo de Mercado Libre', async () => {
    const { fetcher } = respuestas({ '/users/me': { status: 403, body: { error: 'forbidden', message: 'At least one policy returned UNAUTHORIZED.' } } });
    const lines = await diagnoseMercadoLibre({ accessToken: 't', clientId: 'APP', fetcher });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/403.*UNAUTHORIZED/);
  });

  it('un corte de red se informa sin romper', async () => {
    const fetcher = (async () => {
      throw new Error('red');
    }) as unknown as TokenFetcher;
    expect(await diagnoseMercadoLibre({ accessToken: 't', clientId: 'APP', fetcher })).toEqual(['No se pudo contactar a Mercado Libre.']);
  });

  it('un error en una consulta secundaria muestra su código y motivo', async () => {
    const { fetcher } = respuestas({
      '/users/me': { status: 200, body: { id: 1 } },
      classifieds_promotion_packs: { status: 403, body: { message: 'At least one policy returned UNAUTHORIZED.' } },
    });
    const texto = (await diagnoseMercadoLibre({ accessToken: 't', clientId: '', fetcher })).join('\n');
    expect(texto).toMatch(/Paquetes de inmuebles: código 403.*UNAUTHORIZED/);
  });

  it('muestra si la cuenta puede publicar y los motivos cuando no', async () => {
    const { fetcher } = respuestas({ '/users/me': { status: 200, body: { id: 1, status: { site_status: 'active', list: { allow: false, codes: ['address_pending'] } } } } });
    const texto = (await diagnoseMercadoLibre({ accessToken: 't', clientId: '', fetcher })).join('\n');
    expect(texto).toContain('puede publicar: no (motivos: address_pending)');
  });
});
