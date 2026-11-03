import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPropiedad } from '../../../lib/getPropiedad';
import { getSite } from '../../../lib/getSite';
import { resolveFicha } from '../../../plantillas';
import { SitioNoDisponible } from '../../SitioNoDisponible';
import { solicitarVisita } from './acciones';

interface Props {
  params: Promise<{ id: string }>;
}

// Igual que la portada: se genera la primera vez que alguien la pide y se regenera sola, conservando la copia buena si falla la base.
export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [site, ficha] = await Promise.all([getSite(), getPropiedad(id)]);
  if (!site || !ficha) return { title: 'Propiedad no disponible', robots: { index: false } };
  const { propiedad } = ficha;
  return {
    title: `${propiedad.title} | ${site.brand.brandName}`,
    description: propiedad.description.slice(0, 160) || undefined,
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const [site, ficha] = await Promise.all([getSite(), getPropiedad(id)]);
  if (!site) return <SitioNoDisponible />;
  if (!ficha) notFound();
  const Ficha = resolveFicha(site.templateId);
  return <Ficha site={site} propiedad={ficha.propiedad} marketId={ficha.marketId} enviarVisita={solicitarVisita} />;
}
