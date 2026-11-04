import { REVALIDATE_SECONDS, type SiteEnv } from './getSite';

// Qué herramientas de captación incluye el plan de la corredora (ADR-009). Solo salen dos sí/no: el sitio nunca ve el plan.
export interface FuncionesDelSitio {
  chat: boolean;
  valorizador: boolean;
}

const NINGUNA: FuncionesDelSitio = { chat: false, valorizador: false };

// Sin dirección conocida, o si la corredora no puede mostrar su sitio, no se ofrece nada.
// Si falla la lectura lanza un error, para que Next conserve la última copia buena en vez de publicar la página sin herramientas.
export async function getFunciones(env: SiteEnv | null): Promise<FuncionesDelSitio> {
  if (!env) return NINGUNA;
  const response = await fetch(`${env.url}/rest/v1/rpc/get_site_features`, {
    method: 'POST',
    headers: { apikey: env.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_tenant: env.tenantId }),
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!response.ok) throw new Error(`La base respondió ${response.status} al leer las herramientas del plan`);
  const data: unknown = await response.json();
  if (typeof data !== 'object' || data === null) return NINGUNA;
  const { chat, valuation } = data as Record<string, unknown>;
  // Solo un "sí" verdadero la enciende: cualquier otra cosa se toma como apagada.
  return { chat: chat === true, valorizador: valuation === true };
}
