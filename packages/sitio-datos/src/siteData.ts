// Datos públicos del sitio de una corredora (H-027, ADR-011): estos datos dicen qué se muestra y la plantilla, cómo se ve.
// Los usan la consola y el sitio Next.js. Nada de esto es secreto: lo lee cualquier visitante.

export const DEFAULT_TEMPLATE_ID = 'clasica';

export interface SiteBrand {
  brandName: string;
  brokerName: string;
  brokerRole: string;
  tagline: string;
  experienceYears: number;
  cityRegion: string;
  logoUrl: string;
  logoWhiteUrl: string;
  brokerPhotoUrl: string;
  contact: {
    phone: string;
    phoneDisplay: string;
    whatsapp: string;
    whatsappMessage: string;
    email: string;
    address: string;
    schedule: string;
    instagram: string;
  };
  aiAgent: {
    botName: string;
    welcomeMessage: string;
    avatarUrl: string;
    calendarUrl: string;
  };
  stats: {
    yearsExperience: string;
    propertiesSold: string;
    happyClients: string;
    averageDaysToSell: string;
  };
}

export interface SiteTheme {
  primary: string;
  primaryDark: string;
  accent: string;
  accentHover: string;
}

export interface SiteLayout {
  showSearchFilter: boolean;
  showAboutSection: boolean;
  showTestimonialsSection: boolean;
  showAiChat: boolean;
}

export interface SiteTestimonial {
  name: string;
  role: string;
  photo: string;
  initials: string;
  quote: string;
  stars: number;
}

// Textos propios de cada corredora. Lo que esté vacío no se muestra.
export interface SiteContent {
  hero: {
    badge: string;
    headline: string;
    headlineHighlight: string;
    services: string;
    credential: string;
    verifiedLabel: string;
    // Foto de fondo y video opcional de la portada: de la corredora, nunca los de otra (H-049). Vacíos = fondo neutro.
    imageUrl: string;
    videoUrl: string;
  };
  about: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    credential: string;
    highlights: { title: string; text: string }[];
  };
  testimonials: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: SiteTestimonial[];
  };
  footer: {
    description: string;
    coverageAreas: string[];
    legalLine: string;
  };
}

export interface SiteData {
  templateId: string;
  brand: SiteBrand;
  theme: SiteTheme;
  layout: SiteLayout;
  content: SiteContent;
}

export const DEFAULT_THEME: SiteTheme = {
  primary: '#164e63',
  primaryDark: '#0f3a4b',
  accent: '#c59b27',
  accentHover: '#b0881e',
};

export const DEFAULT_LAYOUT: SiteLayout = {
  showSearchFilter: true,
  showAboutSection: true,
  showTestimonialsSection: true,
  showAiChat: true,
};

// Marca de una corredora que aún no carga sus datos: su nombre y nada inventado.
export function neutralBrand(tenantName: string): SiteBrand {
  return {
    brandName: tenantName,
    brokerName: tenantName,
    brokerRole: '',
    tagline: '',
    experienceYears: 0,
    cityRegion: '',
    logoUrl: '',
    logoWhiteUrl: '',
    brokerPhotoUrl: '',
    contact: { phone: '', phoneDisplay: '', whatsapp: '', whatsappMessage: '', email: '', address: '', schedule: '', instagram: '' },
    aiAgent: {
      botName: 'Asistente',
      welcomeMessage: `¡Hola! Soy el asistente de ${tenantName}. ¿Buscas comprar, arrendar o vender una propiedad?`,
      avatarUrl: '',
      calendarUrl: '',
    },
    stats: { yearsExperience: '', propertiesSold: '', happyClients: '', averageDaysToSell: '' },
  };
}

export const NEUTRAL_CONTENT: SiteContent = {
  hero: {
    badge: '',
    headline: 'Encuentra tu próxima propiedad',
    headlineHighlight: '',
    services: 'Venta y arriendo de propiedades.',
    credential: '',
    verifiedLabel: '',
    imageUrl: '',
    videoUrl: '',
  },
  about: { eyebrow: '', title: '', paragraphs: [], credential: '', highlights: [] },
  testimonials: { eyebrow: '', title: '', subtitle: '', items: [] },
  footer: { description: '', coverageAreas: [], legalLine: '' },
};

// Solo direcciones web normales: evita enlaces javascript: y fotos incrustadas como texto dentro de la base.
export function safeUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  return /^https?:\/\//i.test(url) ? url : '';
}

// Dirección escrita a mano por la corredora: agrega https:// si falta. Vacía sigue vacía; null si no se puede usar.
export function normalizeUrl(value: string): string | null {
  const url = value.trim();
  if (!url) return '';
  if (/^https?:\/\/\S+$/i.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return null;
  return /^[^\s/]+\.[^\s]+$/.test(url) ? `https://${url}` : null;
}

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
const text = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
const textList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.trim() !== '') : [];
const color = (value: unknown, fallback: string): string =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
const flag = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback);

function parseBrand(raw: unknown, tenantName: string): SiteBrand {
  const neutral = neutralBrand(tenantName);
  const b = record(raw);
  const c = record(b.contact);
  const a = record(b.aiAgent);
  const s = record(b.stats);
  const years = Number(b.experienceYears);
  return {
    brandName: text(b.brandName) || neutral.brandName,
    brokerName: text(b.brokerName) || text(b.brandName) || neutral.brokerName,
    brokerRole: text(b.brokerRole),
    tagline: text(b.tagline),
    experienceYears: Number.isFinite(years) && years > 0 ? years : 0,
    cityRegion: text(b.cityRegion),
    logoUrl: safeUrl(b.logoUrl),
    logoWhiteUrl: safeUrl(b.logoWhiteUrl),
    brokerPhotoUrl: safeUrl(b.brokerPhotoUrl),
    contact: {
      phone: text(c.phone),
      phoneDisplay: text(c.phoneDisplay),
      whatsapp: text(c.whatsapp),
      whatsappMessage: text(c.whatsappMessage),
      email: text(c.email),
      address: text(c.address),
      schedule: text(c.schedule),
      instagram: safeUrl(c.instagram),
    },
    aiAgent: {
      botName: text(a.botName) || neutral.aiAgent.botName,
      welcomeMessage: text(a.welcomeMessage) || neutral.aiAgent.welcomeMessage,
      avatarUrl: safeUrl(a.avatarUrl),
      calendarUrl: safeUrl(a.calendarUrl),
    },
    stats: {
      yearsExperience: text(s.yearsExperience),
      propertiesSold: text(s.propertiesSold),
      happyClients: text(s.happyClients),
      averageDaysToSell: text(s.averageDaysToSell),
    },
  };
}

function parseTheme(raw: unknown): SiteTheme {
  const t = record(raw);
  return {
    primary: color(t.primary, DEFAULT_THEME.primary),
    primaryDark: color(t.primaryDark, DEFAULT_THEME.primaryDark),
    accent: color(t.accent, DEFAULT_THEME.accent),
    accentHover: color(t.accentHover, DEFAULT_THEME.accentHover),
  };
}

function parseLayout(raw: unknown): SiteLayout {
  const l = record(raw);
  return {
    showSearchFilter: flag(l.showSearchFilter, DEFAULT_LAYOUT.showSearchFilter),
    showAboutSection: flag(l.showAboutSection, DEFAULT_LAYOUT.showAboutSection),
    showTestimonialsSection: flag(l.showTestimonialsSection, DEFAULT_LAYOUT.showTestimonialsSection),
    showAiChat: flag(l.showAiChat, DEFAULT_LAYOUT.showAiChat),
  };
}

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0].toUpperCase())
    .join('');

function parseTestimonials(raw: unknown): SiteTestimonial[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const t = record(item);
    const name = text(t.name);
    const quote = text(t.quote);
    if (!name || !quote) return [];
    const stars = Number(t.stars);
    return [{
      name,
      role: text(t.role),
      photo: safeUrl(t.photo),
      initials: text(t.initials) || initialsOf(name),
      quote,
      stars: Number.isInteger(stars) && stars >= 1 && stars <= 5 ? stars : 5,
    }];
  });
}

function parseContent(raw: unknown): SiteContent {
  const c = record(raw);
  // Una corredora que aún no carga textos ve una portada genérica; si ya los cargó, se respeta lo que dejó vacío.
  const hero = record(c.hero);
  const heroStored = Object.keys(hero).length > 0;
  const about = record(c.about);
  const testimonials = record(c.testimonials);
  const footer = record(c.footer);
  const highlights = Array.isArray(about.highlights) ? about.highlights.map(record) : [];
  return {
    hero: {
      badge: text(hero.badge),
      headline: text(hero.headline, heroStored ? '' : NEUTRAL_CONTENT.hero.headline),
      headlineHighlight: text(hero.headlineHighlight),
      services: text(hero.services, heroStored ? '' : NEUTRAL_CONTENT.hero.services),
      credential: text(hero.credential),
      verifiedLabel: text(hero.verifiedLabel),
      imageUrl: safeUrl(hero.imageUrl),
      videoUrl: safeUrl(hero.videoUrl),
    },
    about: {
      eyebrow: text(about.eyebrow),
      title: text(about.title),
      paragraphs: textList(about.paragraphs),
      credential: text(about.credential),
      highlights: highlights
        .filter((h) => typeof h.title === 'string' && h.title && typeof h.text === 'string')
        .map((h) => ({ title: h.title as string, text: h.text as string })),
    },
    testimonials: {
      eyebrow: text(testimonials.eyebrow),
      title: text(testimonials.title),
      subtitle: text(testimonials.subtitle),
      items: parseTestimonials(testimonials.items),
    },
    footer: {
      description: text(footer.description),
      coverageAreas: textList(footer.coverageAreas),
      legalLine: text(footer.legalLine),
    },
  };
}

// Lee la respuesta de get_tenant_public_site. Sin corredora devuelve null; cualquier dato raro se reemplaza por su valor neutro.
export function parseSiteData(raw: unknown): SiteData | null {
  const r = record(raw);
  if (typeof r.tenantName !== 'string' || !r.tenantName) return null;
  return {
    templateId: typeof r.templateId === 'string' && r.templateId ? r.templateId : DEFAULT_TEMPLATE_ID,
    brand: parseBrand(r.brand, r.tenantName),
    theme: parseTheme(r.theme),
    layout: parseLayout(r.layout),
    content: parseContent(r.content),
  };
}

// La sección "Sobre nosotros" solo existe si la corredora escribió algo.
export const hasAbout = (content: SiteContent): boolean =>
  Boolean(content.about.title) || content.about.paragraphs.length > 0;

export const hasTestimonials = (content: SiteContent): boolean => content.testimonials.items.length > 0;

// "@casasur" a partir de https://www.instagram.com/casasur/ (vacío si la dirección no es de un perfil).
export function instagramHandle(url: string): string {
  const match = /instagram\.com\/([^/?#]+)/i.exec(url);
  return match ? `@${match[1]}` : '';
}

// Deja solo los campos públicos: la configuración interna de la consola (mercado, simulador) no se guarda en esta tabla.
export function serializeBrand(brand: SiteBrand): SiteBrand {
  return {
    brandName: brand.brandName,
    brokerName: brand.brokerName,
    brokerRole: brand.brokerRole,
    tagline: brand.tagline,
    experienceYears: brand.experienceYears,
    cityRegion: brand.cityRegion,
    logoUrl: brand.logoUrl,
    logoWhiteUrl: brand.logoWhiteUrl,
    brokerPhotoUrl: brand.brokerPhotoUrl,
    contact: brand.contact,
    aiAgent: brand.aiAgent,
    stats: brand.stats,
  };
}
