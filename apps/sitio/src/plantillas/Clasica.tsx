import { hasAbout, hasTestimonials, type SiteData } from '@portal/sitio-datos';
import type { PublicCatalog } from '@portal/sitio-datos/propiedades';
import type { EnviarTasacion } from '../lib/tasacion';
import { Catalogo } from './clasica/Catalogo';
import { SeccionTasacion } from './clasica/SeccionTasacion';
import { Marco } from './clasica/Marco';
import { Portada } from './clasica/Portada';
import { SobreNosotros } from './clasica/SobreNosotros';
import { Testimonios } from './clasica/Testimonios';

// Plantilla clásica: la landing de la consola adaptada al sitio. Todo llega pintado desde el servidor.
// La sección de tasación solo aparece si llega la función que la envía: así cada corredora la tiene según su plan.
export function Clasica({ site, catalogo, enviarTasacion }: { site: SiteData; catalogo: PublicCatalog; enviarTasacion?: EnviarTasacion }) {
  const { brand, layout, content } = site;

  return (
    <Marco site={site} conTasacion={Boolean(enviarTasacion)}>
      <Portada brand={brand} hero={content.hero} conTasacion={Boolean(enviarTasacion)} />
      <Catalogo
        propiedades={catalogo.propiedades}
        marketId={catalogo.marketId}
        conBuscador={layout.showSearchFilter}
        contacto={{ whatsapp: brand.contact.whatsapp, whatsappMessage: brand.contact.whatsappMessage }}
      />
      {enviarTasacion && <SeccionTasacion brand={brand} enviarTasacion={enviarTasacion} />}
      {layout.showAboutSection && hasAbout(content) && <SobreNosotros brand={brand} about={content.about} />}
      {layout.showTestimonialsSection && hasTestimonials(content) && <Testimonios testimonials={content.testimonials} />}
    </Marco>
  );
}
