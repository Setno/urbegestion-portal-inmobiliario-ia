// Mantiene activos los proyectos de Supabase del plan gratuito (que se pausan tras 7 días sin actividad).
// Hace una consulta mínima de lectura a cada proyecto (desarrollo = cuenta B, producción = cuenta A).
//
// Uso manual:   node scripts/mantener-activo-supabase.mjs
// Automático:   scripts/instalar-mantener-activo.ps1 lo programa al iniciar sesión en Windows.
//
// Lee las variables del archivo indicado en cada entrada de PROYECTOS (relativo a la raíz, fuera de Git).
// NUNCA imprime URLs ni claves: solo el nombre del entorno y el estado.
// Deja un registro en _archivo/registros/mantener-activo.log (fuera de Git)
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Cada proyecto: nombre, archivo de variables (raíz del proyecto, fuera de Git) y tabla a consultar.
const PROYECTOS = [
  { nombre: 'desarrollo', archivo: '.env.desarrollo', tabla: 'properties' },
  { nombre: 'produccion', archivo: '.env.produccion', tabla: 'properties' },
  { nombre: 'ventas', archivo: '.env.ventas', tabla: 'corredoras' }, // SaaS_Ventas (panel y funnel de ventas)
  // Agente de WhatsApp (otro repositorio, Next.js): usa sus propias variables para no duplicar claves.
  {
    nombre: 'agente-whatsapp',
    archivo: '../agentes-ia/whatsapps/.env.local',
    tabla: 'workspaces',
    varUrl: 'NEXT_PUBLIC_SUPABASE_URL',
    varClave: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  },
];
const INTENTOS = 5; // al iniciar el computador la red puede tardar en estar lista
const ESPERA_MS = 30_000;

const carpetaLog = join(raiz, '_archivo', 'registros'); // _archivo/ está ignorada por git
const archivoLog = join(carpetaLog, 'mantener-activo.log');

function registrar(linea) {
  const texto = `${new Date().toISOString()} ${linea}`;
  console.log(texto);
  try {
    mkdirSync(carpetaLog, { recursive: true });
    appendFileSync(archivoLog, texto + '\n');
  } catch (err) {
    // si no se puede escribir el registro, igual seguimos
    console.error(`(no se pudo escribir el registro: ${err?.code ?? 'error'} en ${archivoLog})`);
  }
}

function leerVariables(nombreArchivo) {
  const archivo = join(raiz, nombreArchivo);
  if (!existsSync(archivo)) return null;
  const vars = {};
  for (const linea of readFileSync(archivo, 'utf-8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#]*?)"?\s*$/);
    if (m) vars[m[1]] = m[2].trim();
  }
  return vars;
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Consulta de solo lectura a la base de datos (cuenta como actividad). Con la política de acceso,
// sin sesión la respuesta es una lista vacía; lo que importa es que la base respondió.
async function tocarProyecto(url, key, tabla) {
  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${tabla}?select=id&limit=1`, {
    headers: { apikey: key },
    signal: AbortSignal.timeout(15_000),
  });
  if (res.ok) return { estado: res.status, detalle: '', activo: true };
  // Los errores de Supabase traen un código (p. ej. 42501 = sin permiso sobre la tabla); no incluyen claves.
  let detalle = '';
  try {
    const cuerpo = await res.json();
    detalle = [cuerpo.code, cuerpo.message].filter(Boolean).join(' ').slice(0, 120);
  } catch {
    // respuesta sin JSON
  }
  // 42501 = la base respondió y negó el acceso anónimo a la tabla: el proyecto está activo (y la tabla protegida).
  return { estado: res.status, detalle, activo: detalle.startsWith('42501') };
}

let fallos = 0;
for (const proyecto of PROYECTOS) {
  const { nombre: entorno, archivo, tabla } = proyecto;
  const { varUrl = 'VITE_SUPABASE_URL', varClave = 'VITE_SUPABASE_PUBLISHABLE_KEY' } = proyecto;
  const vars = leerVariables(archivo);
  const url = vars?.[varUrl];
  const key = vars?.[varClave];
  if (!url || !key) {
    registrar(`✗ ${entorno}: falta ${archivo} o sus variables de Supabase (se omite)`);
    fallos++;
    continue;
  }

  let activo = false;
  let motivo = '';
  for (let intento = 1; intento <= INTENTOS; intento++) {
    try {
      const r = await tocarProyecto(url, key, tabla);
      if (r.activo) {
        activo = true;
        break;
      }
      motivo = `respondió ${r.estado}${r.detalle ? ` (${r.detalle})` : ''}`;
    } catch (err) {
      motivo = err?.name === 'TimeoutError' ? 'tiempo agotado' : 'sin conexión';
    }
    if (intento < INTENTOS) await esperar(ESPERA_MS);
  }

  if (activo) {
    registrar(`✓ ${entorno}: proyecto activo`);
  } else {
    registrar(`✗ ${entorno}: ${motivo}. Si pasa varios días seguidos, revisa si Supabase lo pausó (botón "Restore project" en el panel).`);
    fallos++;
  }
}

// Sin process.exit(): en Windows cerrar de golpe con conexiones abiertas produce un error de Node.
process.exitCode = fallos > 0 ? 1 : 0;
