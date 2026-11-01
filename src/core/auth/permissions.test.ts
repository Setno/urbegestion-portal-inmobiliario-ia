import { describe, it, expect } from 'vitest';
import { allowedTabs, canOpenTab, safeTab, canInviteAgents } from './permissions';

describe('permisos por rol', () => {
  it('el administrador ve todas las pestañas', () => {
    expect(allowedTabs('admin')).toEqual(['crm', 'properties', 'analytics', 'settings', 'branding']);
  });

  it('el agente ve Leads, Propiedades y Métricas, y no Integraciones ni Identidad y Marca', () => {
    expect(allowedTabs('agente')).toEqual(['crm', 'properties', 'analytics']);
    expect(canOpenTab('agente', 'settings')).toBe(false);
    expect(canOpenTab('agente', 'branding')).toBe(false);
  });

  it('sin rol no se ve ninguna pestaña', () => {
    expect(allowedTabs(null)).toEqual([]);
    expect(canOpenTab(null, 'crm')).toBe(false);
  });

  it('safeTab devuelve la misma pestaña si está permitida y, si no, la primera permitida', () => {
    expect(safeTab('agente', 'analytics')).toBe('analytics');
    expect(safeTab('agente', 'settings')).toBe('crm');
    expect(safeTab('admin', 'branding')).toBe('branding');
  });

  it('solo el administrador puede invitar agentes', () => {
    expect(canInviteAgents('admin')).toBe(true);
    expect(canInviteAgents('agente')).toBe(false);
    expect(canInviteAgents(null)).toBe(false);
  });
});
