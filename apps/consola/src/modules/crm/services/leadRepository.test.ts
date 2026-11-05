import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createFakeSupabase } from '../../../core/data/fakeSupabase';
import { createRemoteLeadRepository, createLocalLeadRepository } from './leadRepository';
import type { Lead } from '../types/lead';

const TENANT = '5947138c-0eaa-4f12-8715-850e2fc833ae';
const PROP_UUID = 'a0a0a0a0-0000-0000-0000-0000000000a1';

const lead: Lead = {
  id: 'c0c0c0c0-0000-0000-0000-0000000000c1',
  fullName: 'Ana Prueba',
  email: 'ana@prueba.cl',
  phone: '+56 9 1111 2222',
  propertyInterestId: PROP_UUID,
  propertyTitle: 'Casa de prueba',
  operationInterest: 'compra',
  budgetAmount: 5000,
  budgetCurrency: 'UF',
  mortgageStatus: 'pre_aprobado',
  targetMoveDate: 'inmediato',
  status: 'nuevo',
  appointmentDate: '',
  notes: ['Primera nota'],
  source: 'asistente_ia',
  createdAt: '2026-10-31',
};

describe('leadRepository remoto', () => {
  it('crea el lead con la corredora, sin pedir la fila de vuelta (el visitante no puede leerla)', async () => {
    const fake = createFakeSupabase();
    const repo = createRemoteLeadRepository(fake.client, TENANT);
    await repo.create(lead, []);

    expect(fake.calls[0].table).toBe('leads');
    expect(fake.opsOf(0)).toEqual(['insert']);
    const [row] = fake.argsOf(0, 'insert') as [Record<string, unknown>];
    expect(row).toMatchObject({
      id: lead.id,
      tenant_id: TENANT,
      full_name: 'Ana Prueba',
      property_id: PROP_UUID,
      operation_interest: 'compra',
      budget_amount: 5000,
      mortgage_status: 'pre_aprobado',
      source: 'asistente_ia',
      status: 'nuevo',
      notes: ['Primera nota'],
    });
    expect(row.appointment_date).toBeNull();
    expect(row).not.toHaveProperty('created_at');
  });

  it('no envía property_id si el id de la propiedad no es un uuid (datos locales antiguos)', async () => {
    const fake = createFakeSupabase();
    const repo = createRemoteLeadRepository(fake.client, TENANT);
    await repo.create({ ...lead, propertyInterestId: 'prop-01' }, []);
    const [row] = fake.argsOf(0, 'insert') as [Record<string, unknown>];
    expect(row.property_id).toBeNull();
  });

  it('lista los leads y los convierte al formato de la app', async () => {
    const fake = createFakeSupabase({
      data: [
        {
          id: lead.id,
          tenant_id: TENANT,
          full_name: 'Ana Prueba',
          email: 'ana@prueba.cl',
          phone: '+56 9 1111 2222',
          property_id: PROP_UUID,
          property_title: 'Casa de prueba',
          operation_interest: 'compra',
          budget_amount: 5000,
          budget_currency: 'UF',
          mortgage_status: null,
          target_move_date: null,
          status: 'contactado',
          appointment_date: '2026-11-05',
          appointment_time: '11:00',
          notes: ['n1'],
          source: 'ficha_propiedad',
          attachments: [],
          property_specs: null,
          created_at: '2026-10-31T15:00:00+00:00',
        },
      ],
      error: null,
    });
    const repo = createRemoteLeadRepository(fake.client, TENANT);
    const lista = await repo.list();

    expect(fake.argsOf(0, 'order')).toEqual(['created_at', { ascending: false }]);
    expect(lista![0]).toMatchObject({
      id: lead.id,
      fullName: 'Ana Prueba',
      propertyInterestId: PROP_UUID,
      operationInterest: 'compra',
      status: 'contactado',
      appointmentDate: '2026-11-05',
      appointmentTime: '11:00',
      notes: ['n1'],
      source: 'ficha_propiedad',
      createdAt: '2026-10-31',
    });
    expect(lista![0].mortgageStatus).toBeUndefined();
  });

  it('cambia estado y notas con una actualización por id', async () => {
    const fake = createFakeSupabase({ data: [{ id: lead.id }], error: null });
    const repo = createRemoteLeadRepository(fake.client, TENANT);
    await repo.update(lead.id, { status: 'cerrado' }, []);
    await repo.update(lead.id, { notes: ['a', 'b'] }, []);

    expect(fake.argsOf(0, 'update')).toEqual([{ status: 'cerrado' }]);
    expect(fake.argsOf(0, 'eq')).toEqual(['id', lead.id]);
    expect(fake.argsOf(1, 'update')).toEqual([{ notes: ['a', 'b'] }]);
  });

  it('si editar o borrar no afecta ninguna fila (sin permiso o no existe), lanza error', async () => {
    const fake = createFakeSupabase({ data: [], error: null });
    const repo = createRemoteLeadRepository(fake.client, TENANT);
    await expect(repo.update(lead.id, { status: 'cerrado' }, [])).rejects.toThrow(/permiso/);
    await expect(repo.remove(lead.id, [])).rejects.toThrow(/permiso/);
  });

  it('al editar, un campo opcional borrado se envía como null', async () => {
    const fake = createFakeSupabase({ data: [{ id: lead.id }], error: null });
    const repo = createRemoteLeadRepository(fake.client, TENANT);
    await repo.update(lead.id, { appointmentDate: undefined, budgetAmount: undefined }, []);
    const [patch] = fake.argsOf(0, 'update') as [Record<string, unknown>];
    expect(patch).toMatchObject({ appointment_date: null, budget_amount: null });
  });

  it('borra por id y lanza error si la base falla', async () => {
    const fake = createFakeSupabase({ data: [{ id: lead.id }], error: null });
    const repo = createRemoteLeadRepository(fake.client, TENANT);
    await repo.remove(lead.id, []);
    expect(fake.opsOf(0)).toContain('delete');

    fake.setResult({ data: null, error: { message: 'sin permiso' } });
    await expect(repo.remove(lead.id, [])).rejects.toThrow('sin permiso');
    await expect(repo.create(lead, [])).rejects.toThrow('sin permiso');
  });
});

describe('leadRepository remoto: aviso de privacidad', () => {
  const privacyNotice = { shownAt: '2026-11-01T15:00:00.000Z', version: '2026-11-01', purpose: 'contacto_por_consulta' };

  it('guarda el aviso de privacidad del lead en la columna privacy_notice', async () => {
    const fake = createFakeSupabase();
    const repo = createRemoteLeadRepository(fake.client, 'tenant-1');
    await repo.create({ ...lead, privacyNotice }, []);
    const fila = (fake.argsOf(0, 'insert') as Array<Record<string, unknown>>)[0];
    expect(fila.privacy_notice).toEqual(privacyNotice);
  });

  it('devuelve el aviso de privacidad al leer los leads', async () => {
    const fake = createFakeSupabase({
      data: [{ id: 'l1', full_name: 'Ana', email: '', phone: '', operation_interest: 'compra', status: 'nuevo', notes: [], source: 'asistente_ia', created_at: '2026-11-01T10:00:00Z', privacy_notice: privacyNotice }],
      error: null,
    });
    const leads = await createRemoteLeadRepository(fake.client, 'tenant-1').list();
    expect(leads![0].privacyNotice).toEqual(privacyNotice);
  });
});

describe('leadRepository remoto: appendNote', () => {
  it('agrega la nota con la función append_lead_note de la base', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    const repo = createRemoteLeadRepository({ rpc } as unknown as SupabaseClient, 'tenant-1');
    await repo.appendNote!('lead-1', 'nota nueva');
    expect(rpc).toHaveBeenCalledWith('append_lead_note', { p_lead_id: 'lead-1', p_note: 'nota nueva' });
  });

  it('lanza un error si la base falla', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: { message: 'sin permiso' } });
    const repo = createRemoteLeadRepository({ rpc } as unknown as SupabaseClient, 'tenant-1');
    await expect(repo.appendNote!('lead-1', 'x')).rejects.toThrow('sin permiso');
  });
});

describe('leadRepository local', () => {
  it('guarda en el navegador la lista completa que entrega la tienda', async () => {
    localStorage.clear();
    const repo = createLocalLeadRepository();
    await repo.create(lead, [lead]);
    expect(JSON.parse(localStorage.getItem('urbe_leads') || '[]')).toEqual([lead]);
    expect(repo.mode).toBe('local');
    expect(repo.newId()).toMatch(/^lead-/);
  });
});

describe('leadRepository remoto: próxima acción (H-056)', () => {
  it('guarda la acción y la fecha en sus columnas y las devuelve al leer', async () => {
    const fake = createFakeSupabase();
    await createRemoteLeadRepository(fake.client, 'tenant-1').create({ ...lead, nextActionText: 'Llamar', nextActionDue: '2026-11-10' }, []);
    const fila = (fake.argsOf(0, 'insert') as Array<Record<string, unknown>>)[0];
    expect(fila.next_action_text).toBe('Llamar');
    expect(fila.next_action_due).toBe('2026-11-10');

    const lectura = createFakeSupabase({
      data: [{ id: 'l1', full_name: 'Ana', email: '', phone: '', operation_interest: 'compra', status: 'nuevo', notes: [], source: 'asistente_ia', created_at: '2026-11-01T10:00:00Z', next_action_text: 'Llamar', next_action_due: '2026-11-10' }],
      error: null,
    });
    const leads = await createRemoteLeadRepository(lectura.client, 'tenant-1').list();
    expect(leads![0].nextActionText).toBe('Llamar');
    expect(leads![0].nextActionDue).toBe('2026-11-10');
  });

  it('al cumplirla envía null para que la acción vieja no reaparezca', async () => {
    const fake = createFakeSupabase({ data: [{ id: 'x' }], error: null });
    await createRemoteLeadRepository(fake.client, 'tenant-1').update('x', { nextActionText: undefined, nextActionDue: undefined }, []);
    const patch = fake.argsOf(0, 'update')[0] as Record<string, unknown>;
    expect(patch.next_action_text).toBeNull();
    expect(patch.next_action_due).toBeNull();
  });
});

describe('leadRepository remoto: atribución (H-058)', () => {
  const attribution = { fuente: 'google', medio: 'cpc', campana: 'verano' };
  it('guarda y devuelve la atribución del lead', async () => {
    const fake = createFakeSupabase();
    await createRemoteLeadRepository(fake.client, 'tenant-1').create({ ...lead, attribution }, []);
    expect((fake.argsOf(0, 'insert') as Array<Record<string, unknown>>)[0].attribution).toEqual(attribution);
    const lectura = createFakeSupabase({
      data: [{ id: 'l1', full_name: 'Ana', email: '', phone: '', operation_interest: 'compra', status: 'nuevo', notes: [], source: 'ficha_propiedad', created_at: '2026-11-01T10:00:00Z', attribution }],
      error: null,
    });
    expect((await createRemoteLeadRepository(lectura.client, 't').list())![0].attribution).toEqual(attribution);
  });
  it('un lead sin atribución no la trae', async () => {
    const lectura = createFakeSupabase({
      data: [{ id: 'l1', full_name: 'Ana', email: '', phone: '', operation_interest: 'compra', status: 'nuevo', notes: [], source: 'ficha_propiedad', created_at: '2026-11-01T10:00:00Z', attribution: null }],
      error: null,
    });
    expect((await createRemoteLeadRepository(lectura.client, 't').list())![0]).not.toHaveProperty('attribution');
  });
});

describe('leadRepository remoto: atribución mal formada (H-058)', () => {
  it('lo que no tenga la forma esperada se limpia al leer', async () => {
    const lectura = createFakeSupabase({
      data: [{ id: 'l1', full_name: 'Ana', email: '', phone: '', operation_interest: 'compra', status: 'nuevo', notes: [], source: 'ficha_propiedad', created_at: '2026-11-01T10:00:00Z', attribution: { fuente: '<b>x</b>', campana: { a: 1 }, extra: 'y' } }],
      error: null,
    });
    expect((await createRemoteLeadRepository(lectura.client, 't').list())![0].attribution).toEqual({ fuente: 'bx/b' });
  });
});

describe('leadRepository remoto: hora de visita vacía (H-059)', () => {
  it('al quitar la hora envía null para que la anterior no reaparezca', async () => {
    const fake = createFakeSupabase({ data: [{ id: 'x' }], error: null });
    await createRemoteLeadRepository(fake.client, 't').update('x', { appointmentDate: '2026-12-05', appointmentTime: undefined }, []);
    const patch = fake.argsOf(0, 'update')[0] as Record<string, unknown>;
    expect(patch.appointment_date).toBe('2026-12-05');
    expect(patch.appointment_time).toBeNull();
  });
});

describe('leadRepository remoto: hora exacta de registro (H-060)', () => {
  it('devuelve la fecha y hora completas además del día', async () => {
    const fake = createFakeSupabase({
      data: [{ id: 'l1', full_name: 'Ana', email: '', phone: '', operation_interest: 'compra', status: 'nuevo', notes: [], source: 'ficha_propiedad', created_at: '2026-11-01T10:20:30Z' }],
      error: null,
    });
    const l = (await createRemoteLeadRepository(fake.client, 't').list())![0];
    expect(l.createdAt).toBe('2026-11-01');
    expect(l.createdAtIso).toBe('2026-11-01T10:20:30Z');
  });
});

describe('leadRepository remoto: visitantes crean leads por el servidor (H-052, H-063)', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sin sesión envía el lead a /api/crear-lead con la corredora y no toca la base directo', async () => {
    const fake = createFakeSupabase(undefined, { signedIn: false });
    await createRemoteLeadRepository(fake.client, 'tenant-1').create({ ...lead }, []);
    expect(fake.calls).toEqual([]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/crear-lead');
    expect(init.method).toBe('POST');
    const cuerpo = JSON.parse(init.body) as { tenantId: string; lead: Record<string, unknown> };
    expect(cuerpo.tenantId).toBe('tenant-1');
    expect(cuerpo.lead.full_name).toBe('Ana Prueba');
  });

  it('con sesión inserta directo en la tabla', async () => {
    const fake = createFakeSupabase();
    await createRemoteLeadRepository(fake.client, 'tenant-1').create({ ...lead }, []);
    expect(fake.calls[0].table).toBe('leads');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('si el servidor rechaza el envío, se propaga el error con su código', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'too_many_requests' }), { status: 429 }));
    const fake = createFakeSupabase(undefined, { signedIn: false });
    await expect(createRemoteLeadRepository(fake.client, 't').create({ ...lead }, [])).rejects.toThrow('too_many_requests');
  });

  it('si no se puede llegar al servidor, falla y no da el lead por creado', async () => {
    fetchMock.mockRejectedValueOnce(new Error('sin red'));
    const fake = createFakeSupabase(undefined, { signedIn: false });
    await expect(createRemoteLeadRepository(fake.client, 't').create({ ...lead }, [])).rejects.toThrow('sin red');
  });
});

describe('leadRepository remoto: sesión de otra corredora (H-052, H-063)', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('si la base rechaza el insert directo por permisos, crea el lead por el servidor', async () => {
    const fake = createFakeSupabase({ data: null, error: { message: 'new row violates row-level security policy', code: '42501' } as never });
    await createRemoteLeadRepository(fake.client, 'tenant-1').create({ ...lead }, []);
    expect(fake.calls.map((c) => c.table)).toEqual(['leads']);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/crear-lead');
  });
  it('otros errores del insert directo no se reintentan', async () => {
    const fake = createFakeSupabase({ data: null, error: { message: 'boom', code: '23505' } as never });
    await expect(createRemoteLeadRepository(fake.client, 't').create({ ...lead }, [])).rejects.toThrow('boom');
    expect(fake.calls.map((c) => c.table)).toEqual(['leads']);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
