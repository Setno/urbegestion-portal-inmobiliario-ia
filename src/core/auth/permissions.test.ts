import { describe, it, expect } from 'vitest';
import { allowedTabs, canOpenTab, safeTab, canInviteAgents, canExportData, canEditServiceAreas } from './permissions';

describe('permisos por rol', () => {
  it('el administrador ve las pestañas de trabajo y las de su corredora, pero no la de plataforma', () => {
    expect(allowedTabs('admin')).toEqual(['crm', 'properties', 'analytics', 'tenant', 'settings', 'branding']);
    expect(canOpenTab('admin', 'platform')).toBe(false);
  });

  it('el dueño del producto suma la pestaña Plataforma, sea cual sea su rol en su corredora', () => {
    expect(allowedTabs('admin', true)).toEqual(['crm', 'properties', 'analytics', 'tenant', 'settings', 'branding', 'platform']);
    expect(allowedTabs('agente', true)).toEqual(['crm', 'properties', 'analytics', 'platform']);
    expect(canOpenTab('agente', 'platform', true)).toBe(true);
    expect(safeTab('agente', 'platform', false)).toBe('crm');
    expect(safeTab('agente', 'platform', true)).toBe('platform');
  });

  it('el agente ve Leads, Propiedades y Métricas, y no Mi corredora, Integraciones ni Identidad y Marca', () => {
    expect(allowedTabs('agente')).toEqual(['crm', 'properties', 'analytics']);
    expect(canOpenTab('agente', 'tenant')).toBe(false);
    expect(canOpenTab('agente', 'settings')).toBe(false);
    expect(canOpenTab('agente', 'branding')).toBe(false);
  });

  it('sin rol no se ve ninguna pestaña', () => {
    expect(allowedTabs(null)).toEqual([]);
    expect(canOpenTab(null, 'crm')).toBe(false);
    expect(allowedTabs(null, true)).toEqual([]);
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

  it('solo el administrador puede exportar los datos de la corredora', () => {
    expect(canExportData('admin')).toBe(true);
    expect(canExportData('agente')).toBe(false);
    expect(canExportData(null)).toBe(false);
  });

  it('solo el administrador puede elegir las zonas de trabajo de la corredora', () => {
    expect(canEditServiceAreas('admin')).toBe(true);
    expect(canEditServiceAreas('agente')).toBe(false);
    expect(canEditServiceAreas(null)).toBe(false);
  });
});
