import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// H-064: la corredora sale de la sesión del usuario; VITE_TENANT_ID queda solo como respaldo (portada pública y desarrollo).
// En pruebas el módulo se carga como "producción" para que la base cuente como configurada.
vi.mock('../auth/supabaseClient', () => ({ supabase: { marca: 'cliente' }, isSupabaseConfigured: true }));

type DataSource = typeof import('./dataSource');

async function cargar(tenantDeLaVariable?: string): Promise<DataSource> {
  vi.resetModules();
  vi.stubEnv('MODE', 'production');
  vi.stubEnv('VITE_TENANT_ID', tenantDeLaVariable ?? '');
  return import('./dataSource');
}

describe('dataSource: corredora de la sesión', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sin variable ni sesión no hay base remota', async () => {
    const ds = await cargar();
    expect(ds.remoteContext()).toBeNull();
  });

  it('con solo la variable usa esa corredora', async () => {
    const ds = await cargar('tenant-env');
    expect(ds.remoteContext()?.tenantId).toBe('tenant-env');
  });

  it('con una corredora en la sesión la usa aunque no haya variable', async () => {
    const ds = await cargar();
    ds.setSessionTenant('tenant-sesion');
    expect(ds.remoteContext()?.tenantId).toBe('tenant-sesion');
  });

  it('la corredora de la sesión manda sobre la variable, y al cerrar sesión vuelve la variable', async () => {
    const ds = await cargar('tenant-env');
    ds.setSessionTenant('tenant-sesion');
    expect(ds.remoteContext()?.tenantId).toBe('tenant-sesion');
    ds.setSessionTenant(null);
    expect(ds.remoteContext()?.tenantId).toBe('tenant-env');
  });

  it('avisa a quien escuche solo cuando la corredora efectiva cambia', async () => {
    const ds = await cargar();
    const oyente = vi.fn();
    const dejar = ds.onTenantChange(oyente);
    ds.setSessionTenant('a');
    ds.setSessionTenant('a');
    ds.setSessionTenant('b');
    ds.setSessionTenant(null);
    expect(oyente.mock.calls.map((c) => c[0])).toEqual(['a', 'b', null]);
    dejar();
    ds.setSessionTenant('c');
    expect(oyente).toHaveBeenCalledTimes(3);
  });

  describe('createScopedRepository', () => {
    let ds: DataSource;
    beforeEach(async () => {
      ds = await cargar();
    });

    it('arma el repositorio una vez por corredora y lo reutiliza', () => {
      const armar = vi.fn((ctx: { tenantId: string } | null) => ({ tenant: ctx?.tenantId ?? 'local' }));
      const repo = ds.createScopedRepository(armar);
      ds.setSessionTenant('a');
      expect(repo.get()).toBe(repo.get());
      expect(armar).toHaveBeenCalledTimes(1);
      expect(repo.get().tenant).toBe('a');
    });

    it('al cambiar de corredora arma uno nuevo, y al cerrar sesión vuelve al local', () => {
      const repo = ds.createScopedRepository((ctx) => ({ tenant: ctx?.tenantId ?? 'local' }));
      ds.setSessionTenant('a');
      expect(repo.get().tenant).toBe('a');
      ds.setSessionTenant('b');
      expect(repo.get().tenant).toBe('b');
      ds.setSessionTenant(null);
      expect(repo.get().tenant).toBe('local');
    });

    it('un repositorio inyectado a mano (pruebas) no se reemplaza al cambiar de corredora', () => {
      const repo = ds.createScopedRepository((ctx) => ({ tenant: ctx?.tenantId ?? 'local' }));
      const falso = { tenant: 'falso' };
      repo.set(falso);
      ds.setSessionTenant('a');
      expect(repo.get()).toBe(falso);
      repo.set(null);
      expect(repo.get().tenant).toBe('a');
    });
  });
});
