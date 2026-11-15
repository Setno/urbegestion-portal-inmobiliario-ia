import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useLeadStore } from './useLeadStore';
import { setLeadRepository, type LeadRepository } from '../services/leadRepository';
import type { Lead } from '../types/lead';

const ana: Lead = {
  id: 'l1',
  fullName: 'Ana',
  email: '',
  phone: '',
  operationInterest: 'compra',
  status: 'nuevo',
  notes: [],
  source: 'formulario_contacto',
  createdAt: '2026-11-15',
};

const remoto = (over: Partial<LeadRepository> = {}): LeadRepository => ({
  mode: 'remote',
  newId: () => 'uuid-fijo',
  list: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
  ...over,
});

describe('asignar el responsable de un lead (H-069.1)', () => {
  beforeEach(() => {
    useLeadStore.setState({ leads: [ana] });
  });

  afterEach(() => {
    setLeadRepository(null);
    vi.restoreAllMocks();
  });

  it('guarda el responsable en la lista y en la base', async () => {
    const repo = remoto();
    setLeadRepository(repo);
    await useLeadStore.getState().assignLead('l1', 'agente-1');
    expect(useLeadStore.getState().leads[0].assignedTo).toBe('agente-1');
    expect(repo.update).toHaveBeenCalledWith('l1', { assignedTo: 'agente-1' }, expect.any(Array));
  });

  it('quitar el responsable envía el campo vacío para que la base lo borre', async () => {
    useLeadStore.setState({ leads: [{ ...ana, assignedTo: 'agente-1' }] });
    const repo = remoto();
    setLeadRepository(repo);
    await useLeadStore.getState().assignLead('l1', undefined);
    expect(useLeadStore.getState().leads[0].assignedTo).toBeUndefined();
    const patch = (repo.update as ReturnType<typeof vi.fn>).mock.calls[0][1] as Partial<Lead>;
    expect('assignedTo' in patch).toBe(true);
    expect(patch.assignedTo).toBeUndefined();
  });

  it('si la base lo rechaza (por ejemplo, otro agente lo tomó primero), vuelve al responsable anterior y avisa', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    useLeadStore.setState({ leads: [{ ...ana, assignedTo: 'agente-2' }] });
    setLeadRepository(remoto({ update: vi.fn().mockRejectedValue(new Error('42501')) }));
    const ok = await useLeadStore.getState().assignLead('l1', 'agente-1');
    expect(ok).toBe(false);
    expect(useLeadStore.getState().leads[0].assignedTo).toBe('agente-2');
  });

  it('si un primer cambio falla tarde, no pisa un segundo cambio que sí se guardó', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    let rechazar: (e: Error) => void = () => undefined;
    const update = vi
      .fn()
      .mockImplementationOnce(() => new Promise<void>((_, reject) => { rechazar = reject; }))
      .mockResolvedValueOnce(undefined);
    setLeadRepository(remoto({ update }));
    const primero = useLeadStore.getState().assignLead('l1', 'agente-1');
    await useLeadStore.getState().assignLead('l1', 'agente-2');
    rechazar(new Error('se cortó'));
    expect(await primero).toBe(false);
    expect(useLeadStore.getState().leads[0].assignedTo).toBe('agente-2');
  });

  it('un lead que no existe no se toca', async () => {
    const repo = remoto();
    setLeadRepository(repo);
    expect(await useLeadStore.getState().assignLead('no-existe', 'agente-1')).toBe(false);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
