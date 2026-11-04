import { describe, it, expect } from 'vitest';
import type { PublicProperty } from '@portal/sitio-datos/propiedades';
import { bienvenida, responder, sugerencias, type ContextoAsistente } from './asistente';

const ctx = (extra: Partial<ContextoAsistente> = {}): ContextoAsistente => ({
  corredora: 'Casa Sur',
  corredor: 'Ana Soto',
  telefono: '+56 9 1111 2222',
  correo: 'hola@casasur.cl',
  marketId: 'cl',
  conTasacion: true,
  ...extra,
});

const prop = (extra: Partial<PublicProperty>): PublicProperty => ({
  id: 'p1',
  title: 'Casa con vista',
  operation: 'venta',
  propertyType: 'casa',
  priceAmount: 18500,
  priceCurrency: 'UF',
  commune: 'Vitacura',
  address: '',
  bedrooms: 3,
  bathrooms: 2,
  builtAreaM2: 120,
  totalAreaM2: 300,
  parkingSpots: 1,
  storageUnits: 0,
  expensesMonthlyClp: 0,
  mapQuery: '',
  featured: false,
  images: [],
  description: '',
  features: [],
  reservada: false,
  ...extra,
});

const catalogo = [
  prop({ id: 'a', title: 'Casa en Vitacura', commune: 'Vitacura', propertyType: 'casa', operation: 'venta' }),
  prop({ id: 'b', title: 'Depto en Providencia', commune: 'Providencia', propertyType: 'departamento', operation: 'arriendo' }),
  prop({ id: 'c', title: 'Parcela en Pirque', commune: 'Pirque', propertyType: 'parcela_agricola', operation: 'venta' }),
  prop({ id: 'd', title: 'Casa en Lo Barnechea', commune: 'Lo Barnechea (La Dehesa / Los Trapenses)', propertyType: 'casa', operation: 'venta' }),
];

describe('asistente del sitio (motor local, sin costo)', () => {
  it('saluda con el nombre de la corredora', () => {
    expect(bienvenida(ctx())).toContain('Casa Sur');
  });

  it('una consulta vacía pide que escriba algo', () => {
    const r = responder('   ', catalogo, ctx());
    expect(r.propiedades).toEqual([]);
    expect(r.pedirContacto).toBe(false);
  });

  it('recomienda propiedades que cumplen todo lo que la persona menciona', () => {
    expect(responder('busco una casa en Vitacura', catalogo, ctx()).propiedades).toEqual(['a']);
    expect(responder('quiero arrendar un depto', catalogo, ctx()).propiedades).toEqual(['b']);
    expect(responder('parcela en venta', catalogo, ctx()).propiedades).toEqual(['c']);
  });

  it('entiende las tildes, las mayúsculas y los alias de las comunas', () => {
    expect(responder('CASA EN LA DEHESA', catalogo, ctx()).propiedades).toEqual(['d']);
    expect(responder('Departamento en providencia', catalogo, ctx()).propiedades).toEqual(['b']);
  });

  it('no mezcla: si pide una casa en una comuna donde no hay, no ofrece otra cosa', () => {
    const r = responder('casa en Providencia', catalogo, ctx());
    expect(r.propiedades).toEqual([]);
    // Lo dice con claridad y ofrece avisarle, en vez de contestar con otra cosa
    expect(r.texto).toContain('no tengo publicado');
    expect(r.pedirContacto).toBe(true);
  });

  it('muestra como máximo tres opciones', () => {
    const muchas = Array.from({ length: 6 }, (_, i) => prop({ id: `m${i}`, commune: 'Vitacura' }));
    expect(responder('casa en Vitacura', muchas, ctx()).propiedades).toHaveLength(3);
  });

  it('agendar visita pide los datos de contacto', () => {
    const r = responder('quiero agendar una visita', catalogo, ctx());
    expect(r.pedirContacto).toBe(true);
    expect(r.texto).toContain('Ana Soto');
  });

  it('para vender, con el valorizador en el plan, manda a la sección de la página', () => {
    const r = responder('quiero vender mi propiedad', catalogo, ctx({ conTasacion: true }));
    expect(r.texto).toContain('más abajo');
    expect(r.pedirContacto).toBe(false);
  });

  it('para vender, sin valorizador en el plan, pide el contacto en vez de mandar a una sección que no existe', () => {
    const r = responder('quiero vender mi propiedad', catalogo, ctx({ conTasacion: false }));
    expect(r.texto).not.toContain('más abajo');
    expect(r.pedirContacto).toBe(true);
  });

  it('si pregunta por crédito no lo simula: lo deriva al contacto', () => {
    const r = responder('¿me dan crédito hipotecario?', catalogo, ctx());
    expect(r.texto).toMatch(/banco/i);
    expect(r.pedirContacto).toBe(true);
  });

  it('da el teléfono y el correo cuando los piden y solo si existen', () => {
    const r = responder('¿cuál es su teléfono?', catalogo, ctx());
    expect(r.texto).toContain('+56 9 1111 2222');
    expect(r.texto).toContain('hola@casasur.cl');
    const sin = responder('¿cuál es su teléfono?', catalogo, ctx({ telefono: '', correo: '' }));
    expect(sin.texto).not.toContain('undefined');
    expect(sin.pedirContacto).toBe(true);
  });

  it('si no entiende, nombra las comunas donde hay propiedades y no inventa nada', () => {
    const r = responder('hola', catalogo, ctx());
    expect(r.texto).toContain('Vitacura');
    expect(r.propiedades).toEqual([]);
  });

  it('sin propiedades publicadas no inventa comunas', () => {
    const r = responder('hola', [], ctx());
    expect(r.texto).toContain('Casa Sur');
    expect(r.propiedades).toEqual([]);
  });

  it('las sugerencias salen de lo que hay publicado y respetan el plan', () => {
    const con = sugerencias(catalogo, ctx({ conTasacion: true }));
    expect(con).toContain('Agendar visita');
    expect(con).toContain('Vender mi propiedad');
    expect(con.some((s) => s.includes('Vitacura'))).toBe(true);
    expect(sugerencias(catalogo, ctx({ conTasacion: false }))).not.toContain('Vender mi propiedad');
  });
});
