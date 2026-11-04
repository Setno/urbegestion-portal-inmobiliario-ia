import { NextResponse, type NextRequest } from 'next/server';
import { limpiarHost } from './lib/host';
import { esUuid } from './lib/uuid';

const NO_DISPONIBLE = () => new NextResponse('Esta página no está disponible.', { status: 404 });

// Cada visita se atiende en la carpeta de su dirección (app/[sitio]): así cada corredora tiene su propia copia
// guardada de cada página y nadie puede pedir la de otra escribiendo la ruta a mano (H-030).
export function proxy(request: NextRequest) {
  const host = limpiarHost(request.headers.get('host') ?? '');
  if (!host) return NO_DISPONIBLE();
  const { pathname } = request.nextUrl;
  // Una dirección de ficha inventada se responde aquí: no genera una página que quede guardada ni consulta la base.
  const ficha = /^\/propiedades\/([^/]*)\/?$/.exec(pathname);
  if (ficha && !esUuid(ficha[1])) return NO_DISPONIBLE();
  const destino = request.nextUrl.clone();
  destino.pathname = pathname === '/' ? `/${host}` : `/${host}${pathname}`;
  return NextResponse.rewrite(destino);
}

// Todo menos los archivos internos de Next (scripts, estilos e imágenes del propio sitio).
export const config = { matcher: '/((?!_next/).*)' };
