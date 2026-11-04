import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useTimelineStore } from './useTimelineStore';
import { useLeadStore } from './useLeadStore';
import { setLeadEventRepository } from '../services/leadEventRepository';
import type { LeadEvent } from '../types/leadEvent';

const lead = { id: 'l1', fullName: 'Ana', email: '', phone: '', operationInterest: 'compra' as const, status: 'nuevo' as const, notes: [], source: 'formulario_contacto' as const, createdAt: '2026-01-01' };

describe('useTimelineStore (H-057)', () => {
  beforeEach(() => {
    localStorage.clear();
    setLeadEventRepository(null);
    useTimelineStore.setState({ events: {} });
    useLeadStore.setState({ leads: [lead] });
  });
  afterEach(() => setLeadEventRepository(null));

  it('registra una llamada con tipo, fecha y autor, y la deja primera en la lista', () => {
    expect(useTimelineStore.getState().add('l1', 'llamada', ' No contestó ')).toBe(true);
    const e = useTimelineStore.getState().events['l1'][0];
    expect(e.kind).toBe('llamada');
    expect(e.text).toBe('No contestó');
    expect(e.author).toBeTruthy();
    expect(new Date(e.occurredAt).getTime()).not.toBeNaN();
    expect(localStorage.getItem('urbe_lead_events')).toContain('No contestó');
  });

  it('rechaza un texto vacío o un tipo desconocido', () => {
    expect(useTimelineStore.getState().add('l1', 'llamada', '  ')).toBe(false);
    expect(useTimelineStore.getState().add('l1', 'estado' as never, 'x')).toBe(false);
    expect(useTimelineStore.getState().events['l1']).toBeUndefined();
  });

  it('un cambio de etapa deja un evento automático', () => {
    useLeadStore.getState().updateLeadStatus('l1', 'contactado');
    const e = useTimelineStore.getState().events['l1'][0];
    expect(e.kind).toBe('estado');
    expect(e.text).toBe('Pasó a Contactado');
  });

  it('no registra evento si la etapa no cambia', () => {
    useLeadStore.getState().updateLeadStatus('l1', 'nuevo');
    expect(useTimelineStore.getState().events['l1']).toBeUndefined();
  });

  it('con base remota, load trae los eventos del lead y add los envía', async () => {
    const guardados: LeadEvent[] = [];
    const remoto: LeadEvent = { id: 'r1', leadId: 'l1', kind: 'visita', text: 'Visitó', occurredAt: '2026-11-01T10:00:00Z', author: 'x@y.cl' };
    setLeadEventRepository({
      mode: 'remote', newId: () => 'n1',
      listForLead: async () => [remoto],
      create: async (e) => { guardados.push(e); },
    });
    await useTimelineStore.getState().load('l1');
    expect(useTimelineStore.getState().events['l1']).toEqual([remoto]);
    useTimelineStore.getState().add('l1', 'correo', 'Envié ficha');
    expect(guardados).toHaveLength(1);
    expect(guardados[0].kind).toBe('correo');
  });
});

describe('useTimelineStore: fallos y carreras (H-057)', () => {
  beforeEach(() => {
    localStorage.clear();
    useTimelineStore.setState({ events: {}, saveError: null });
    useLeadStore.setState({ leads: [lead] });
  });
  afterEach(() => setLeadEventRepository(null));

  it('si la base no guarda el contacto, lo quita de la pantalla y avisa', async () => {
    setLeadEventRepository({ mode: 'remote', newId: () => 'n1', listForLead: async () => [], create: async () => { throw new Error('sin permiso'); } });
    useTimelineStore.getState().add('l1', 'llamada', 'Hola');
    await new Promise((r) => setTimeout(r, 0));
    expect(useTimelineStore.getState().events['l1']).toEqual([]);
    expect(useTimelineStore.getState().saveError).toMatch(/No se pudo guardar/);
  });

  it('un load que llega mientras se guarda no borra el contacto aún no confirmado', async () => {
    let liberar: () => void = () => undefined;
    setLeadEventRepository({
      mode: 'remote', newId: () => 'n1', listForLead: async () => [],
      create: () => new Promise<void>((res) => { liberar = res; }),
    });
    useTimelineStore.getState().add('l1', 'llamada', 'Hola');
    await useTimelineStore.getState().load('l1');
    expect(useTimelineStore.getState().events['l1']).toHaveLength(1);
    liberar();
  });

  it('con la base, el cambio de etapa se anota solo si quedó guardado', async () => {
    const creados: string[] = [];
    setLeadEventRepository({ mode: 'remote', newId: () => 'e1', listForLead: async () => [], create: async (e) => { creados.push(e.text); } });
    const { setLeadRepository } = await import('../services/leadRepository');
    setLeadRepository({
      mode: 'remote', newId: () => 'x', list: async () => [], create: async () => {}, remove: async () => {},
      update: async () => { throw new Error('falló'); },
    });
    useLeadStore.getState().updateLeadStatus('l1', 'contactado');
    await new Promise((r) => setTimeout(r, 0));
    setLeadRepository(null);
    expect(creados).toEqual([]);
  });

  it('al borrar el lead se borra su historial', () => {
    useTimelineStore.getState().add('l1', 'nota', 'algo');
    useLeadStore.getState().deleteLead('l1');
    expect(useTimelineStore.getState().events['l1']).toBeUndefined();
    expect(localStorage.getItem('urbe_lead_events')).not.toContain('algo');
  });
});

describe('useTimelineStore: loadAll (H-060)', () => {
  beforeEach(() => useTimelineStore.setState({ events: {}, saveError: null }));
  afterEach(() => setLeadEventRepository(null));

  it('con la base trae los eventos de todos los leads, agrupados', async () => {
    const e = (id: string, leadId: string): LeadEvent => ({ id, leadId, kind: 'llamada', text: 't', occurredAt: '2026-11-01T10:00:00Z', author: 'a' });
    setLeadEventRepository({ mode: 'remote', newId: () => 'n', listForLead: async () => [], listAll: async () => [e('1', 'a'), e('2', 'b'), e('3', 'a')], create: async () => {} });
    await useTimelineStore.getState().loadAll();
    expect(useTimelineStore.getState().events['a']).toHaveLength(2);
    expect(useTimelineStore.getState().events['b']).toHaveLength(1);
  });

  it('en el modo local no hace nada', async () => {
    useTimelineStore.setState({ events: { a: [] } });
    await useTimelineStore.getState().loadAll();
    expect(useTimelineStore.getState().events).toEqual({ a: [] });
  });
});

describe('useTimelineStore: estado de la carga completa (H-060)', () => {
  beforeEach(() => useTimelineStore.setState({ events: {}, allStatus: 'idle' }));
  afterEach(() => setLeadEventRepository(null));
  const repoCon = (listAll: () => Promise<LeadEvent[] | null>) =>
    setLeadEventRepository({ mode: 'remote', newId: () => 'n', listForLead: async () => [], listAll, create: async () => {} });

  it('si la base falla, queda en "error"', async () => {
    repoCon(async () => { throw new Error('sin red'); });
    await useTimelineStore.getState().loadAll();
    expect(useTimelineStore.getState().allStatus).toBe('error');
  });

  it('si llega al tope de eventos, queda en "truncated"', async () => {
    const e = (i: number): LeadEvent => ({ id: `e${i}`, leadId: 'a', kind: 'llamada', text: 't', occurredAt: '2026-11-01T10:00:00Z', author: 'a' });
    repoCon(async () => Array.from({ length: 5000 }, (_, i) => e(i)));
    await useTimelineStore.getState().loadAll();
    expect(useTimelineStore.getState().allStatus).toBe('truncated');
  });

  it('con pocos eventos queda en "ok"', async () => {
    repoCon(async () => []);
    await useTimelineStore.getState().loadAll();
    expect(useTimelineStore.getState().allStatus).toBe('ok');
  });
});
