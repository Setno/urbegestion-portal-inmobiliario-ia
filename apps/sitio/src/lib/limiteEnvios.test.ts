import { describe, expect, it } from 'vitest';
import { crearLimite, direccionDelVisitante, permitirEnvio } from './limiteEnvios';

describe('permitirEnvio: el límite que usan las acciones del sitio (H-063)', () => {
  it('corta a la misma dirección tras 6 envíos y deja pasar a otra', () => {
    const desde = (ip: string) => new Headers({ 'x-forwarded-for': ip });
    const resultados = Array.from({ length: 8 }, () => permitirEnvio(desde('198.51.100.9')));
    expect(resultados).toEqual([true, true, true, true, true, true, false, false]);
    expect(permitirEnvio(desde('198.51.100.10'))).toBe(true);
  });
});

describe('límite de envíos por dirección IP (H-063)', () => {
  it('deja pasar hasta el máximo y después avisa cuántos segundos esperar', () => {
    const l = crearLimite({ max: 3, ventanaMs: 60_000 });
    expect([l.revisar('ip', 0), l.revisar('ip', 1000), l.revisar('ip', 2000)]).toEqual([0, 0, 0]);
    expect(l.revisar('ip', 3000)).toBe(57);
  });

  it('vuelve a dejar pasar cuando termina la ventana', () => {
    const l = crearLimite({ max: 1, ventanaMs: 1000 });
    l.revisar('ip', 0);
    expect(l.revisar('ip', 500)).toBeGreaterThan(0);
    expect(l.revisar('ip', 1500)).toBe(0);
  });

  it('cada dirección lleva su propia cuenta y sin dirección no se limita', () => {
    const l = crearLimite({ max: 1, ventanaMs: 60_000 });
    l.revisar('a', 0);
    expect(l.revisar('b', 1)).toBe(0);
    expect(l.revisar(null, 2)).toBe(0);
    expect(l.revisar(null, 3)).toBe(0);
  });

  it('toma la dirección de x-forwarded-for (la primera) o de x-real-ip', () => {
    expect(direccionDelVisitante(new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }))).toBe('1.2.3.4');
    expect(direccionDelVisitante(new Headers({ 'x-real-ip': '5.6.7.8' }))).toBe('5.6.7.8');
    expect(direccionDelVisitante(new Headers())).toBeNull();
  });
});
