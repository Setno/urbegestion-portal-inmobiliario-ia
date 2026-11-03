import { hasAbout, hasTestimonials, type SiteData } from '@portal/sitio-datos';
import type { PublicCatalog } from '@portal/sitio-datos/propiedades';
import { Catalogo } from './clasica/Catalogo';
import { Marco } from './clasica/Marco';
import { Portada } from './clasica/Portada';
import { SobreNosotros } from './clasica/SobreNosotros';
import { Testimonios } from './clasica/Testimonios';

// Plantilla clásica: la landing de la consola adaptada al sitio. Todo llega pintado desde el servidor.
export function Clasica({ site, catalogo }: { site: SiteData; catalogo: PublicCatalog }) {
  const { brand, layout, content } = site;

  return (
    <Marco site={site}>
      <Portada brand={brand} hero={content.hero} />
      <Catalogo
        propiedades={catalogo.propiedades}
        marketId={catalogo.marketId}
        conBuscador={layout.showSearchFilter}
        contacto={{ whatsapp: brand.contact.whatsapp, whatsappMessage: brand.contact.whatsappMessage }}
      />
      {layout.showAboutSection && hasAbout(content) && <SobreNosotros brand={brand} about={content.about} />}
      {layout.showTestimonialsSection && hasTestimonials(content) && <Testimonios testimonials={content.testimonials} />}
    </Marco>
  );
}
