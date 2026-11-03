import type { CSSProperties } from 'react';
import { hasAbout, hasTestimonials, type SiteData } from '@portal/sitio-datos';
import type { PublicCatalog } from '@portal/sitio-datos/propiedades';
import { BarraMovil } from './clasica/BarraMovil';
import { Cabecera } from './clasica/Cabecera';
import { Catalogo } from './clasica/Catalogo';
import { Pie } from './clasica/Pie';
import { Portada } from './clasica/Portada';
import { SobreNosotros } from './clasica/SobreNosotros';
import { Testimonios } from './clasica/Testimonios';

// Plantilla clásica: la landing de la consola adaptada al sitio. Todo llega pintado desde el servidor.
export function Clasica({ site, catalogo }: { site: SiteData; catalogo: PublicCatalog }) {
  const { brand, theme, layout, content } = site;
  const mostrarSobreNosotros = layout.showAboutSection && hasAbout(content);
  const mostrarTestimonios = layout.showTestimonialsSection && hasTestimonials(content);
  const colores = {
    '--color-urbe-primary': theme.primary,
    '--color-urbe-primary-dark': theme.primaryDark,
    '--color-urbe-accent': theme.accent,
    '--color-urbe-accent-hover': theme.accentHover,
  } as CSSProperties;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans" style={colores}>
      <Cabecera brand={brand} mostrarSobreNosotros={mostrarSobreNosotros} mostrarTestimonios={mostrarTestimonios} />
      <main>
        <Portada brand={brand} hero={content.hero} />
        <Catalogo
          propiedades={catalogo.propiedades}
          marketId={catalogo.marketId}
          conBuscador={layout.showSearchFilter}
          contacto={{ whatsapp: brand.contact.whatsapp, whatsappMessage: brand.contact.whatsappMessage }}
        />
        {mostrarSobreNosotros && <SobreNosotros brand={brand} about={content.about} />}
        {mostrarTestimonios && <Testimonios testimonials={content.testimonials} />}
      </main>
      <Pie brand={brand} footer={content.footer} mostrarSobreNosotros={mostrarSobreNosotros} mostrarTestimonios={mostrarTestimonios} />
      <BarraMovil contact={brand.contact} />
    </div>
  );
}
