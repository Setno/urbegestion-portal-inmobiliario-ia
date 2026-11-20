// Mantiene activos los proyectos de Supabase del plan gratuito (que se pausan tras 7 días sin actividad).
// Hace una consulta mínima de lectura a cada proyecto (desarrollo = cuenta B, producción = cuenta A).
//
// Uso manual:   node scripts/mantener-activo-supabase.mjs
// Automático:   scripts/instalar-mantener-activo.ps1 lo programa al iniciar sesión en Windows.
//
// Lee las variables de `.env.desarrollo` y `.env.produccion` (en la raíz del proyecto, fuera de Git).
// NUNCA imprime URLs ni claves: solo el nombre del entorno y el estado.
// Deja un registro en _archivo/registros/mantener-activo.log (fuera de Git)
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENTORNOS = ['desarrollo', 'produccion'];
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

function leerVariables(entorno) {
  const archivo = join(raiz, `.env.${entorno}`);
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
async function tocarProyecto(url, key) {
  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/properties?select=id&limit=1`, {
    headers: { apikey: key },
    signal: AbortSignal.timeout(15_000),
  });
  return res.status;
}

let fallos = 0;
for (const entorno of ENTORNOS) {
  const vars = leerVariables(entorno);
  const url = vars?.VITE_SUPABASE_URL;
  const key = vars?.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    registrar(`✗ ${entorno}: falta .env.${entorno} o sus variables de Supabase (se omite)`);
    fallos++;
    continue;
  }

  let estado = null;
  let motivo = '';
  for (let intento = 1; intento <= INTENTOS; intento++) {
    try {
      estado = await tocarProyecto(url, key);
      if (estado >= 200 && estado < 300) break;
      motivo = `respondió ${estado}`;
    } catch (err) {
      motivo = err?.name === 'TimeoutError' ? 'tiempo agotado' : 'sin conexión';
      estado = null;
    }
    if (intento < INTENTOS) await esperar(ESPERA_MS);
  }

  if (estado !== null && estado >= 200 && estado < 300) {
    registrar(`✓ ${entorno}: proyecto activo`);
  } else {
    registrar(`✗ ${entorno}: ${motivo}. Si pasa varios días seguidos, revisa si Supabase lo pausó (botón "Restore project" en el panel).`);
    fallos++;
  }
}

// Sin process.exit(): en Windows cerrar de golpe con conexiones abiertas produce un error de Node.
process.exitCode = fallos > 0 ? 1 : 0;
