import { describe, it, expect } from 'vitest';
import { createFakeSupabase } from '../../../core/data/fakeSupabase';
import { createRemoteLeadEventRepository } from './leadEventRepository';

describe('leadEventRepository remoto (H-057)', () => {
  it('lee los eventos de un lead de la corredora, del más reciente al más antiguo', async () => {
    const fake = createFakeSupabase({
      data: [{ id: 'e1', lead_id: 'l1', kind: 'llamada', text: 'Hola', occurred_at: '2026-11-04T10:00:00Z', author_email: 'a@b.cl' }],
      error: null,
    });
    const lista = await createRemoteLeadEventRepository(fake.client, 'tenant-1').listForLead('l1');
    expect(fake.calls[0].table).toBe('lead_events');
    expect(fake.argsOf(0, 'eq')).toEqual(['tenant_id', 'tenant-1']);
    expect(fake.argsOf(0, 'order')?.[1]).toEqual({ ascending: false });
    expect(lista).toEqual([{ id: 'e1', leadId: 'l1', kind: 'llamada', text: 'Hola', occurredAt: '2026-11-04T10:00:00Z', author: 'a@b.cl' }]);
  });

  it('al crear no envía autor: lo pone la base', async () => {
    const fake = createFakeSupabase();
    await createRemoteLeadEventRepository(fake.client, 'tenant-1').create({
      id: 'e1', leadId: 'l1', kind: 'visita', text: 'Visitó', occurredAt: '2026-11-04T10:00:00Z', author: 'yo@x.cl',
    });
    const fila = (fake.argsOf(0, 'insert') as Array<Record<string, unknown>>)[0];
    expect(fila.tenant_id).toBe('tenant-1');
    expect(fila).not.toHaveProperty('author_email');
  });

  it('un error de la base se propaga', async () => {
    const fake = createFakeSupabase({ data: null, error: { message: 'sin permiso' } });
    await expect(createRemoteLeadEventRepository(fake.client, 't').listForLead('l1')).rejects.toThrow('sin permiso');
  });
});

describe('leadEventRepository remoto: todos los eventos (H-060)', () => {
  it('lee los eventos de la corredora entera para los reportes', async () => {
    const fake = createFakeSupabase({
      data: [{ id: 'e1', lead_id: 'l1', kind: 'llamada', text: 'Hola', occurred_at: '2026-11-04T10:00:00Z', author_email: 'a@b.cl' }],
      error: null,
    });
    const lista = await createRemoteLeadEventRepository(fake.client, 'tenant-1').listAll!();
    expect(fake.argsOf(0, 'eq')).toEqual(['tenant_id', 'tenant-1']);
    expect(fake.argsOf(0, 'limit')).toEqual([5000]);
    expect(fake.argsOf(0, 'in')).toEqual(['kind', ['llamada', 'whatsapp', 'correo', 'visita']]);
    expect(lista).toHaveLength(1);
  });
});
