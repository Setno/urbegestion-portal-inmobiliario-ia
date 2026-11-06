import { describe, it, expect, beforeEach, vi } from 'vitest';

// H-064 (revisión): una carga lenta de la corredora anterior no puede pisar los datos de la nueva, y al cambiar de
// corredora no queda nada de la anterior en memoria (lead seleccionado, historial, derechos, leads en vivo).
const mocks = vi.hoisted(() => ({
  fetchEntitlements: vi.fn(),
  fetchPublicEntitlements: vi.fn(),
}));
vi.mock('../platform/entitlementsService', () => ({
  fetchEntitlements: mocks.fetchEntitlements,
  fetchPublicEntitlements: mocks.fetchPublicEntitlements,
}));

import { setSessionTenant } from './dataSource';
import { useLeadStore } from '../../modules/crm/stores/useLeadStore';
import { setLeadRepository, type LeadRepository } from '../../modules/crm/services/leadRepository';
import { useTimelineStore } from '../../modules/crm/stores/useTimelineStore';
import { setLeadEventRepository, type LeadEventRepository } from '../../modules/crm/services/leadEventRepository';
import { usePropertyStore } from '../../modules/catalogo/stores/usePropertyStore';
import { setPropertyRepository, type PropertyRepository } from '../../modules/catalogo/services/propertyRepository';
import { useEntitlementsStore } from '../platform/useEntitlementsStore';

// Una promesa que se resuelve cuando el test lo decide: simula una respuesta lenta de la base.
const diferida = <T>() => {
  let resolver!: (v: T) => void;
  const promesa = new Promise<T>((r) => {
    resolver = r;
  });
  return { promesa, resolver };
};

const lead = (id: string) => ({ id, fullName: `Lead ${id}` }) as never;
const propiedad = (id: string) => ({ id, title: `Propiedad ${id}` }) as never;

describe('cambio de corredora: cargas tardías', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSessionTenant(null);
    useLeadStore.setState({ leads: [], selectedLead: null });
    usePropertyStore.setState({ properties: [], loading: false });
    useTimelineStore.setState({ events: {}, allStatus: 'idle', saveError: null });
    useEntitlementsStore.getState().reset();
  });

  it('leads: la respuesta tardía de A no se muestra si ya se entró con B', async () => {
    const repo = { mode: 'remote', list: vi.fn() } as unknown as LeadRepository;
    setLeadRepository(repo);
    const lenta = diferida<unknown>();
    (repo.list as ReturnType<typeof vi.fn>).mockReturnValue(lenta.promesa);
    setSessionTenant('A');
    const carga = useLeadStore.getState().load();
    setSessionTenant('B');
    lenta.resolver([lead('de-A')]);
    await carga;
    expect(useLeadStore.getState().leads).toEqual([]);
    setLeadRepository(null);
  });

  it('propiedades: la carga tardía de A no pisa a B ni apaga el indicador de la carga de B', async () => {
    const repo = { mode: 'remote', list: vi.fn() } as unknown as PropertyRepository;
    setPropertyRepository(repo);
    const deA = diferida<unknown>();
    const deB = diferida<unknown>();
    (repo.list as ReturnType<typeof vi.fn>).mockReturnValueOnce(deA.promesa).mockReturnValueOnce(deB.promesa);
    setSessionTenant('A');
    const cargaA = usePropertyStore.getState().load();
    setSessionTenant('B');
    const cargaB = usePropertyStore.getState().load();
    deA.resolver([propiedad('de-A')]);
    await cargaA;
    expect(usePropertyStore.getState().properties).toEqual([]);
    expect(usePropertyStore.getState().loading).toBe(true);
    deB.resolver([propiedad('de-B')]);
    await cargaB;
    expect(usePropertyStore.getState().properties).toEqual([propiedad('de-B')]);
    expect(usePropertyStore.getState().loading).toBe(false);
    setPropertyRepository(null);
  });

  it('historial completo: la respuesta tardía de A no se mezcla con B', async () => {
    const repo = { mode: 'remote', listAll: vi.fn() } as unknown as LeadEventRepository;
    setLeadEventRepository(repo);
    const lenta = diferida<unknown>();
    (repo.listAll as ReturnType<typeof vi.fn>).mockReturnValue(lenta.promesa);
    setSessionTenant('A');
    const carga = useTimelineStore.getState().loadAll();
    setSessionTenant('B');
    lenta.resolver([{ id: 'e1', leadId: 'x', kind: 'nota', text: 'secreto de A', occurredAt: '2026-01-01T00:00:00Z', author: 'a' }]);
    await carga;
    expect(useTimelineStore.getState().events).toEqual({});
    setLeadEventRepository(null);
  });

  it('derechos: lo que llega tarde de A no se aplica a B', async () => {
    const lenta = diferida<unknown>();
    mocks.fetchPublicEntitlements.mockReturnValue(lenta.promesa);
    setSessionTenant('A');
    const carga = useEntitlementsStore.getState().loadPublic();
    setSessionTenant('B');
    lenta.resolver({ planCode: 'plan-de-A', status: 'active', features: {}, limits: {}, updatedAt: '2026-01-01T00:00:00Z' });
    await carga;
    expect(useEntitlementsStore.getState().entitlements.planCode).toBeNull();
  });
});

describe('reset de las tiendas al cambiar de corredora', () => {
  it('leads: vacía la lista, el lead seleccionado y los leads recibidos en vivo', async () => {
    useLeadStore.setState({ leads: [lead('1')], selectedLead: lead('1') });
    useLeadStore.getState().receiveLead(lead('en-vivo'));
    useLeadStore.getState().reset();
    expect(useLeadStore.getState().leads).toEqual([]);
    expect(useLeadStore.getState().selectedLead).toBeNull();
    // Un lead en vivo de la corredora anterior no reaparece al cargar la nueva
    const repo = { mode: 'remote', list: vi.fn().mockResolvedValue([lead('de-B')]) } as unknown as LeadRepository;
    setLeadRepository(repo);
    await useLeadStore.getState().load();
    expect(useLeadStore.getState().leads).toEqual([lead('de-B')]);
    setLeadRepository(null);
  });

  it('historial: vacía los eventos, el error y el estado de la carga completa', () => {
    useTimelineStore.setState({ events: { x: [{ id: 'e' } as never] }, allStatus: 'error', saveError: 'falló' });
    useTimelineStore.getState().reset();
    const st = useTimelineStore.getState();
    expect(st.events).toEqual({});
    expect(st.allStatus).toBe('idle');
    expect(st.saveError).toBeNull();
  });

  it('propiedades: vacía la lista y apaga el indicador de carga', () => {
    usePropertyStore.setState({ properties: [propiedad('1')], loading: true });
    usePropertyStore.getState().reset();
    expect(usePropertyStore.getState().properties).toEqual([]);
    expect(usePropertyStore.getState().loading).toBe(false);
  });
});
