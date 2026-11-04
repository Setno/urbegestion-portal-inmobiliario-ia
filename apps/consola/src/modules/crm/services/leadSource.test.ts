import { describe, it, expect } from 'vitest';
import { sourceLabel } from './leadSource';

describe('origen de un lead', () => {
  it('cada origen se muestra con un nombre que entiende la corredora', () => {
    expect(sourceLabel('asistente_ia')).toBe('Asistente IA');
    expect(sourceLabel('ficha_propiedad')).toBe('Ficha de propiedad');
    expect(sourceLabel('formulario_contacto')).toBe('Formulario de contacto');
    expect(sourceLabel('captacion_propietarios')).toBe('Propietario');
  });

  it('un origen desconocido se muestra legible, sin guiones bajos ni mayúsculas gritadas', () => {
    expect(sourceLabel('whatsapp_entrante')).toBe('Whatsapp entrante');
    expect(sourceLabel('')).toBe('Sin origen');
  });
});
