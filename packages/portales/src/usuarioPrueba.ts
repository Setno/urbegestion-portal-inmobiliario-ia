// Crear un usuario de prueba de Mercado Libre (H-068.3d, solo previews). Mercado Libre no tiene sandbox: las pruebas se hacen
// con usuarios de prueba (POST /users/test_user), que pueden publicar sin cargos ni sanciones. Máximo 10 por cuenta.
// La contraseña vuelve una sola vez, solo para mostrarla a quien la pidió; nunca se guarda ni se escribe en logs.
import type { TokenFetcher } from './oauth.js';

export type UsuarioPrueba = { id: string; nickname: string; password: string };
export type CrearUsuarioPruebaResult = { ok: true; user: UsuarioPrueba } | { ok: false; error: 'rechazado' | 'respuesta' | 'red'; message?: string };

export async function createTestUser(input: { accessToken: string; fetcher: TokenFetcher; siteId?: string }): Promise<CrearUsuarioPruebaResult> {
  try {
    const r = await input.fetcher('https://api.mercadolibre.com/users/test_user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${input.accessToken}` },
      body: JSON.stringify({ site_id: input.siteId ?? 'MLC' }),
    });
    const body: unknown = await r.json().catch(() => ({}));
    const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    if (r.status >= 500) return { ok: false, error: 'red' };
    if (!r.ok) return { ok: false, error: 'rechazado', message: typeof b.message === 'string' ? b.message.trim().slice(0, 200) : undefined };
    const id = typeof b.id === 'number' || typeof b.id === 'string' ? String(b.id) : '';
    if (!id || typeof b.nickname !== 'string' || typeof b.password !== 'string') return { ok: false, error: 'respuesta' };
    return { ok: true, user: { id, nickname: b.nickname, password: b.password } };
  } catch {
    return { ok: false, error: 'red' };
  }
}
