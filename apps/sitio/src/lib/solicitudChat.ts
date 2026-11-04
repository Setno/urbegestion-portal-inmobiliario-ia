import { buildPrivacyNotice } from '@portal/sitio-datos/privacidad';
import { conAtribucion, type Atribucion } from '@portal/sitio-datos/atribucion';
import type { SiteEnv } from './getSite';
import type { DatosChat, ErrorChat, ResultadoChat } from './chat';
import { avisarWebhook, validarSolicitud } from './solicitudVisita';

export type { DatosChat } from './chat';

const ESPERA_MS = 8000;
const MAXIMO_CONSULTA = 300;

const texto = (value: unknown): string => (typeof value === 'string' ? value : '');

// Mismas reglas que el formulario de visita: nombre, teléfono, fecha y horario. El correo no se pide en el chat.
export function validarContactoChat(datos: DatosChat, ahora: Date = new Date()): ErrorChat | null {
  const error = validarSolicitud({ nombre: datos.nombre, telefono: datos.telefono, correo: '', fecha: datos.fecha, hora: datos.hora, sitioWeb: '' }, ahora);
  return error === 'nombre' || error === 'telefono' || error === 'fecha' || error === 'hora' ? error : null;
}

// Crea el lead en el CRM. La corredora la pone el servidor: del navegador solo se aceptan los datos de contacto y la consulta.
export async function enviarSolicitudChat(
  recibidos: DatosChat,
  env: SiteEnv | null,
  ahora: Date = new Date(),
  webhookUrl: string | undefined = process.env.GHL_WEBHOOK_URL,
  atribucion: Atribucion | null = null,
): Promise<ResultadoChat> {
  // Lo que llega del navegador puede traer cualquier cosa, aunque el chat solo envíe texto.
  const datos: DatosChat = {
    nombre: texto(recibidos?.nombre),
    telefono: texto(recibidos?.telefono),
    fecha: texto(recibidos?.fecha),
    hora: texto(recibidos?.hora),
    consulta: texto(recibidos?.consulta),
    sitioWeb: texto(recibidos?.sitioWeb),
  };
  if (datos.sitioWeb) return { ok: true };
  const invalido = validarContactoChat(datos, ahora);
  if (invalido) return { ok: false, error: invalido };
  if (!env) return { ok: false, error: 'conexion' };

  try {
    const conCita = Boolean(datos.fecha);
    const consulta = datos.consulta.trim().slice(0, MAXIMO_CONSULTA);
    const fila = {
      id: crypto.randomUUID(),
      tenant_id: env.tenantId,
      full_name: datos.nombre.trim(),
      email: '',
      phone: datos.telefono.trim(),
      property_title: 'Consulta general desde el asistente',
      operation_interest: 'compra',
      status: conCita ? 'visita_agendada' : 'nuevo',
      appointment_date: conCita ? datos.fecha : null,
      appointment_time: conCita && datos.hora ? datos.hora : null,
      notes: [
        conCita
          ? `Lead del asistente del sitio. Visita solicitada para el ${datos.fecha}${datos.hora ? ` a las ${datos.hora} hrs` : ''}.`
          : 'Lead del asistente del sitio. Sin fecha de visita: por coordinar.',
        ...(consulta ? [`Última consulta: ${consulta}`] : []),
      ],
      source: 'asistente_ia',
      privacy_notice: buildPrivacyNotice(ahora),
      ...conAtribucion(atribucion),
    };
    const response = await fetch(`${env.url}/rest/v1/rpc/create_site_lead`, {
      method: 'POST',
      headers: { apikey: env.key, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(ESPERA_MS),
      // El lead se crea con una función de la base que valida la corredora, los campos y los topes de envío (H-052).
      body: JSON.stringify({ p_tenant: env.tenantId, p_lead: fila }),
    });
    if (!response.ok) {
      console.warn(`[sitio] La base rechazó un contacto del asistente (${response.status})`);
      return { ok: false, error: 'conexion' };
    }
    if (webhookUrl) await avisarWebhook(webhookUrl, env, fila, ahora);
    return { ok: true };
  } catch {
    console.warn('[sitio] No se pudo guardar un contacto del asistente');
    return { ok: false, error: 'conexion' };
  }
}
