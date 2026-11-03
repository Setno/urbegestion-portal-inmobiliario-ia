import path from 'node:path';
import type { NextConfig } from 'next';

const repoRoot = path.resolve(process.cwd(), '../..');

// .env.local vive en la raíz del repositorio, igual que para la consola. En Vercel no existe: las variables vienen del proyecto.
try {
  process.loadEnvFile(path.join(repoRoot, '.env.local'));
} catch {
  // Sin archivo, el sitio usa las variables que ya tenga el entorno.
}

const config: NextConfig = {
  // Los paquetes compartidos se publican como TypeScript sin compilar.
  transpilePackages: ['@portal/sitio-datos', '@portal/mercados', '@portal/dinero'],
  turbopack: { root: repoRoot },
  outputFileTracingRoot: repoRoot,
};

export default config;
