import { describe, it, expect } from 'vitest';
import { displayEmail, realEmail } from './leadEmail';

describe('correo de un lead', () => {
  it('un correo real se conserva tal cual', () => {
    expect(realEmail('ana@correo.cl')).toBe('ana@correo.cl');
    expect(displayEmail('ana@correo.cl')).toBe('ana@correo.cl');
  });

  it('vacío, con espacios o con los correos de relleno antiguos no es un correo: se muestra "Sin correo"', () => {
    for (const email of ['', '   ', 'sin-correo@solicitud.cl', 'propietario@sin-email.cl', 'SIN-CORREO@solicitud.cl']) {
      expect(realEmail(email)).toBe('');
      expect(displayEmail(email)).toBe('Sin correo');
    }
  });

  it('tolera datos que no son texto', () => {
    expect(realEmail(undefined as unknown as string)).toBe('');
    expect(displayEmail(null as unknown as string)).toBe('Sin correo');
  });
});
