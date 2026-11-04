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

  it('dos leads creados en el mismo milisegundo reciben ids distintos y cambiar uno no afecta al otro', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-10-30T10:00:00.000Z'));
      const a = useLeadStore.getState().addLead({ ...nuevoLead(), fullName: 'A' });
      const b = useLeadStore.getState().addLead({ ...nuevoLead(), fullName: 'B' });
      expect(a).not.toBe(b);
      useLeadStore.getState().updateLeadStatus(a, 'cerrado');
      const leads = useLeadStore.getState().leads;
      expect(leads.find((l) => l.id === b)?.status).toBe('nuevo');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('próxima acción (H-056)', () => {
  beforeEach(() => {
    localStorage.clear();
    useLeadStore.setState({
      leads: [{ id: 'l1', fullName: 'Ana', email: '', phone: '', operationInterest: 'compra', status: 'nuevo', notes: [], source: 'formulario_contacto', createdAt: '2026-01-01' }],
    });
  });

  it('guarda la acción y la fecha, y las deja en el almacenamiento', () => {
    expect(useLeadStore.getState().setNextAction('l1', ' Llamar para confirmar visita ', '2026-11-10')).toBe(true);
    const l = useLeadStore.getState().leads[0];
    expect(l.nextActionText).toBe('Llamar para confirmar visita');
    expect(l.nextActionDue).toBe('2026-11-10');
    expect(JSON.stringify(JSON.parse(localStorage.getItem('urbe_leads') ?? '[]'))).toContain('Llamar para confirmar visita');
  });

  it('rechaza una acción vacía o una fecha inválida sin cambiar nada', () => {
    expect(useLeadStore.getState().setNextAction('l1', '   ', '2026-11-10')).toBe(false);
    expect(useLeadStore.getState().setNextAction('l1', 'Llamar', '2026-13-40')).toBe(false);
    expect(useLeadStore.getState().leads[0].nextActionText).toBeUndefined();
  });

  it('al cumplirla borra la acción y deja una nota con la fecha', () => {
    useLeadStore.getState().setNextAction('l1', 'Llamar', '2026-11-10');
    useLeadStore.getState().completeNextAction('l1');
    const l = useLeadStore.getState().leads[0];
    expect(l.nextActionText).toBeUndefined();
    expect(l.nextActionDue).toBeUndefined();
    expect(l.notes).toHaveLength(1);
    expect(l.notes[0]).toMatch(/^Hecho: Llamar \(\d{4}-\d{2}-\d{2}\)$/);
  });
});

describe('cumplir la acción con repositorio remoto (H-056)', () => {
  it('limpia la acción antes de agregar la nota atómica', async () => {
    const { setLeadRepository } = await import('../services/leadRepository');
    const calls: string[] = [];
    setLeadRepository({
      mode: 'remote', newId: () => 'n', list: async () => [], create: async () => {}, remove: async () => {},
      update: async () => { calls.push('update'); },
      appendNote: async () => { calls.push('appendNote'); },
    });
    useLeadStore.setState({
      leads: [{ id: 'l1', fullName: 'Ana', email: '', phone: '', operationInterest: 'compra', status: 'nuevo', notes: [], source: 'formulario_contacto', createdAt: '2026-01-01', nextActionText: 'Llamar', nextActionDue: '2026-11-10' }],
    });
    useLeadStore.getState().completeNextAction('l1');
    await new Promise((r) => setTimeout(r, 0));
    setLeadRepository(null);
    expect(calls).toEqual(['update', 'appendNote']);
  });
});
