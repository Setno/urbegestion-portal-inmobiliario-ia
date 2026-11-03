import { describe, it, expect } from 'vitest';
import { enlaceCorreo, enlaceTelefono, enlaceWhatsapp } from './enlaces';

describe('enlaces de contacto', () => {
  it('WhatsApp usa solo los dígitos del número, como lo exige wa.me', () => {
    expect(enlaceWhatsapp('+56 9 1111-2222', 'Hola, ¿sí?')).toBe('https://wa.me/56911112222?text=Hola%2C%20%C2%BFs%C3%AD%3F');
  });

  it('sin dígitos no hay enlace de WhatsApp ni de teléfono', () => {
    expect(enlaceWhatsapp('  ', 'Hola')).toBe('');
    expect(enlaceTelefono(' - ')).toBe('');
  });

  it('el teléfono conserva el signo + y quita lo demás', () => {
    expect(enlaceTelefono('+56 9 1111-2222')).toBe('tel:+56911112222');
  });

  it('el correo debe parecer un correo: nada de parámetros agregados', () => {
    expect(enlaceCorreo(' hola@casasur.cl ')).toBe('mailto:hola@casasur.cl');
    expect(enlaceCorreo('hola@casasur.cl?bcc=otro@a.cl')).toBe('');
    expect(enlaceCorreo('hola')).toBe('');
    expect(enlaceCorreo('   ')).toBe('');
  });
});
