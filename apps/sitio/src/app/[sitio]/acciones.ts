'use server';

import { headers } from 'next/headers';
import { resolverVisita } from '../../lib/direccion';
import { getFunciones, type FuncionesDelSitio } from '../../lib/getFunciones';
import type { SiteEnv } from '../../lib/getSite';
import { enviarSolicitudChat } from '../../lib/solicitudChat';
import { enviarSolicitudTasacion } from '../../lib/solicitudTasacion';
import type { DatosChat, ResultadoChat } from '../../lib/chat';
import type { DatosTasacion, ResultadoTasacion } from '../../lib/tasacion';

// La corredora sale de la dirección a la que llegó la solicitud, igual que la página: nunca de lo que envía el navegador.
// Además se revisa el plan aquí: una acción de servidor se puede llamar directo, aunque la página no muestre la herramienta.
// Sin la herramienta en el plan se devuelve null y nada se guarda.
async function entornoConHerramienta(herramienta: keyof FuncionesDelSitio): Promise<SiteEnv | null> {
  const env = await resolverVisita((await headers()).get('host') ?? '');
  if (!env) return null;
  const funciones = await getFunciones(env);
  return funciones[herramienta] ? env : null;
}

// Contacto que deja una persona al conversar con el asistente.
export async function solicitarContactoChat(datos: DatosChat): Promise<ResultadoChat> {
  try {
    return await enviarSolicitudChat(datos, await entornoConHerramienta('chat'));
  } catch {
    console.warn('[sitio] No se pudo guardar un contacto del asistente');
    return { ok: false, error: 'conexion' };
  }
}

// Solicitud de tasación de un propietario.
export async function solicitarTasacion(datos: DatosTasacion): Promise<ResultadoTasacion> {
  try {
    return await enviarSolicitudTasacion(datos, await entornoConHerramienta('valorizador'));
  } catch {
    console.warn('[sitio] No se pudo guardar una solicitud de tasación');
    return { ok: false, error: 'conexion' };
  }
}
