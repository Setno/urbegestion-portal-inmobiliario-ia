import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { processAiChatMessage } from './aiService';
import { initialProperties } from '../../catalogo/data/initialProperties';
import { agencyConfig } from '../../../core/config/agencyConfig';

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

  it('si preguntan por crédito o dividendo, explica que lo evalúa el banco y ofrece contacto, sin calcular nada', async () => {
    for (const texto of ['Cuánto sería el dividendo', 'Tienen crédito hipotecario?', 'Con qué banco trabajan', 'Qué pie necesito']) {
      const r = await preguntar(texto);
      expect(r.text).toContain('banco');
      expect(r.text).not.toContain('UF referencial');
      expect(r.text).not.toContain('simulador');
      expect(r.actionRequired).toBe('provide_contact');
    }
  });

  it('no confunde palabras que solo contienen "uf" o "pie" con una consulta de crédito', async () => {
    const r = await preguntar('Busco una pieza grande en Vitacura');
    expect(r.text).not.toContain('banco');
  });

  it('recomienda casas y la de Lo Barnechea cuando preguntan por "casas en Lo Barnechea"', async () => {
    const r = await preguntar('Casas en Lo Barnechea');
    expect(r.actionRequired).toBe('view_properties');
    expect(r.suggestedProperties).toContain('prop-02');
  });

  it('"casas en Lo Barnechea" recomienda solo casas de esa comuna', async () => {
    const r = await preguntar('Casas en Lo Barnechea');
    expect(r.suggestedProperties).toEqual(['prop-02']);
  });

  it('combina comuna y operación: "arriendo en Las Condes" no trae ventas ni otras comunas', async () => {
    const r = await preguntar('Arriendo en Las Condes');
    const ids = r.suggestedProperties ?? [];
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      const p = initialProperties.find((x) => x.id === id)!;
      expect(p.operation).toBe('arriendo');
      expect(p.commune).toContain('Las Condes');
    }
  });

  it('"venta" no trae propiedades en arriendo', async () => {
    const r = await preguntar('Quiero algo en venta');
    const ids = r.suggestedProperties ?? [];
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(initialProperties.find((x) => x.id === id)!.operation).toBe('venta');
    }
  });

  it('"parcelas en Melipilla" recomienda solo la parcela de Melipilla', async () => {
    const r = await preguntar('Parcelas en Melipilla');
    expect(r.suggestedProperties).toEqual(['prop-04']);
  });

  it('el texto de las recomendaciones ya no ofrece calcular el dividendo', async () => {
    const r = await preguntar('Casas en Lo Barnechea');
    expect(r.text).not.toContain('dividendo');
  });

  it('recomienda como máximo 3 propiedades', async () => {
    const r = await preguntar('departamento');
    expect(r.suggestedProperties?.length).toBeLessThanOrEqual(3);
  });

  it('"Qué propiedades tienen en Vitacura" busca en el catálogo (la palabra "propiedades" ya no activa el crédito)', async () => {
    const r = await preguntar('Qué propiedades tienen en Vitacura');
    expect(r.actionRequired).toBe('view_properties');
    expect(r.suggestedProperties).toEqual(['prop-01']);
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

  it('el simulador de dividendo está apagado por defecto en la configuración de la corredora', () => {
    expect(agencyConfig.features.mortgageSimulator).toBe(false);
  });
});
