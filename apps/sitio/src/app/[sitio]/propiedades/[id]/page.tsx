import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPropiedad } from '../../../../lib/getPropiedad';
import { getSite } from '../../../../lib/getSite';
import { resolverVisita } from '../../../../lib/direccion';
import { datosDeLaFicha, metadatosFicha } from '../../../../lib/seo';
import { resolveFicha } from '../../../../plantillas';
import { SitioNoDisponible } from '../../../SitioNoDisponible';
import { solicitarVisita } from './acciones';

interface Props {
  params: Promise<{ sitio: string; id: string }>;
}

// Igual que la portada: se genera la primera vez que alguien la pide y se regenera sola, conservando la copia buena si falla la base.
export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

async function cargar(params: Props['params']) {
  const { sitio, id } = await params;
  const host = decodeURIComponent(sitio);
  const env = await resolverVisita(host);
  const [site, ficha] = await Promise.all([getSite(env), getPropiedad(id, env)]);
  return { direccion: { host, canonico: env?.canonico ?? host }, site, ficha };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { direccion, site, ficha } = await cargar(params);
  return metadatosFicha(site, ficha?.propiedad ?? null, direccion);
}

export default async function Page({ params }: Props) {
  const { direccion, site, ficha } = await cargar(params);
  if (!site) return <SitioNoDisponible />;
  if (!ficha) notFound();
  const Ficha = resolveFicha(site.templateId);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: datosDeLaFicha(site, ficha, direccion.canonico) }} />
      <Ficha site={site} propiedad={ficha.propiedad} marketId={ficha.marketId} enviarVisita={solicitarVisita} />
    </>
  );
}
