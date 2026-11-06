import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';

// H-064 (revisión): el aviso en vivo debe seguir a la corredora de la sesión, no quedarse en la anterior.
const mocks = vi.hoisted(() => ({ subscribe: vi.fn(), dejar: vi.fn() }));
vi.mock('../services/leadRealtime', () => ({ subscribeNewLeads: mocks.subscribe }));

import { NewLeadNotice } from './NewLeadNotice';
import { useAuthStore } from '../../../core/auth/useAuthStore';

const membresia = (tenantId: string) => ({ tenantId, tenantName: 'X', role: 'admin' as const, publicationMode: 'con_aprobacion' as const });

describe('NewLeadNotice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.subscribe.mockReturnValue(mocks.dejar);
    useAuthStore.setState({ status: 'con_sesion', email: 'ana@ejemplo.test', membership: membresia('A') });
  });
  afterEach(() => {
    cleanup();
    useAuthStore.setState({ status: 'cargando', email: null, membership: null });
  });

  it('al cambiar la corredora de la sesión suelta la suscripción anterior y abre una nueva', () => {
    render(<NewLeadNotice active onOpenCrm={() => undefined} />);
    expect(mocks.subscribe).toHaveBeenCalledTimes(1);
    act(() => useAuthStore.setState({ membership: membresia('B') }));
    expect(mocks.dejar).toHaveBeenCalledTimes(1);
    expect(mocks.subscribe).toHaveBeenCalledTimes(2);
  });

  it('inactivo no se suscribe', () => {
    render(<NewLeadNotice active={false} onOpenCrm={() => undefined} />);
    expect(mocks.subscribe).not.toHaveBeenCalled();
  });
});
