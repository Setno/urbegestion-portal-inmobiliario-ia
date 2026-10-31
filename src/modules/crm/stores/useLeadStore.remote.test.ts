import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useLeadStore } from './useLeadStore';
import { setLeadRepository, type LeadRepository } from '../services/leadRepository';
import type { Lead } from '../types/lead';

const base = (): Omit<Lead, 'id' | 'createdAt'> => ({
  fullName: 'Ana Prueba',
  email: 'ana@prueba.cl',
  phone: '+56 9 1111 2222',
  operationInterest: 'compra',
  status: 'nuevo',
  notes: ['n1'],
  source: 'formulario_contacto',
});

const remoto = (over: Partial<LeadRepository> = {}): LeadRepository => ({
  mode: 'remote',
  newId: () => 'uuid-fijo',
  list: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
  ...over,
});

describe('useLeadStore con repositorio remoto', () => {
  beforeEach(() => {
    localStorage.clear();
    useLeadStore.setState({ leads: [] });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('crea el lead con el id del repositorio y lo guarda en el repositorio, no en el navegador', () => {
    const repo = remoto();
    setLeadRepository(repo);
    const id = useLeadStore.getState().addLead(base());

    expect(id).toBe('uuid-fijo');
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(vi.mocked(repo.create).mock.calls[0][0]).toMatchObject({ id: 'uuid-fijo', fullName: 'Ana Prueba' });
    expect(localStorage.getItem('urbe_leads')).toBeNull();
    expect(useLeadStore.getState().leads[0].id).toBe('uuid-fijo');
  });

  it('si el repositorio falla al crear, conserva el lead en memoria, avisa y no rompe', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const repo = remoto({ create: vi.fn().mockRejectedValue(new Error('sin red')) });
    setLeadRepository(repo);

    expect(() => useLeadStore.getState().addLead(base())).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
    expect(useLeadStore.getState().leads).toHaveLength(1);
    expect(warn).toHaveBeenCalled();
  });

  it('cambiar estado, agregar nota y borrar pasan por el repositorio', () => {
    const repo = remoto();
    setLeadRepository(repo);
    const id = useLeadStore.getState().addLead(base());

    useLeadStore.getState().updateLeadStatus(id, 'contactado');
    expect(repo.update).toHaveBeenCalledWith(id, { status: 'contactado' }, expect.any(Array));

    useLeadStore.getState().addNoteToLead(id, 'n2');
    expect(repo.update).toHaveBeenCalledWith(id, { notes: ['n1', 'n2'] }, expect.any(Array));

    useLeadStore.getState().deleteLead(id);
    expect(repo.remove).toHaveBeenCalledWith(id, expect.any(Array));
    expect(useLeadStore.getState().leads).toHaveLength(0);
  });

  it('load() reemplaza la lista con la de la base', async () => {
    const delaBase: Lead[] = [{ ...base(), id: 'x1', createdAt: '2026-10-31' }];
    setLeadRepository(remoto({ list: vi.fn().mockResolvedValue(delaBase) }));
    await useLeadStore.getState().load();
    expect(useLeadStore.getState().leads).toEqual(delaBase);
  });

  it('load() deja la lista como estaba si la base falla', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setLeadRepository(remoto({ list: vi.fn().mockRejectedValue(new Error('sin red')) }));
    useLeadStore.setState({ leads: [{ ...base(), id: 'y1', createdAt: '2026-10-31' }] });
    await useLeadStore.getState().load();
    expect(useLeadStore.getState().leads).toHaveLength(1);
    expect(warn).toHaveBeenCalled();
  });

  it('load() no hace nada con el repositorio local', async () => {
    const list = vi.fn();
    setLeadRepository(remoto({ mode: 'local', list }));
    await useLeadStore.getState().load();
    expect(list).not.toHaveBeenCalled();
  });
});
