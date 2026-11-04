import { describe, it, expect } from 'vitest';
import { atribucionDeBusqueda, limpiarAtribucion, aCookie, deCookie, ETIQUETA_DIRECTO } from './atribucion';

const params = (q: string) => new URLSearchParams(q);

describe('atribucionDeBusqueda (H-058)', () => {
  it('toma fuente, medio y campaña de los parámetros utm', () => {
    expect(atribucionDeBusqueda(params('utm_source=google&utm_medium=cpc&utm_campaign=verano_2026'))).toEqual({
      fuente: 'google', medio: 'cpc', campana: 'verano_2026',
    });
  });
  it('sin parámetros utm devuelve null', () => {
    expect(atribucionDeBusqueda(params('page=2'))).toBeNull();
    expect(atribucionDeBusqueda(params('utm_source=&utm_campaign=%20'))).toBeNull();
  });
  it('acepta solo algunos parámetros', () => {
    expect(atribucionDeBusqueda(params('utm_campaign=remate'))).toEqual({ campana: 'remate' });
  });
  it('limpia signos peligrosos y recorta el largo', () => {
    const a = atribucionDeBusqueda(params('utm_source=%3Cscript%3Ex%3C%2Fscript%3E&utm_campaign=' + 'a'.repeat(300)));
    expect(a?.fuente).toBe('scriptx/script');
    expect(a?.campana).toHaveLength(80);
  });
});

describe('limpiarAtribucion', () => {
  it('descarta lo que no sea un objeto con textos', () => {
    expect(limpiarAtribucion('hola')).toBeNull();
    expect(limpiarAtribucion(null)).toBeNull();
    expect(limpiarAtribucion({ fuente: 5, otro: 'x' })).toBeNull();
  });
  it('conserva solo las tres claves conocidas', () => {
    expect(limpiarAtribucion({ fuente: 'meta', medio: 'social', campana: 'c1', admin: 'true' })).toEqual({
      fuente: 'meta', medio: 'social', campana: 'c1',
    });
  });
});

describe('cookie de atribución', () => {
  it('ida y vuelta', () => {
    const a = { fuente: 'google', campana: 'verano 2026' };
    expect(deCookie(aCookie(a))).toEqual(a);
  });
  it('una cookie corrupta o ausente da null', () => {
    expect(deCookie(undefined)).toBeNull();
    expect(deCookie('%E0%A4%A')).toBeNull();
    expect(deCookie('no-es-json')).toBeNull();
  });
  it('la etiqueta de quien llega sin campaña es "Directo"', () => {
    expect(ETIQUETA_DIRECTO).toBe('Directo');
  });
});
