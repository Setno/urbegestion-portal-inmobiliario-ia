// Verifica la conexión con Supabase sin mostrar nunca las claves.
// Uso:  node --env-file=.env.local scripts/verificar-supabase.mjs
// Solo imprime estados (OK / error); no imprime la URL ni las claves.

const url = process.env.VITE_SUPABASE_URL?.trim();
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
const problemas = [];

if (!url) problemas.push('Falta VITE_SUPABASE_URL en .env.local');
else if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url))
  problemas.push('VITE_SUPABASE_URL no tiene la forma https://xxxxxxxx.supabase.co');

if (!key) problemas.push('Falta VITE_SUPABASE_PUBLISHABLE_KEY en .env.local');
else if (key.startsWith('sb_secret_'))
  problemas.push('ATENCIÓN: pegaste la Secret key. Bórrala de .env.local y usa la Publishable key (sb_publishable_...)');
else if (!key.startsWith('sb_publishable_'))
  problemas.push('VITE_SUPABASE_PUBLISHABLE_KEY debería empezar con sb_publishable_');

if (problemas.length > 0) {
  for (const p of problemas) console.error('✗', p);
  process.exit(1);
}

try {
  const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/settings`, {
    headers: { apikey: key },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    console.error(`✗ Supabase respondió con error ${res.status}. Revisa que la URL y la clave sean del mismo proyecto.`);
    process.exit(1);
  }
  const ajustes = await res.json();
  console.log('✓ Conexión con Supabase correcta (la URL y la clave publicable son válidas).');
  console.log(`  Correo y clave habilitados: ${ajustes.external?.email ? 'sí' : 'NO'}`);
  console.log(`  Registro público de usuarios: ${ajustes.disable_signup ? 'desactivado (correcto: solo por invitación)' : 'ACTIVADO (conviene desactivarlo)'}`);
  console.log(`  Confirmación de correo: ${ajustes.mailer_autoconfirm ? 'NO se exige (conviene activarla)' : 'se exige (correcto)'}`);
} catch (err) {
  console.error('✗ No se pudo conectar con Supabase:', err?.name === 'TimeoutError' ? 'tiempo agotado' : 'error de red');
  process.exit(1);
}
