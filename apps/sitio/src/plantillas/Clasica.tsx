import { hasAbout, hasTestimonials, type SiteData } from '@portal/sitio-datos';
import type { PublicCatalog } from '@portal/sitio-datos/propiedades';
import type { EnviarContactoChat } from '../lib/chat';
import type { EnviarTasacion } from '../lib/tasacion';
import { AsistenteChat } from './clasica/AsistenteChat';
import { Catalogo } from './clasica/Catalogo';
import { SeccionTasacion } from './clasica/SeccionTasacion';
import { Marco } from './clasica/Marco';
import { Portada } from './clasica/Portada';
import { SobreNosotros } from './clasica/SobreNosotros';
import { Testimonios } from './clasica/Testimonios';

// Plantilla clásica: la landing de la consola adaptada al sitio. Todo llega pintado desde el servidor.
// La sección de tasación solo aparece si llega la función que la envía: así cada corredora la tiene según su plan.
// Igual el asistente de chat: aparece solo si llega la función que guarda el contacto.
export function Clasica({
  site,
  catalogo,
  enviarTasacion,
  enviarContacto,
}: {
  site: SiteData;
  catalogo: PublicCatalog;
  enviarTasacion?: EnviarTasacion;
  enviarContacto?: EnviarContactoChat;
}) {
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
      {enviarContacto && (
        <AsistenteChat
          propiedades={catalogo.propiedades}
          enviarContacto={enviarContacto}
          contexto={{
            corredora: brand.brandName,
            corredor: brand.brokerName,
            telefono: brand.contact.phoneDisplay || brand.contact.phone,
            correo: brand.contact.email,
            marketId: catalogo.marketId,
            conTasacion: Boolean(enviarTasacion),
          }}
        />
      )}
    </Marco>
  );
}
