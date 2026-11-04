// Lo que leen los buscadores y las redes sociales (H-031): títulos, descripciones, dirección canónica,
// vista previa al compartir, datos estructurados, mapa del sitio y robots.txt.
import type { Metadata } from 'next';
import type { SiteData } from '@portal/sitio-datos';
import type { PublicProperty } from '@portal/sitio-datos/propiedades';
import type { FichaPublica } from './getPropiedad';
import { esDireccionDePrueba } from './host';

// `host` es la dirección con que llegó la visita; `canonico`, la única con que Google debe conocer el sitio
// (dominio propio, si no el subdominio): así casasur.cl, www.casasur.cl y casasur.<plataforma> no compiten entre sí.
export interface DireccionSeo {
  host: string;
  canonico: string;
}

export const urlDelSitio = (host: string): string => `${/(^|\.)localhost$|^127\.0\.0\.1$/.test(host) ? 'http' : 'https'}://${host}`;

const NO_INDEXAR: Metadata['robots'] = { index: false };

// Una descripción para buscadores: una sola línea y de largo razonable.
export function resumen(texto: string, largo = 160): string {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  if (limpio.length <= largo) return limpio;
  const corte = limpio.slice(0, largo - 1);
  return `${corte.slice(0, corte.lastIndexOf(' ') > 80 ? corte.lastIndexOf(' ') : corte.length)}…`;
}

const OPERACION: Record<PublicProperty['operation'], string> = { venta: 'en venta', arriendo: 'en arriendo' };

export function descripcionDeLaFicha(p: PublicProperty): string {
  if (p.description.trim()) return resumen(p.description);
  const lugar = p.commune ? ` en ${p.commune}` : '';
  const dormitorios = p.bedrooms > 0 ? `, ${p.bedrooms} dormitorios` : '';
  return `${p.title}: propiedad ${OPERACION[p.operation]}${lugar}${dormitorios}.`;
}

export function metadatosPortada(site: SiteData | null, { host, canonico }: DireccionSeo): Metadata {
  if (!site) return { title: 'Sitio no disponible', robots: NO_INDEXAR };
  const { brand, content } = site;
  const titulo = brand.tagline ? `${brand.brandName} | ${brand.tagline}` : brand.brandName;
  const descripcion = resumen(content.footer.description || content.hero.services || brand.tagline || brand.brandName);
  const url = urlDelSitio(canonico);
  const imagen = brand.logoUrl || brand.brokerPhotoUrl;
  return {
    title: titulo,
    description: descripcion || undefined,
    metadataBase: new URL(url),
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'es_CL',
      url: '/',
      siteName: brand.brandName,
      title: titulo,
      description: descripcion || undefined,
      ...(imagen ? { images: [imagen] } : {}),
    },
    ...(esDireccionDePrueba(host) ? { robots: NO_INDEXAR } : {}),
  };
}

export function metadatosFicha(site: SiteData | null, propiedad: PublicProperty | null, { host, canonico }: DireccionSeo): Metadata {
  if (!site || !propiedad) return { title: 'Propiedad no disponible', robots: NO_INDEXAR };
  const titulo = `${propiedad.title} | ${site.brand.brandName}`;
  const descripcion = descripcionDeLaFicha(propiedad);
  const ruta = `/propiedades/${propiedad.id}`;
  return {
    title: titulo,
    description: descripcion,
    metadataBase: new URL(urlDelSitio(canonico)),
    alternates: { canonical: ruta },
    openGraph: {
      type: 'website',
      locale: 'es_CL',
      url: ruta,
      siteName: site.brand.brandName,
      title: titulo,
      description: descripcion,
      ...(propiedad.images[0] ? { images: [propiedad.images[0]] } : {}),
    },
    ...(esDireccionDePrueba(host) ? { robots: NO_INDEXAR } : {}),
  };
}

// La UF tiene código propio en la norma de monedas (CLF): así la entienden los buscadores.
const MONEDA_ISO: Record<string, string> = { UF: 'CLF' };

// Texto seguro para ir dentro de <script>: nadie puede cerrar la etiqueta con lo que escribió en una descripción.
const jsonEnScript = (datos: unknown): string => JSON.stringify(datos).replace(/</g, '\\u003c');

// Ficha en formato schema.org, para que el buscador entienda precio, ubicación y fotos.
export function datosDeLaFicha(site: SiteData, { propiedad: p }: FichaPublica, canonico: string): string {
  const url = `${urlDelSitio(canonico)}/propiedades/${p.id}`;
  return jsonEnScript({
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: p.title,
    description: descripcionDeLaFicha(p),
    url,
    ...(p.images.length ? { image: p.images } : {}),
    offers: {
      '@type': 'Offer',
      price: p.priceAmount,
      priceCurrency: MONEDA_ISO[p.priceCurrency] ?? p.priceCurrency,
      availability: p.reservada ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock',
      businessFunction: p.operation === 'venta' ? 'https://purl.org/goodrelations/v1#Sell' : 'https://purl.org/goodrelations/v1#LeaseOut',
      seller: { '@type': 'RealEstateAgent', name: site.brand.brandName },
    },
    ...(p.commune ? { contentLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: p.commune, addressCountry: 'CL' } } } : {}),
  });
}

// La corredora en formato schema.org, para la portada.
export function datosDeLaCorredora(site: SiteData, canonico: string): string {
  const { brand } = site;
  return jsonEnScript({
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: brand.brandName,
    url: urlDelSitio(canonico),
    ...(brand.logoUrl ? { logo: brand.logoUrl, image: brand.logoUrl } : {}),
    ...(brand.contact.phone ? { telephone: brand.contact.phone } : {}),
    ...(brand.contact.email ? { email: brand.contact.email } : {}),
    ...(brand.contact.address ? { address: brand.contact.address } : {}),
    ...(brand.cityRegion ? { areaServed: brand.cityRegion } : {}),
  });
}

const escaparXml = (texto: string): string =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Mapa del sitio: la portada y cada ficha publicada, con la dirección canónica.
export function mapaDelSitio(canonico: string, propiedades: PublicProperty[]): string {
  const base = urlDelSitio(canonico);
  const direcciones = [`${base}/`, ...propiedades.map((p) => `${base}/propiedades/${p.id}`)];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...direcciones.map((url) => `  <url><loc>${escaparXml(url)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
}

// Un sitio que no existe o una dirección de prueba piden no ser indexados.
export function robots(direccion: DireccionSeo | null): string {
  if (!direccion || esDireccionDePrueba(direccion.host)) return 'User-agent: *\nDisallow: /\n';
  return `User-agent: *\nAllow: /\n\nSitemap: ${urlDelSitio(direccion.canonico)}/sitemap.xml\n`;
}
