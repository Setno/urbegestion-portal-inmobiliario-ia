import { describe, it, expect } from 'vitest';
import adr from '../../../docs/adr/009-contrato-saas-ventas.md?raw';
import {
  FEATURES,
  LIMITS,
  CONTRACT_VERSION,
  DEFAULT_ENTITLEMENTS,
  parseEntitlements,
  can,
  limitOf,
  hasRoom,
  accessMode,
} from './contract';

describe('contrato SaaS-ventas (ADR-009): catálogo', () => {
  it('las funciones y los cupos tienen claves con forma estable y descripción', () => {
    for (const [key, def] of Object.entries(FEATURES)) {
      expect(key).toMatch(/^[a-z_]+\.[a-z_]+$/);
      expect(key.startsWith('limit.')).toBe(false);
      expect(def.description.length).toBeGreaterThan(5);
    }
    for (const [key, def] of Object.entries(LIMITS)) {
      expect(key).toMatch(/^limit\.[a-z_]+$/);
      expect(def.description.length).toBeGreaterThan(5);
    }
  });

  it('el ADR-009 nombra cada clave del catálogo (el documento y el código no se separan)', () => {
    for (const key of [...Object.keys(FEATURES), ...Object.keys(LIMITS)]) {
      expect(adr, `falta ${key} en el ADR-009`).toContain(`\`${key}\``);
    }
  });

  it('sin ventas conectadas todo parte prendido y sin límites', () => {
    for (const key of Object.keys(FEATURES)) expect(can(DEFAULT_ENTITLEMENTS, key as keyof typeof FEATURES)).toBe(true);
    for (const key of Object.keys(LIMITS)) expect(limitOf(DEFAULT_ENTITLEMENTS, key as keyof typeof LIMITS)).toBeNull();
    expect(DEFAULT_ENTITLEMENTS.contractVersion).toBe(CONTRACT_VERSION);
  });
});

describe('parseEntitlements (lector tolerante)', () => {
  it('lee un mensaje completo de ventas', () => {
    const e = parseEntitlements({
      contractVersion: 1,
      planCode: 'solo_herramientas',
      status: 'trial',
      trialEndsAt: '2026-12-01T00:00:00Z',
      features: { 'site.enabled': false, 'ai.chat': true },
      limits: { 'limit.agents': 3, 'limit.storage_mb': null },
      updatedAt: '2026-11-01T10:00:00Z',
    });
    expect(e.planCode).toBe('solo_herramientas');
    expect(e.status).toBe('trial');
    expect(can(e, 'site.enabled')).toBe(false);
    expect(can(e, 'ai.chat')).toBe(true);
    expect(limitOf(e, 'limit.agents')).toBe(3);
    expect(limitOf(e, 'limit.storage_mb')).toBeNull();
  });

  it('ignora las claves que no conoce y conserva las que sí (así se pueden agregar variables sin romper)', () => {
    const e = parseEntitlements({ features: { 'futuro.algo_nuevo': true, 'ai.chat': false }, limits: { 'limit.nuevo': 5 }, otraCosa: 1 });
    expect(can(e, 'ai.chat')).toBe(false);
    expect(e.features['futuro.algo_nuevo']).toBe(true);
    expect(e.limits['limit.nuevo']).toBe(5);
  });

  it('una clave que ventas no menciona vale su valor por defecto', () => {
    const e = parseEntitlements({ features: { 'ai.chat': false } });
    expect(can(e, 'crm.export')).toBe(true);
    expect(limitOf(e, 'limit.agents')).toBeNull();
  });

  it('descarta valores de tipo incorrecto en vez de bloquear', () => {
    const e = parseEntitlements({
      status: 'inventado',
      features: { 'ai.chat': 'no', 'site.enabled': 0 },
      limits: { 'limit.agents': 'tres', 'limit.storage_mb': -5, 'limit.leads_per_month': 7.9 },
      trialEndsAt: 'no es fecha',
    });
    expect(e.status).toBe('active');
    expect(can(e, 'ai.chat')).toBe(true);
    expect(can(e, 'site.enabled')).toBe(true);
    expect(limitOf(e, 'limit.agents')).toBeNull();
    expect(limitOf(e, 'limit.storage_mb')).toBeNull();
    expect(limitOf(e, 'limit.leads_per_month')).toBe(7);
    expect(e.trialEndsAt).toBeNull();
  });

  it('con datos ilegibles devuelve los valores por defecto', () => {
    for (const raw of [null, undefined, 'texto', 42, [], true]) expect(parseEntitlements(raw)).toEqual(DEFAULT_ENTITLEMENTS);
  });
});

describe('cupos', () => {
  it('sin límite siempre hay espacio; con límite, hasta llenarlo', () => {
    const libre = parseEntitlements({});
    expect(hasRoom(libre, 'limit.agents', 9999)).toBe(true);
    const tres = parseEntitlements({ limits: { 'limit.agents': 3 } });
    expect(hasRoom(tres, 'limit.agents', 2)).toBe(true);
    expect(hasRoom(tres, 'limit.agents', 3)).toBe(false);
  });

  it('un cupo de cero no deja agregar nada', () => {
    expect(hasRoom(parseEntitlements({ limits: { 'limit.properties_published': 0 } }), 'limit.properties_published', 0)).toBe(false);
  });
});

describe('accessMode (qué puede hacer según el estado)', () => {
  const ahora = new Date('2026-11-10T12:00:00Z');
  const modo = (raw: object) => accessMode(parseEntitlements(raw), ahora);

  it('prueba y activa: todo', () => {
    expect(modo({ status: 'trial' })).toBe('full');
    expect(modo({ status: 'active' })).toBe('full');
  });

  it('atrasada: todo con aviso hasta el fin del plazo de gracia y solo lectura después', () => {
    expect(modo({ status: 'past_due', graceEndsAt: '2026-11-15T00:00:00Z' })).toBe('notice');
    expect(modo({ status: 'past_due', graceEndsAt: '2026-11-09T00:00:00Z' })).toBe('read_only');
  });

  it('atrasada sin plazo de gracia informado: solo aviso (no se bloquea por un dato faltante)', () => {
    expect(modo({ status: 'past_due' })).toBe('notice');
  });

  it('suspendida: solo lectura; cancelada: solo exportación', () => {
    expect(modo({ status: 'suspended' })).toBe('read_only');
    expect(modo({ status: 'cancelled' })).toBe('export_only');
  });
});
