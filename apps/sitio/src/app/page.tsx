import type { Metadata } from 'next';
import { getCatalogo } from '../lib/getCatalogo';
import { getSite } from '../lib/getSite';
import { resolvePlantilla } from '../plantillas';
import { SitioNoDisponible } from './SitioNoDisponible';

// La página se regenera sola: un cambio de la corredora aparece en un par de minutos, sin volver a publicar el sitio.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  if (!site) return { title: 'Sitio no disponible', robots: { index: false } };
  return { title: site.brand.brandName, description: site.brand.tagline || undefined };
}

export default async function Page() {
  const site = await getSite();
  if (!site) return <SitioNoDisponible />;
  const catalogo = await getCatalogo();
  const Plantilla = resolvePlantilla(site.templateId);
  return <Plantilla site={site} catalogo={catalogo} />;
}
