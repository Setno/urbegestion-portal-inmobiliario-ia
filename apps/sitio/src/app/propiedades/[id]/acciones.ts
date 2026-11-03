'use server';

import { enviarSolicitudVisita } from '../../../lib/solicitudVisita';
import type { DatosVisita, ResultadoVisita } from '../../../lib/visita';

export async function solicitarVisita(propiedadId: string, datos: DatosVisita): Promise<ResultadoVisita> {
  return enviarSolicitudVisita(propiedadId, datos);
}
