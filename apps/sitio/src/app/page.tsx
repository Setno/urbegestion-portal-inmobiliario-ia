import type { Metadata } from 'next';
import { getSite } from '../lib/getSite';
import { resolvePlantilla } from '../plantillas';

// La página se regenera cada minuto: un cambio de la corredora aparece sin volver a publicar el sitio.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  if (!site) return { title: 'Sitio no disponible', robots: { index: false } };
  return { title: site.brand.brandName, description: site.brand.tagline || undefined };
}

export default async function Page() {
  const site = await getSite();
  if (!site) {
    return (
      <main className="sitio-no-disponible">
        <h1>Sitio no disponible</h1>
        <p>Vuelve a intentarlo en unos minutos.</p>
      </main>
    );
  }
  const Plantilla = resolvePlantilla(site.templateId);
  return <Plantilla site={site} />;
}
