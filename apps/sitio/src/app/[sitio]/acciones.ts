'use server';

import { headers } from 'next/headers';
import { resolverVisita } from '../../lib/direccion';
import { enviarSolicitudTasacion } from '../../lib/solicitudTasacion';
import type { DatosTasacion, ResultadoTasacion } from '../../lib/tasacion';

// La corredora sale de la dirección a la que llegó la solicitud, igual que la página: nunca de lo que envía el navegador.
export async function solicitarTasacion(datos: DatosTasacion): Promise<ResultadoTasacion> {
  try {
    const env = await resolverVisita((await headers()).get('host') ?? '');
    return await enviarSolicitudTasacion(datos, env);
  } catch {
    console.warn('[sitio] No se pudo resolver la corredora de una solicitud de tasación');
    return { ok: false, error: 'conexion' };
  }
}
