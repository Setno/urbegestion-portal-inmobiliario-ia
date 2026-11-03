import { NextResponse, type NextRequest } from 'next/server';
import { esUuid } from './lib/uuid';

// Una dirección de ficha inventada se responde aquí: no genera una página que quede guardada ni consulta la base.
export function proxy(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/')[2] ?? '';
  return esUuid(id) ? NextResponse.next() : new NextResponse('Esta página no está disponible.', { status: 404 });
}

export const config = { matcher: '/propiedades/:id' };
