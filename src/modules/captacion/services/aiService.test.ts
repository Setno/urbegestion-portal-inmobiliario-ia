import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { processAiChatMessage } from './aiService';
import { initialProperties } from '../../catalogo/data/initialProperties';

// Pruebas de caracterización del motor local del asistente: fijan el comportamiento ACTUAL.
// Los casos marcados "BUG CONOCIDO" documentan comportamientos incorrectos que existen hoy.

const preguntar = (texto: string) => processAiChatMessage(texto, initialProperties);

describe('processAiChatMessage (motor local)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('no consulta el servidor cuando el proveedor es el motor local', async () => {
    await preguntar('hola');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('pide una consulta cuando el texto está vacío', async () => {
    const r = await preguntar('   ');
    expect(r.text).toContain('Por favor escribe tu consulta');
  });

  it('propone agendar cuando el usuario pide una visita', async () => {
    const r = await preguntar('Quiero agendar una visita');
    expect(r.actionRequired).toBe('select_date');
  });

  it('pide datos de contacto cuando el usuario quiere vender', async () => {
    const r = await preguntar('Quiero vender mi casa');
    expect(r.actionRequired).toBe('provide_contact');
  });

  it('responde con el valor de la UF cuando preguntan por el dividendo', async () => {
    const r = await preguntar('Cuánto sería el dividendo');
    expect(r.text).toContain('UF referencial');
  });

  it('recomienda casas y la de Lo Barnechea cuando preguntan por "casas en Lo Barnechea"', async () => {
    const r = await preguntar('Casas en Lo Barnechea');
    expect(r.actionRequired).toBe('view_properties');
    expect(r.suggestedProperties).toContain('prop-02');
  });

  it('BUG CONOCIDO: "casas en Lo Barnechea" también recomienda casas de otras comunas (la búsqueda usa "o")', async () => {
    const r = await preguntar('Casas en Lo Barnechea');
    // prop-07 es una casa en Chicureo / Colina: coincide por tipo aunque no por comuna
    expect(r.suggestedProperties).toContain('prop-07');
  });

  it('recomienda como máximo 3 propiedades', async () => {
    const r = await preguntar('departamento');
    expect(r.suggestedProperties?.length).toBeLessThanOrEqual(3);
  });

  it('BUG CONOCIDO: cualquier mensaje con la palabra "propiedades" cae en la respuesta hipotecaria', async () => {
    // "propiedades" contiene "pie" y la intención de crédito se evalúa antes que la búsqueda
    const r = await preguntar('Qué propiedades tienen en Vitacura');
    expect(r.text).toContain('UF referencial');
    expect(r.suggestedProperties).toBeUndefined();
  });

  it('da una respuesta consultiva por defecto cuando no entiende', async () => {
    const r = await preguntar('xyz');
    expect(r.text).toContain('¿Tienes alguna comuna o presupuesto');
    expect(r.suggestedProperties).toBeUndefined();
  });

  it('recorta el mensaje a 500 caracteres antes de procesarlo', async () => {
    const largo = 'agendar ' + 'x'.repeat(600);
    const r = await preguntar(largo);
    expect(r.actionRequired).toBe('select_date');
  });
});
