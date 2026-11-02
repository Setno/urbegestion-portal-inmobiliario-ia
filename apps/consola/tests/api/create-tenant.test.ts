// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CLAVE_SERVICIO = 'clave-de-servicio-secreta-123';

const fake = {
  getUser: vi.fn(),
  invite: vi.fn(),
  deleteUser: vi.fn(),
  insertTenant: vi.fn(),
  deleteTenant: vi.fn(),
  insertMembership: vi.fn(),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: fake.getUser, admin: { inviteUserByEmail: fake.invite, deleteUser: fake.deleteUser } },
    from: (table: string) => ({
      insert: table === 'tenants' ? fake.insertTenant : fake.insertMembership,
      delete: () => ({ eq: (...args: unknown[]) => fake.deleteTenant(...args) }),
    }),
  })),
}));

import { GET, POST } from '../../api/create-tenant';

const conToken = (method: string, body?: unknown, token: string | null = 'token-dueno') =>
  new Request('https://sitio.test/api/create-tenant', {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });

const alta = (body: unknown, token: string | null = 'token-dueno') => POST(conToken('POST', body, token));

const tenantOk = () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'tenant-nuevo' }, error: null }) }) });

describe('api/create-tenant', () => {
  beforeEach(() => {
    vi.stubEnv('SUPABASE_URL', 'https://proyecto.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', CLAVE_SERVICIO);
    vi.stubEnv('PLATFORM_OWNER_EMAILS', 'dueno@urbegestion.cl, otro@urbegestion.cl');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    fake.getUser.mockReset().mockResolvedValue({ data: { user: { id: 'u-dueno', email: 'Dueno@Urbegestion.cl' } }, error: null });
    fake.invite.mockReset().mockResolvedValue({ data: { user: { id: 'u-admin-nuevo' } }, error: null });
    fake.deleteUser.mockReset().mockResolvedValue({ error: null });
    fake.insertTenant.mockReset().mockImplementation(tenantOk);
    fake.deleteTenant.mockReset().mockResolvedValue({ error: null });
    fake.insertMembership.mockReset().mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('GET (¿soy dueño del producto?)', () => {
    it('responde owner:true si el correo del token está en la lista de dueños', async () => {
      const res = await GET(conToken('GET'));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ owner: true });
    });

    it('responde owner:false para cualquier otro usuario', async () => {
      fake.getUser.mockResolvedValue({ data: { user: { id: 'u-x', email: 'agente@urbegestion.cl' } }, error: null });
      expect(await (await GET(conToken('GET'))).json()).toEqual({ owner: false });
    });

    it('responde owner:false si no hay lista de dueños configurada', async () => {
      vi.stubEnv('PLATFORM_OWNER_EMAILS', '');
      expect(await (await GET(conToken('GET'))).json()).toEqual({ owner: false });
    });

    it('responde 401 sin token o con token inválido', async () => {
      expect((await GET(conToken('GET', undefined, null))).status).toBe(401);
      fake.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'jwt' } });
      expect((await GET(conToken('GET'))).status).toBe(401);
    });
  });

  describe('POST (alta de corredora)', () => {
    it('responde 503 si falta la clave de servicio', async () => {
      vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
      const res = await alta({ name: 'Corredora Sur', adminEmail: 'ana@sur.cl' });
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: 'not_configured' });
    });

    it('responde 401 sin token', async () => {
      expect((await alta({ name: 'Corredora Sur', adminEmail: 'ana@sur.cl' }, null)).status).toBe(401);
    });

    it('responde 403 si quien llama no es dueño del producto, sin crear nada', async () => {
      fake.getUser.mockResolvedValue({ data: { user: { id: 'u-adm', email: 'admin@corredora.cl' } }, error: null });
      const res = await alta({ name: 'Corredora Sur', adminEmail: 'ana@sur.cl' });
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: 'not_owner' });
      expect(fake.insertTenant).not.toHaveBeenCalled();
      expect(fake.invite).not.toHaveBeenCalled();
    });

    it.each([
      [{ name: '', adminEmail: 'ana@sur.cl' }, 'invalid_name'],
      [{ name: 'A', adminEmail: 'ana@sur.cl' }, 'invalid_name'],
      [{ name: 'x'.repeat(81), adminEmail: 'ana@sur.cl' }, 'invalid_name'],
      [{ name: 'Corredora Sur', adminEmail: 'sin-arroba' }, 'invalid_email'],
      [{ name: 'Corredora Sur' }, 'invalid_email'],
    ])('responde 400 con datos inválidos %j', async (body, codigo) => {
      const res = await alta(body);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: codigo });
      expect(fake.insertTenant).not.toHaveBeenCalled();
    });

    it('crea la corredora, invita al administrador y crea su membresía de admin', async () => {
      const res = await alta({ name: '  Corredora Sur  ', adminEmail: ' Ana@Sur.cl ' });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      expect(fake.insertTenant).toHaveBeenCalledWith({ name: 'Corredora Sur' });
      expect(fake.invite).toHaveBeenCalledWith('ana@sur.cl', { redirectTo: 'https://sitio.test/' });
      expect(fake.insertMembership).toHaveBeenCalledWith({ tenant_id: 'tenant-nuevo', user_id: 'u-admin-nuevo', role: 'admin' });
    });

    it('nunca incluye la clave de servicio en la respuesta', async () => {
      const res = await alta({ name: 'Corredora Sur', adminEmail: 'ana@sur.cl' });
      expect(JSON.stringify(await res.json())).not.toContain(CLAVE_SERVICIO);
    });

    it('responde 409 si el nombre de la corredora ya existe, sin invitar a nadie', async () => {
      fake.insertTenant.mockImplementation(() => ({
        select: () => ({ single: () => Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate' } }) }),
      }));
      const res = await alta({ name: 'Corredora Sur', adminEmail: 'ana@sur.cl' });
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ error: 'name_taken' });
      expect(fake.invite).not.toHaveBeenCalled();
    });

    it('si el correo del administrador ya tiene cuenta, responde 409 y deshace la corredora', async () => {
      fake.invite.mockResolvedValue({ data: { user: null }, error: { status: 422, code: 'email_exists', message: 'already registered' } });
      const res = await alta({ name: 'Corredora Sur', adminEmail: 'ana@sur.cl' });
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ error: 'email_exists' });
      expect(fake.deleteTenant).toHaveBeenCalledWith('id', 'tenant-nuevo');
    });

    it('si falla el envío de la invitación, responde 502 y deshace la corredora', async () => {
      fake.invite.mockResolvedValue({ data: { user: null }, error: { status: 429, message: 'rate limit' } });
      const res = await alta({ name: 'Corredora Sur', adminEmail: 'ana@sur.cl' });
      expect(res.status).toBe(502);
      expect(fake.deleteTenant).toHaveBeenCalledWith('id', 'tenant-nuevo');
    });

    it('si falla la membresía, deshace la cuenta invitada y la corredora', async () => {
      fake.insertMembership.mockResolvedValue({ error: { message: 'boom' } });
      const res = await alta({ name: 'Corredora Sur', adminEmail: 'ana@sur.cl' });
      expect(res.status).toBe(500);
      expect(fake.deleteUser).toHaveBeenCalledWith('u-admin-nuevo');
      expect(fake.deleteTenant).toHaveBeenCalledWith('id', 'tenant-nuevo');
    });
  });
});
