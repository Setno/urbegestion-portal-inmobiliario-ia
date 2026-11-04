import type { Metadata } from 'next';
import { getCatalogo } from '../../lib/getCatalogo';
import { getFunciones } from '../../lib/getFunciones';
import { getSite } from '../../lib/getSite';
import { resolverVisita } from '../../lib/direccion';
import { datosDeLaCorredora, metadatosPortada } from '../../lib/seo';
import { resolvePlantilla } from '../../plantillas';
import { SitioNoDisponible } from '../SitioNoDisponible';
import { solicitarContactoChat, solicitarTasacion } from './acciones';

// `sitio` es la dirección con que llegó la visita: la pone proxy.ts, nunca el visitante (H-030).
interface Props {
  params: Promise<{ sitio: string }>;
}

// La página se regenera sola: un cambio de la corredora aparece en un par de minutos, sin volver a publicar el sitio.
// Cada dirección tiene su propia copia, generada la primera vez que alguien la pide.
export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

async function cargar(params: Props['params']) {
  const { sitio } = await params;
  const host = decodeURIComponent(sitio);
  const env = await resolverVisita(host);
  const site = await getSite(env);
  return { direccion: { host, canonico: env?.canonico ?? host }, env, site };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { direccion, site } = await cargar(params);
  return metadatosPortada(site, direccion);
}

export default async function Page({ params }: Props) {
  const { direccion, env, site } = await cargar(params);
  if (!site) return <SitioNoDisponible />;
  const [catalogo, funciones] = await Promise.all([getCatalogo(env), getFunciones(env)]);
  const Plantilla = resolvePlantilla(site.templateId);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: datosDeLaCorredora(site, direccion.canonico) }} />
      <Plantilla site={site} catalogo={catalogo} enviarTasacion={funciones.valorizador ? solicitarTasacion : undefined}
        enviarContacto={funciones.chat ? solicitarContactoChat : undefined}
      />
    </>
  );
}
