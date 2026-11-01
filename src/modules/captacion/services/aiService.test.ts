import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { processAiChatMessage } from './aiService';
import { initialProperties } from '../../catalogo/data/initialProperties';
import { agencyConfig } from '../../../core/config/agencyConfig';
import { useLocaleStore } from '../../../core/i18n/i18n';

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

describe('motor local: otras regiones de Chile', () => {
  const enValparaiso = [
    { ...initialProperties[0], id: 'v1', title: 'Casa en Viña', commune: 'Viña del Mar', operation: 'venta' as const },
    { ...initialProperties[1], id: 'v2', title: 'Depto en Concón', commune: 'Concón', propertyType: 'departamento' as const },
  ];

  it('la respuesta por defecto nombra las comunas donde hay propiedades, no Santiago', async () => {
    const r = await processAiChatMessage('Hola, buenas tardes', enValparaiso);
    expect(r.text).toContain('Viña del Mar y Concón');
    expect(r.text).not.toContain('Santiago');
  });

  it('encuentra propiedades por el nombre de su comuna aunque no esté en los alias de Santiago', async () => {
    const r = await processAiChatMessage('Busco algo en Viña del Mar', enValparaiso);
    expect(r.suggestedProperties).toEqual(['v1']);
  });
});

describe('motor local: inglés', () => {
  beforeEach(() => useLocaleStore.setState({ locale: 'en' }));
  afterEach(() => useLocaleStore.setState({ locale: 'es' }));

  it('responde en inglés cuando la interfaz está en inglés', async () => {
    const r = await preguntar('I want to book a visit');
    expect(r.actionRequired).toBe('select_date');
    expect(r.text).toContain('Great idea!');
  });

  it('entiende que quiere vender y nombra la sección con el texto del idioma', async () => {
    const r = await preguntar('I want to sell my property');
    expect(r.actionRequired).toBe('provide_contact');
    expect(r.text).toContain('our "Sell with Us" section');
  });

  it('deriva las consultas de crédito al contacto, sin simularlas', async () => {
    const r = await preguntar('Can you give me a mortgage?');
    expect(r.text).toContain('handled by your bank');
    expect(r.actionRequired).toBe('provide_contact');
  });

  it('busca propiedades con palabras en inglés: tipo, operación y comuna', async () => {
    const r = await preguntar('apartment for sale in Vitacura');
    expect(r.suggestedProperties).toEqual([initialProperties[0].id]);
    expect(r.text).toContain('I found some highlighted options');
  });

  it('da el teléfono y el correo de la corredora', async () => {
    const r = await preguntar('what is your phone number?');
    expect(r.text).toContain(agencyConfig.contact.phoneDisplay);
    expect(r.text).toContain(agencyConfig.contact.email);
  });

  it('la respuesta por defecto nombra las comunas con "and" y usa el nombre del mercado', async () => {
    const r = await preguntar('hello there');
    expect(r.text).toContain('Vitacura, Lo Barnechea, Las Condes and Melipilla');
    expect(r.text).toContain('Do you have a commune');
  });

  it('un mensaje vacío pide la consulta', async () => {
    expect((await preguntar('   ')).text).toBe('Please type your question about our properties.');
  });
});

describe('motor local: una persona escribe en un idioma y lee en otro', () => {
  it('con la interfaz en español entiende una consulta en inglés y responde en español', async () => {
    useLocaleStore.setState({ locale: 'es' });
    const r = await preguntar('I want to book a visit');
    expect(r.actionRequired).toBe('select_date');
    expect(r.text).toContain('¡Excelente iniciativa!');
  });
});
