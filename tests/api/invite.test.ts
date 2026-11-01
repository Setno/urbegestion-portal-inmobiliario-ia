// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CLAVE_SERVICIO = 'clave-de-servicio-secreta-123';

// Cliente de Supabase simulado: cada prueba define qué responde cada consulta, y se registran
// las consultas para comprobar que se filtra por el usuario y el rol correctos.
const fake = {
  getUser: vi.fn(),
  listUsers: vi.fn(),
  invite: vi.fn(),
  deleteUser: vi.fn(),
  selects: [] as Array<{ data: unknown; error: unknown }>,
  insert: vi.fn(),
  queries: [] as Array<{ table: string; ops: Array<[string, unknown[]]> }>,
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: fake.getUser,
      admin: { listUsers: fake.listUsers, inviteUserByEmail: fake.invite, deleteUser: fake.deleteUser },
    },
    from: (table: string) => {
      const query = { table, ops: [] as Array<[string, unknown[]]> };
      fake.queries.push(query);
      const builder: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'limit']) {
        builder[m] = (...args: unknown[]) => {
          query.ops.push([m, args]);
          return builder;
        };
      }
      builder.maybeSingle = () => Promise.resolve(fake.selects.shift() ?? { data: null, error: null });
      builder.insert = fake.insert;
      return builder;
    },
  })),
}));

import { POST } from '../../api/invite';

const pedido = (body: unknown, token: string | null = 'token-admin') =>
  new Request('https://sitio.test/api/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const yaRegistrado = { data: { user: null }, error: { status: 422, code: 'email_exists', message: 'already registered' } };

describe('api/invite', () => {
  beforeEach(() => {
    vi.stubEnv('SUPABASE_URL', 'https://proyecto.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', CLAVE_SERVICIO);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    fake.queries = [];
    fake.getUser.mockReset().mockResolvedValue({ data: { user: { id: 'u-admin' } }, error: null });
    fake.listUsers.mockReset().mockResolvedValue({ data: { users: [] }, error: null });
    fake.invite.mockReset().mockResolvedValue({ data: { user: { id: 'u-nuevo' } }, error: null });
    fake.deleteUser.mockReset().mockResolvedValue({ error: null });
    fake.insert.mockReset().mockResolvedValue({ error: null });
    // 1ª consulta: la membresía de admin de quien invita
    fake.selects = [{ data: { tenant_id: 'tenant-1' }, error: null }];
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('responde 503 si falta la clave de servicio, sin exponer nada', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const res = await POST(pedido({ email: 'ana@correo.cl' }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'invite_not_configured' });
  });

  it('responde 401 si no viene el token de sesión', async () => {
    const res = await POST(pedido({ email: 'ana@correo.cl' }, null));
    expect(res.status).toBe(401);
    expect(fake.invite).not.toHaveBeenCalled();
  });

  it('responde 401 si el token no corresponde a un usuario', async () => {
    fake.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'jwt malformed' } });
    const res = await POST(pedido({ email: 'ana@correo.cl' }));
    expect(res.status).toBe(401);
    expect(fake.invite).not.toHaveBeenCalled();
  });

  it('verifica el token recibido y busca la membresía de ADMIN de ese usuario', async () => {
    await POST(pedido({ email: 'ana@correo.cl' }, 'token-admin'));

    expect(fake.getUser).toHaveBeenCalledWith('token-admin');
    const consulta = fake.queries[0];
    expect(consulta.table).toBe('memberships');
    expect(consulta.ops).toContainEqual(['eq', ['user_id', 'u-admin']]);
    expect(consulta.ops).toContainEqual(['eq', ['role', 'admin']]);
  });

  it('responde 403 si quien invita no es administrador de una corredora', async () => {
    fake.selects = [{ data: null, error: null }];
    const res = await POST(pedido({ email: 'ana@correo.cl' }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'not_admin' });
    expect(fake.invite).not.toHaveBeenCalled();
    expect(fake.insert).not.toHaveBeenCalled();
  });

  it('responde 500 si falla la consulta de la membresía del administrador', async () => {
    fake.selects = [{ data: null, error: { message: 'caído' } }];
    const res = await POST(pedido({ email: 'ana@correo.cl' }));
    expect(res.status).toBe(500);
    expect(fake.invite).not.toHaveBeenCalled();
  });

  it.each(['', 'sin-arroba', 'a@b', 'dos@@correo.cl', 'con espacio@correo.cl'])(
    'responde 400 si el correo no es válido (%s)',
    async (email) => {
      const res = await POST(pedido({ email }));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'invalid_email' });
      expect(fake.invite).not.toHaveBeenCalled();
    },
  );

  it('responde 400 si el cuerpo no es JSON', async () => {
    const res = await POST(pedido('no es json'));
    expect(res.status).toBe(400);
  });

  it('invita al correo y crea la membresía de agente en la corredora de quien invita', async () => {
    const res = await POST(pedido({ email: '  Ana@Correo.cl ' }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, status: 'invitado' });
    expect(fake.invite).toHaveBeenCalledWith('ana@correo.cl', { redirectTo: 'https://sitio.test/' });
    expect(fake.insert).toHaveBeenCalledWith({ tenant_id: 'tenant-1', user_id: 'u-nuevo', role: 'agente' });
  });

  it('usa SITE_URL como destino del enlace si está definida, siempre con una sola barra final', async () => {
    vi.stubEnv('SITE_URL', 'https://portal.ejemplo.cl//');
    await POST(pedido({ email: 'ana@correo.cl' }));
    expect(fake.invite).toHaveBeenCalledWith('ana@correo.cl', { redirectTo: 'https://portal.ejemplo.cl/' });
  });

  it('ignora corredora y rol que vengan en el cuerpo: salen de la base', async () => {
    await POST(pedido({ email: 'ana@correo.cl', tenant_id: 'tenant-ajeno', role: 'admin' }));
    expect(fake.insert).toHaveBeenCalledWith({ tenant_id: 'tenant-1', user_id: 'u-nuevo', role: 'agente' });
  });

  it('nunca incluye la clave de servicio en la respuesta', async () => {
    const res = await POST(pedido({ email: 'ana@correo.cl' }));
    expect(JSON.stringify(await res.json())).not.toContain(CLAVE_SERVICIO);
  });

  describe('correo que ya tiene cuenta', () => {
    beforeEach(() => {
      fake.invite.mockResolvedValue(yaRegistrado);
      fake.listUsers.mockResolvedValue({ data: { users: [{ id: 'u-ana', email: 'Ana@correo.cl' }] }, error: null });
    });

    it('responde 409 si ya es miembro o ya fue invitado, sin duplicar', async () => {
      fake.selects.push({ data: { tenant_id: 'tenant-1' }, error: null });
      const res = await POST(pedido({ email: 'ana@correo.cl' }));
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ error: 'already_member' });
      expect(fake.insert).not.toHaveBeenCalled();
    });

    it('responde 409 si ya pertenece a otra corredora', async () => {
      fake.selects.push({ data: { tenant_id: 'tenant-2' }, error: null });
      const res = await POST(pedido({ email: 'ana@correo.cl' }));
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ error: 'other_tenant' });
      expect(fake.insert).not.toHaveBeenCalled();
    });

    it('si tiene cuenta pero sin corredora, solo lo agrega como agente', async () => {
      fake.selects.push({ data: null, error: null });
      const res = await POST(pedido({ email: 'ana@correo.cl' }));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true, status: 'agregado' });
      expect(fake.insert).toHaveBeenCalledWith({ tenant_id: 'tenant-1', user_id: 'u-ana', role: 'agente' });
    });

    it('busca al usuario en la segunda página si no está en la primera', async () => {
      const llena = Array.from({ length: 1000 }, (_, i) => ({ id: `u-${i}`, email: `otro${i}@correo.cl` }));
      fake.listUsers
        .mockResolvedValueOnce({ data: { users: llena }, error: null })
        .mockResolvedValueOnce({ data: { users: [{ id: 'u-ana', email: 'ana@correo.cl' }] }, error: null });
      fake.selects.push({ data: null, error: null });

      const res = await POST(pedido({ email: 'ana@correo.cl' }));

      expect(res.status).toBe(200);
      expect(fake.listUsers).toHaveBeenCalledTimes(2);
    });

    it('responde 500 si falla la búsqueda de usuarios', async () => {
      fake.listUsers.mockResolvedValue({ data: null, error: { message: 'caído' } });
      const res = await POST(pedido({ email: 'ana@correo.cl' }));
      expect(res.status).toBe(500);
    });

    it('si la membresía ya existe por una carrera (23505), responde 409 y no 500', async () => {
      fake.selects.push({ data: null, error: null });
      fake.insert.mockResolvedValue({ error: { code: '23505', message: 'duplicate' } });
      const res = await POST(pedido({ email: 'ana@correo.cl' }));
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ error: 'already_member' });
    });
  });

  it('si falla crear la membresía, deshace la invitación y responde 500', async () => {
    fake.insert.mockResolvedValue({ error: { message: 'boom' } });
    const res = await POST(pedido({ email: 'ana@correo.cl' }));
    expect(res.status).toBe(500);
    expect(fake.deleteUser).toHaveBeenCalledWith('u-nuevo');
  });

  it('responde 502 si Supabase no puede enviar la invitación', async () => {
    fake.invite.mockResolvedValue({ data: { user: null }, error: { status: 429, message: 'rate limit' } });
    const res = await POST(pedido({ email: 'ana@correo.cl' }));
    expect(res.status).toBe(502);
    expect(fake.insert).not.toHaveBeenCalled();
    expect(fake.listUsers).not.toHaveBeenCalled();
  });
});
