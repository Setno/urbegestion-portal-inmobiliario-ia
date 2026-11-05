// Límite de envíos de formularios por dirección IP (H-063). Evita que una sola dirección llene el CRM de leads falsos.
// Es de "mejor esfuerzo": el conteo vive en la memoria de cada instancia del servidor, así que frena el abuso desde
// una misma dirección pero no es un tope global exacto. El tope firme se pone en el firewall de Vercel
// (docs/guia-produccion.md). Los topes por corredora y por contacto los pone la base.

export interface Limite {
  // Segundos que faltan para poder reintentar, o 0 si el envío puede seguir.
  revisar: (clave: string | null, ahora?: number) => number;
}

export function crearLimite({ max, ventanaMs }: { max: number; ventanaMs: number }): Limite {
  const golpes = new Map<string, number[]>();
  return {
    revisar: (clave, ahora = Date.now()) => {
      // Sin dirección identificable no se limita: Vercel siempre la entrega, así que solo ocurre fuera de Vercel.
      if (!clave) return 0;
      const recientes = (golpes.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
      if (recientes.length >= max) {
        golpes.set(clave, recientes);
        return Math.ceil((ventanaMs - (ahora - recientes[0])) / 1000);
      }
      recientes.push(ahora);
      golpes.set(clave, recientes);
      if (golpes.size > 5000) {
        for (const [k, lista] of golpes) if (lista.every((t) => ahora - t >= ventanaMs)) golpes.delete(k);
      }
      return 0;
    },
  };
}

// Dirección del visitante según Vercel (que reemplaza x-forwarded-for por la dirección real).
export function direccionDelVisitante(cabeceras: Headers): string | null {
  const reenviada = cabeceras.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = reenviada || cabeceras.get('x-real-ip')?.trim();
  return ip ? ip.slice(0, 64) : null;
}

// Un solo límite para los tres formularios (visita, tasación y chat): 6 envíos cada 10 minutos por dirección.
const limiteDeEnvios = crearLimite({ max: 6, ventanaMs: 600_000 });

// true si esta dirección todavía puede enviar un formulario.
export function permitirEnvio(cabeceras: Headers): boolean {
  return limiteDeEnvios.revisar(direccionDelVisitante(cabeceras)) === 0;
}
