// Límite de llamadas por dirección IP para las funciones de Vercel (H-005).
// El archivo empieza con "_" a propósito: Vercel no lo publica como una ruta.
//
// Límite de este mecanismo: el conteo vive en la memoria de cada instancia de la función, así que frena el uso
// abusivo desde una misma dirección pero no es un tope global exacto (varias instancias llevan cuentas separadas).
// El tope firme se pone en el firewall de Vercel (ver docs/guia-produccion.md).

export interface RateLimiter {
  // Devuelve cuántos segundos faltan para poder reintentar, o 0 si la llamada puede seguir.
  check: (key: string | null, now?: number) => number;
}

export function createRateLimiter({ max, windowMs }: { max: number; windowMs: number }): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    check: (key, now = Date.now()) => {
      // Sin dirección identificable no se limita: Vercel siempre la entrega, así que esto solo ocurre fuera de Vercel.
      if (!key) return 0;
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= max) {
        hits.set(key, recent);
        return Math.ceil((windowMs - (now - recent[0])) / 1000);
      }
      recent.push(now);
      hits.set(key, recent);
      // Limpieza ocasional para que el mapa no crezca sin fin
      if (hits.size > 5000) {
        for (const [k, list] of hits) if (list.every((t) => now - t >= windowMs)) hits.delete(k);
      }
      return 0;
    },
  };
}

// Dirección del visitante según Vercel (que reemplaza x-forwarded-for por la dirección real).
export function clientKey(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || request.headers.get('x-real-ip')?.trim();
  return ip ? ip.slice(0, 64) : null;
}

export const tooManyRequests = (retryAfterSeconds: number): Response =>
  new Response(JSON.stringify({ error: 'too_many_requests' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfterSeconds) },
  });
