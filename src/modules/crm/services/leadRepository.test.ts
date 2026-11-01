import { describe, it, expect, vi } from 'vitest';
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
