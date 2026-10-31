import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useLeadStore } from './useLeadStore';
import type { Lead } from '../types/lead';

const nuevoLead = (): Omit<Lead, 'id' | 'createdAt'> => ({
  fullName: 'Ana Prueba',
  email: 'ana@prueba.cl',
  phone: '+56 9 1111 2222',
  operationInterest: 'compra',
  status: 'nuevo',
  notes: [],
  source: 'formulario_contacto',
});

const guardados = (): Lead[] => JSON.parse(localStorage.getItem('urbe_leads') || '[]');

describe('useLeadStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useLeadStore.setState({ leads: [] });
    // addLead reenvía el lead al webhook: se simula el servidor
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('agrega un lead nuevo al inicio de la lista con id y fecha', () => {
    const id = useLeadStore.getState().addLead(nuevoLead());
    const { leads } = useLeadStore.getState();
    expect(leads).toHaveLength(1);
    expect(leads[0].id).toBe(id);
    expect(leads[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(leads[0].status).toBe('nuevo');
  });

  it('guarda el lead en el almacenamiento local', () => {
    const id = useLeadStore.getState().addLead(nuevoLead());
    expect(guardados().map((l) => l.id)).toEqual([id]);
  });

  it('envía el lead nuevo al endpoint del webhook', () => {
    useLeadStore.getState().addLead(nuevoLead());
    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/lead-webhook');
    expect((options as RequestInit).method).toBe('POST');
  });

  it('cambia el estado de un lead y lo persiste', () => {
    const id = useLeadStore.getState().addLead(nuevoLead());
    useLeadStore.getState().updateLeadStatus(id, 'contactado');
    expect(useLeadStore.getState().leads[0].status).toBe('contactado');
    expect(guardados()[0].status).toBe('contactado');
  });

  it('agrega una nota a un lead sin perder las anteriores y la persiste', () => {
    const id = useLeadStore.getState().addLead({ ...nuevoLead(), notes: ['primera'] });
    useLeadStore.getState().addNoteToLead(id, 'segunda');
    expect(useLeadStore.getState().leads[0].notes).toEqual(['primera', 'segunda']);
    expect(guardados()[0].notes).toEqual(['primera', 'segunda']);
  });

  it('deja ver la nota nueva leyendo el estado actual de la tienda (sin recargar)', () => {
    const id = useLeadStore.getState().addLead(nuevoLead());
    useLeadStore.getState().addNoteToLead(id, 'visible al instante');
    const actual = useLeadStore.getState().leads.find((l) => l.id === id);
    expect(actual?.notes).toContain('visible al instante');
  });

  it('elimina un lead y actualiza el almacenamiento', () => {
    const id = useLeadStore.getState().addLead(nuevoLead());
    useLeadStore.getState().deleteLead(id);
    expect(useLeadStore.getState().leads).toHaveLength(0);
    expect(guardados()).toEqual([]);
  });

  it('no modifica otros leads al cambiar uno', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-10-30T10:00:00.000Z'));
      const a = useLeadStore.getState().addLead({ ...nuevoLead(), fullName: 'A' });
      vi.setSystemTime(new Date('2026-10-30T10:00:00.050Z'));
      const b = useLeadStore.getState().addLead({ ...nuevoLead(), fullName: 'B' });
      useLeadStore.getState().updateLeadStatus(a, 'cerrado');
      const leads = useLeadStore.getState().leads;
      expect(leads.find((l) => l.id === a)?.status).toBe('cerrado');
      expect(leads.find((l) => l.id === b)?.status).toBe('nuevo');
    } finally {
      vi.useRealTimers();
    }
  });

  it('BUG CONOCIDO: dos leads creados en el mismo milisegundo reciben el mismo id (el id usa Date.now())', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-10-30T10:00:00.000Z'));
      const a = useLeadStore.getState().addLead({ ...nuevoLead(), fullName: 'A' });
      const b = useLeadStore.getState().addLead({ ...nuevoLead(), fullName: 'B' });
      expect(a).toBe(b);
    } finally {
      vi.useRealTimers();
    }
  });
});
