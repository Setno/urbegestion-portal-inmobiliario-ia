import { buildPrivacyNotice } from '@portal/sitio-datos/privacidad';
import { conAtribucion, type Atribucion } from '@portal/sitio-datos/atribucion';
import { getSite, type SiteEnv } from './getSite';
import { crearLeadEnBase } from './crearLead';
import { getPropiedad } from './getPropiedad';
import { HORARIOS, type DatosVisita, type ErrorVisita, type ResultadoVisita } from './visita';

export type { DatosVisita } from './visita';

// Sin separadores ni signos de fórmula: estos datos los escribe cualquier visitante y terminan en planillas del CRM.
export const CORREO = /^[^\s@?&;"'=|<>,]+@[^\s@?&;"'=|<>,]+\.[^\s@?&;"'=|<>,]+$/;
export const TELEFONO = /^[+\d\s()-]+$/;
const UN_DIA_MS = 24 * 60 * 60 * 1000;
const ESPERA_MS = 8000;

const diaISO = (fecha: Date): string => fecha.toISOString().slice(0, 10);

// El servidor puede estar en otra zona horaria que el visitante: se acepta desde ayer para no rechazar un "hoy" válido.
function fechaValida(fecha: string, ahora: Date): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const dia = new Date(`${fecha}T00:00:00Z`);
  if (Number.isNaN(dia.getTime()) || diaISO(dia) !== fecha) return false;
  return fecha >= diaISO(new Date(ahora.getTime() - UN_DIA_MS)) && fecha <= diaISO(new Date(ahora.getTime() + 366 * UN_DIA_MS));
}

export function validarSolicitud(datos: DatosVisita, ahora: Date = new Date()): ErrorVisita | null {
  const nombre = datos.nombre.trim();
  if (nombre.length < 2 || nombre.length > 120) return 'nombre';
  const digitos = datos.telefono.replace(/\D/g, '').length;
  if (digitos < 8 || digitos > 15 || datos.telefono.length > 30 || !TELEFONO.test(datos.telefono)) return 'telefono';
  const correo = datos.correo.trim();
  if (correo && (correo.length > 200 || !CORREO.test(correo))) return 'correo';
  if (datos.fecha && !fechaValida(datos.fecha, ahora)) return 'fecha';
  if (datos.hora && !HORARIOS.some((h) => h.valor === datos.hora)) return 'hora';
  return null;
}

const texto = (value: unknown): string => (typeof value === 'string' ? value : '');

export async function nombreDeLaCorredora(env: SiteEnv): Promise<string> {
  try {
    return (await getSite(env))?.brand.brandName ?? '';
  } catch {
    return '';
  }
}

// Mismo formato que la consola (dispatchLeadToGHL). El lead ya quedó guardado: si esto falla, la persona igual ve éxito.
export async function avisarWebhook(
  webhookUrl: string,
  env: SiteEnv,
  fila: Record<string, unknown>,
  ahora: Date,
  tipoDeContacto = 'Comprador/Arrendatario',
): Promise<void> {
  try {
    const nombre = String(fila.full_name);
    const [primero, ...resto] = nombre.split(/\s+/);
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(ESPERA_MS),
      body: JSON.stringify({
        event: 'lead_created',
        timestamp: ahora.toISOString(),
        source_system: 'Portal Inmobiliario IA',
        contact: {
          firstName: primero,
          lastName: resto.join(' '),
          name: nombre,
          email: fila.email,
          phone: fila.phone,
          source: `Web Portal - ${fila.source}`,
          tags: ['Inmobiliaria', await nombreDeLaCorredora(env), tipoDeContacto, fila.source].filter(Boolean),
          customFields: {
            lead_id: fila.id,
            property_interest: fila.property_title,
            property_id: fila.property_id,
            operation_type: fila.operation_interest,
            budget_amount: fila.budget_amount,
            budget_currency: fila.budget_currency,
            mortgage_status: 'no_especificado',
            target_move_date: 'no_especificado',
            status: fila.status,
            appointment_date: fila.appointment_date ?? '',
            appointment_time: fila.appointment_time ?? '',
            notes: (fila.notes as string[]).join(' | '),
            attachments_count: 0,
            attachments_urls: [],
            property_specs: null,
          },
        },
      }),
    });
    if (!response.ok) console.warn(`[sitio] El webhook de leads respondió ${response.status}`);
  } catch {
    console.warn('[sitio] No se pudo avisar al webhook de leads');
  }
}

// Crea el lead en el CRM. La corredora y los datos de la propiedad los pone el servidor: del navegador solo se aceptan los de contacto.
export async function enviarSolicitudVisita(
  propiedadId: string,
  recibidos: DatosVisita,
  env: SiteEnv | null,
  ahora: Date = new Date(),
  webhookUrl: string | undefined = process.env.GHL_WEBHOOK_URL,
  atribucion: Atribucion | null = null,
): Promise<ResultadoVisita> {
  // Lo que llega del navegador puede traer cualquier cosa, aunque el formulario solo envíe texto.
  const datos: DatosVisita = {
    nombre: texto(recibidos?.nombre),
    telefono: texto(recibidos?.telefono),
    correo: texto(recibidos?.correo),
    fecha: texto(recibidos?.fecha),
    hora: texto(recibidos?.hora),
    sitioWeb: texto(recibidos?.sitioWeb),
  };
  if (datos.sitioWeb) return { ok: true };
  const invalido = validarSolicitud(datos, ahora);
  if (invalido) return { ok: false, error: invalido };
  if (!env) return { ok: false, error: 'conexion' };

  try {
    const ficha = await getPropiedad(texto(propiedadId), env, true);
    if (!ficha) return { ok: false, error: 'propiedad' };
    const { propiedad } = ficha;
    const conCita = Boolean(datos.fecha);
    const preferencia = datos.hora ? `; horario preferido: ${datos.hora} hrs.` : '.';
    const fila = {
      id: crypto.randomUUID(),
      tenant_id: env.tenantId,
      full_name: datos.nombre.trim(),
      email: datos.correo.trim(),
      phone: datos.telefono.trim(),
      property_id: propiedad.id,
      property_title: propiedad.title,
      operation_interest: propiedad.operation === 'venta' ? 'compra' : 'arriendo',
      budget_amount: propiedad.priceAmount,
      budget_currency: propiedad.priceCurrency,
      status: conCita ? 'visita_agendada' : 'nuevo',
      appointment_date: conCita ? datos.fecha : null,
      appointment_time: conCita && datos.hora ? datos.hora : null,
      notes: [conCita ? `Visita solicitada desde el sitio para el ${datos.fecha}${preferencia}` : `Consulta desde el sitio${preferencia}`],
      source: 'ficha_propiedad',
      privacy_notice: buildPrivacyNotice(ahora),
      ...conAtribucion(atribucion),
    };
    // El lead se crea con una función de la base que valida la corredora, los campos y los topes de envío (H-052, H-063).
    if (!(await crearLeadEnBase(env, fila))) return { ok: false, error: 'conexion' };
    if (webhookUrl) await avisarWebhook(webhookUrl, env, fila, ahora);
    return { ok: true };
  } catch {
    console.warn('[sitio] No se pudo guardar una solicitud de visita');
    return { ok: false, error: 'conexion' };
  }
}
