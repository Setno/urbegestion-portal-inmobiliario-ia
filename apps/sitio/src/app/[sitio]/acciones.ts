'use server';

import { headers } from 'next/headers';
import { resolverVisita } from '../../lib/direccion';
import { enviarSolicitudTasacion } from '../../lib/solicitudTasacion';
import type { DatosTasacion, ResultadoTasacion } from '../../lib/tasacion';

import { enviarSolicitudChat } from '../../lib/solicitudChat';
import type { DatosChat, ResultadoChat } from '../../lib/chat';

// Contacto que deja una persona al conversar con el asistente.
export async function solicitarContactoChat(datos: DatosChat): Promise<ResultadoChat> {
  try {
    const env = await resolverVisita((await headers()).get('host') ?? '');
    return await enviarSolicitudChat(datos, env);
  } catch {
    console.warn('[sitio] No se pudo resolver la corredora de un contacto del asistente');
    return { ok: false, error: 'conexion' };
  }
}

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
