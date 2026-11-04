import { resolverVisita } from '../../../lib/direccion';
import { robots } from '../../../lib/seo';

interface Contexto {
  params: Promise<{ sitio: string }>;
}

export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

export async function GET(_request: Request, { params }: Contexto): Promise<Response> {
  const host = decodeURIComponent((await params).sitio);
  const env = await resolverVisita(host);
  return new Response(robots(env ? { host, canonico: env.canonico } : null), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
