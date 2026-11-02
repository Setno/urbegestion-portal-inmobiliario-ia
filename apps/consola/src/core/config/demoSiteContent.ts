import type { SiteContent } from '@portal/sitio-datos';

// Textos de ejemplo del prototipo: solo se ven sin Supabase (modo local). Con Supabase cada corredora tiene los suyos en la base.
export const demoSiteContent: SiteContent = {
  hero: {
    badge: 'Más de 25 años en Santiago & Región Metropolitana',
    headline: 'Propiedades exclusivas y agrícolas con',
    headlineHighlight: 'asesoría experta e IA.',
    services: 'Venta, arriendo, administración y tasación profesional.',
    credential: 'Ex-Colaboradora ACOP',
    verifiedLabel: 'Verificada',
  },
  about: {
    eyebrow: 'Liderazgo & Confianza Inmobiliaria',
    title: 'Asesoría personalizada, estudio de títulos y excelencia en post-venta.',
    paragraphs: [
      'En UrbeGestión nos especializamos en ofrecer soluciones integrales en el mercado inmobiliario de Santiago. Con más de dos décadas y media de trayectoria profesional, hemos gestionado con éxito operaciones de compra, venta, arriendo, administración y tasación profesional tanto en propiedades residenciales de alta gama como en parcelas agrícolas y campos de producción.',
      'Nuestro compromiso va más allá de mostrar un inmueble: acompañamos a nuestros clientes en todo el proceso legal, estudio de títulos con abogados especialistas, trámites notariales e inscripción en el Conservador de Bienes Raíces, garantizando operaciones transparentes y seguras.',
    ],
    credential: 'Ex-Presidente & Director de Estudios ACOP',
    highlights: [
      { title: 'Estudio de Títulos Riguroso', text: 'Revisión jurídica exhaustiva para compraventas sin riesgos.' },
      { title: 'Especialidad Agrícola & Urbana', text: 'Dominio técnico de derechos de agua, subdivisiones y loteos.' },
      { title: 'Atención Personalizada 1 a 1', text: 'Trato directo con Pilar Osorio, sin intermediarios rotativos.' },
      { title: 'Cierre Rápido y Eficaz', text: 'Promedio de colocación en 42 días con cartera selecta.' },
    ],
  },
  testimonials: {
    eyebrow: 'Reputación Comprobada',
    title: 'Testimonios de Clientes y Colegas',
    subtitle: 'La confianza, transparencia y rigor jurídico han guiado nuestras operaciones durante 25 años en Santiago.',
    items: [
      {
        name: 'Agustín Manterola Covarrubias',
        role: 'Ex-Presidente ACOP (Asociación de Corredores de Propiedades)',
        photo: 'https://www.urbegestion.cl/assets/images/t_agustin.jpeg',
        initials: 'AM',
        quote: 'Fui jefe de Pilar durante 15 años, doy fe de sus altas capacidades profesionales y de su excelente disposición para resolver problemas. Me ayudó manejando una gran cartera de arriendos y administraciones complejas. Totalmente recomendada.',
        stars: 5,
      },
      {
        name: 'Carmen Luz Martín',
        role: 'Abogada Especialista en Derecho Inmobiliario',
        photo: '',
        initials: 'CLM',
        quote: 'He sido clienta de Pilar tanto para la compra como para la venta de propiedades. Siempre recibí un servicio excelente, diligente y eficaz. Además, colaboro con Pilar apoyando los estudios de títulos de las operaciones que realiza. Es una profesional de primer nivel.',
        stars: 5,
      },
      {
        name: 'Alfredo Hevia Minder',
        role: 'Propietario / Vendedor',
        photo: '',
        initials: 'AH',
        quote: 'Increíble experiencia con UrbeGestión. Pilar logró vender mi propiedad en tiempo récord y a un excelente valor de mercado. Su asesoría en la negociación fue clave para cerrar la operación sin contratiempos.',
        stars: 5,
      },
    ],
  },
  footer: {
    description: 'Especialistas en corretaje de alta gama, tasaciones y parcelas agrícolas con derechos de agua en Santiago.',
    coverageAreas: [
      'Vitacura & Lo Barnechea',
      'Las Condes & Barrio El Golf',
      'Providencia & La Reina',
      'Chicureo / Chamisero',
      'Melipilla & Pirque (Agrícola)',
    ],
    legalLine: 'Corretaje de Propiedades en Santiago de Chile.',
  },
};
