// Cambia el entorno activo (desarrollo o producción) copiando el archivo de variables que corresponde a `.env.local`.
// Uso:  npm run entorno -- desarrollo     o     npm run entorno -- produccion
//
// Necesita dos archivos en la raíz del proyecto, que tú creas una sola vez (están fuera de Git por `.env.*`):
//   .env.desarrollo   → las variables del proyecto de Supabase de la cuenta de desarrollo
//   .env.produccion   → las variables del proyecto de Supabase de la cuenta de producción
// Este programa NUNCA muestra el contenido de los archivos: solo dice cuál quedó activo y el identificador del proyecto
// (la parte de la dirección antes de ".supabase.co", que no es secreta).
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const entorno = process.argv[2];
const NOMBRES = ['desarrollo', 'produccion'];

if (!NOMBRES.includes(entorno)) {
  console.error('Uso: npm run entorno -- desarrollo   (o: produccion)');
  process.exit(1);
}

const origen = resolve(process.cwd(), `.env.${entorno}`);
const destino = resolve(process.cwd(), '.env.local');

if (!existsSync(origen)) {
  console.error(`✗ Falta el archivo .env.${entorno} en la raíz del proyecto. Créalo una vez con las variables de ese entorno (ver docs/entornos.md).`);
  process.exit(1);
}

copyFileSync(origen, destino);

// Solo el identificador del proyecto, para confirmar que quedó el correcto.
const url = readFileSync(destino, 'utf-8').match(/^VITE_SUPABASE_URL=\s*"?https:\/\/([a-z0-9]+)\.supabase\.co/m);
console.log(`✓ Entorno activo: ${entorno}${url ? ` (proyecto ${url[1]})` : ' (no encontré VITE_SUPABASE_URL en ese archivo)'}`);
if (entorno === 'produccion') {
  console.log('⚠ Estás apuntando a PRODUCCIÓN: lo que crees o borres desde tu computador afecta datos reales. Vuelve a desarrollo cuando termines.');
}
