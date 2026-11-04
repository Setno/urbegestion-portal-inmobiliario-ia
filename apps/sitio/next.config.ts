import path from 'node:path';
import type { NextConfig } from 'next';

const repoRoot = path.resolve(process.cwd(), '../..');

// .env.local vive en la raíz del repositorio, igual que para la consola. En Vercel no existe: las variables vienen del proyecto.
try {
  process.loadEnvFile(path.join(repoRoot, '.env.local'));
} catch {
  // Sin archivo, el sitio usa las variables que ya tenga el entorno.
}

// Cabeceras de seguridad (H-004). Next necesita scripts en línea para cargar la página, por eso script-src los admite;
// el resto de la política es igual de estricta que la de la consola.
const seguridad = [
  // Sin includeSubDomains: el sitio se sirve también en dominios propios de las corredoras, y forzar HTTPS en todos sus
  // subdominios (correo web, intranet) durante dos años no es decisión nuestra.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "connect-src 'self' https://*.supabase.co",
      'frame-src https:',
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  },
];

const config: NextConfig = {
  headers: async () => [{ source: '/:path*', headers: seguridad }],
  // Los paquetes compartidos se publican como TypeScript sin compilar.
  transpilePackages: ['@portal/sitio-datos', '@portal/mercados', '@portal/dinero'],
  // La revisión de tipos del build no incluye los archivos de prueba: en Vercel vitest no está instalado.
  typescript: { tsconfigPath: 'tsconfig.build.json' },
  turbopack: { root: repoRoot },
  outputFileTracingRoot: repoRoot,
};

export default config;
