'use server';

import { cookies, headers } from 'next/headers';
import { COOKIE_ATRIBUCION, deCookie } from '@portal/sitio-datos/atribucion';
import { resolverVisita } from '../../../../lib/direccion';
import { enviarSolicitudVisita } from '../../../../lib/solicitudVisita';
import type { DatosVisita, ResultadoVisita } from '../../../../lib/visita';

// La corredora sale de la dirección a la que llegó la solicitud, igual que la página: nunca de lo que envía el navegador.
export async function solicitarVisita(propiedadId: string, datos: DatosVisita): Promise<ResultadoVisita> {
  try {
    const env = await resolverVisita((await headers()).get('host') ?? '');
    const atribucion = deCookie((await cookies()).get(COOKIE_ATRIBUCION)?.value);
    return await enviarSolicitudVisita(propiedadId, datos, env, new Date(), process.env.GHL_WEBHOOK_URL, atribucion);
  } catch {
    console.warn('[sitio] No se pudo resolver la corredora de una solicitud de visita');
    return { ok: false, error: 'conexion' };
  }
}
