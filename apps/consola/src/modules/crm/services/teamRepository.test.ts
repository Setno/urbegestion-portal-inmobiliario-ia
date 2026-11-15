import { describe, it, expect } from 'vitest';
import { createFakeSupabase } from '../../../core/data/fakeSupabase';
import { createLocalTeamRepository, createRemoteTeamRepository } from './teamRepository';

const TENANT = '5947138c-0eaa-4f12-8715-850e2fc833ae';

describe('equipo de la corredora', () => {
  it('lee el equipo con la función de la base, para la corredora de la sesión', async () => {
    const fake = createFakeSupabase({
      data: [
        { user_id: 'u1', email: 'jefa@corredora.cl', role: 'admin' },
        { user_id: 'u2', email: 'pedro@corredora.cl', role: 'agente' },
      ],
      error: null,
    });
    const team = await createRemoteTeamRepository(fake.client, TENANT).list();
    expect(fake.calls[0].table).toBe('rpc:team_members');
    expect(fake.argsOf(0, 'rpc')).toEqual([{ p_tenant: TENANT }]);
    expect(team).toEqual([
      { userId: 'u1', email: 'jefa@corredora.cl', role: 'admin' },
      { userId: 'u2', email: 'pedro@corredora.cl', role: 'agente' },
    ]);
  });

  it('descarta filas con un rol desconocido o sin id', async () => {
    const fake = createFakeSupabase({
      data: [{ user_id: 'u1', email: 'a@b.cl', role: 'dueño' }, { email: 'x@b.cl', role: 'agente' }, { user_id: 'u3', email: null, role: 'agente' }],
      error: null,
    });
    expect(await createRemoteTeamRepository(fake.client, TENANT).list()).toEqual([{ userId: 'u3', email: '', role: 'agente' }]);
  });

  it('si la base falla, lanza el error (la tienda decide qué mostrar)', async () => {
    const fake = createFakeSupabase({ data: null, error: { message: 'sin conexión' } });
    await expect(createRemoteTeamRepository(fake.client, TENANT).list()).rejects.toThrow();
  });

  it('sin base (datos en el navegador) no hay equipo', async () => {
    expect(await createLocalTeamRepository().list()).toEqual([]);
  });
});
