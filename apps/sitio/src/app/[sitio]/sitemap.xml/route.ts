import { getCatalogo } from '../../../lib/getCatalogo';
import { resolverVisita } from '../../../lib/direccion';
import { mapaDelSitio } from '../../../lib/seo';

interface Contexto {
  params: Promise<{ sitio: string }>;
}

// Se regenera como las páginas: una ficha nueva aparece en el mapa en un par de minutos.
export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

export async function GET(_request: Request, { params }: Contexto): Promise<Response> {
  const host = decodeURIComponent((await params).sitio);
  const env = await resolverVisita(host);
  if (!env) return new Response('Este sitio no está disponible.', { status: 404 });
  const { propiedades } = await getCatalogo(env);
  return new Response(mapaDelSitio(env.canonico, propiedades), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
