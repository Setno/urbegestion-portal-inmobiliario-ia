import { buildPrivacyNotice } from '@portal/sitio-datos/privacidad';
import type { SiteEnv } from './getSite';
import { avisarWebhook, CORREO, TELEFONO } from './solicitudVisita';
import { OPERACIONES_TASACION, TIPOS_TASACION, type DatosTasacion, type ErrorTasacion, type ResultadoTasacion } from './tasacion';

export type { DatosTasacion } from './tasacion';

const ESPERA_MS = 8000;
const SUPERFICIE_MAXIMA_M2 = 1_000_000;
const DORMITORIOS_MAXIMOS = 20;

const texto = (value: unknown): string => (typeof value === 'string' ? value : '');
const numero = /^\d+([.,]\d+)?$/;

export function validarTasacion(datos: DatosTasacion): ErrorTasacion | null {
  if (!OPERACIONES_TASACION.some((o) => o.valor === datos.operacion)) return 'operacion';
  if (!TIPOS_TASACION.some((t) => t.valor === datos.tipo)) return 'tipo';
  const comuna = datos.comuna.trim();
  if (comuna.length < 2 || comuna.length > 100) return 'comuna';
  const superficie = datos.superficieM2.trim();
  if (!numero.test(superficie)) return 'superficie';
  const metros = Number(superficie.replace(',', '.'));
  if (!(metros > 0) || metros > SUPERFICIE_MAXIMA_M2) return 'superficie';
  const dormitorios = datos.dormitorios.trim();
  if (dormitorios && (!/^\d{1,2}$/.test(dormitorios) || Number(dormitorios) > DORMITORIOS_MAXIMOS)) return 'dormitorios';
  const nombre = datos.nombre.trim();
  if (nombre.length < 2 || nombre.length > 120) return 'nombre';
  const digitos = datos.telefono.replace(/\D/g, '').length;
  if (digitos < 8 || digitos > 15 || datos.telefono.length > 30 || !TELEFONO.test(datos.telefono)) return 'telefono';
  const correo = datos.correo.trim();
  if (correo && (correo.length > 200 || !CORREO.test(correo))) return 'correo';
  return null;
}

// Crea un lead de propietario en el CRM. La corredora la pone el servidor: del navegador solo se aceptan los datos del inmueble y del contacto.
export async function enviarSolicitudTasacion(
  recibidos: DatosTasacion,
  env: SiteEnv | null,
  ahora: Date = new Date(),
  webhookUrl: string | undefined = process.env.GHL_WEBHOOK_URL,
): Promise<ResultadoTasacion> {
  // Lo que llega del navegador puede traer cualquier cosa, aunque el formulario solo envíe texto.
  const datos = {
    operacion: texto(recibidos?.operacion),
    tipo: texto(recibidos?.tipo),
    comuna: texto(recibidos?.comuna),
    superficieM2: texto(recibidos?.superficieM2),
    dormitorios: texto(recibidos?.dormitorios),
    nombre: texto(recibidos?.nombre),
    telefono: texto(recibidos?.telefono),
    correo: texto(recibidos?.correo),
    sitioWeb: texto(recibidos?.sitioWeb),
  } as DatosTasacion;
  if (datos.sitioWeb) return { ok: true };
  const invalido = validarTasacion(datos);
  if (invalido) return { ok: false, error: invalido };
  if (!env) return { ok: false, error: 'conexion' };

  try {
    const comuna = datos.comuna.trim();
    const superficie = datos.superficieM2.trim().replace(',', '.');
    const dormitorios = datos.dormitorios.trim();
    const tipo = TIPOS_TASACION.find((t) => t.valor === datos.tipo)?.texto ?? datos.tipo;
    const fila = {
      id: crypto.randomUUID(),
      tenant_id: env.tenantId,
      full_name: datos.nombre.trim(),
      email: datos.correo.trim(),
      phone: datos.telefono.trim(),
      property_title: `${tipo} en ${comuna} (${superficie} m²)`,
      operation_interest: 'venta_propietario',
      status: 'nuevo',
      property_specs: { operation: datos.operacion, propertyType: datos.tipo, commune: comuna, areaM2: superficie, bedrooms: dormitorios },
      notes: [
        `Propietario desea ${datos.operacion.toUpperCase()} su propiedad (${tipo}).`,
        `Ubicación: ${comuna}. Superficie: ${superficie} m².${dormitorios ? ` Dormitorios: ${dormitorios}.` : ''}`,
        'Solicitó tasación desde el sitio de la corredora.',
      ],
      source: 'captacion_propietarios',
      privacy_notice: buildPrivacyNotice(ahora),
    };
    const response = await fetch(`${env.url}/rest/v1/leads`, {
      method: 'POST',
      headers: { apikey: env.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      signal: AbortSignal.timeout(ESPERA_MS),
      body: JSON.stringify(fila),
    });
    if (!response.ok) {
      console.warn(`[sitio] La base rechazó una solicitud de tasación (${response.status})`);
      return { ok: false, error: 'conexion' };
    }
    if (webhookUrl) await avisarWebhook(webhookUrl, env, fila, ahora, 'Propietario');
    return { ok: true };
  } catch {
    console.warn('[sitio] No se pudo guardar una solicitud de tasación');
    return { ok: false, error: 'conexion' };
  }
}
