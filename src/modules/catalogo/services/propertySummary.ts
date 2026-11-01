import type { Property, PropertyType } from '../types/property';

// Resúmenes del catálogo para textos y sugerencias que no deben depender de un lugar fijo: salen de lo que la
// corredora tiene publicado.

// "Lo Barnechea (La Dehesa / Los Trapenses)" → "Lo Barnechea"; "Pirque / Paine (Agrícola)" → "Pirque"
export const shortLocality = (commune: string): string =>
  commune.replace(/\s*\(.*?\)\s*/g, ' ').split('/')[0].trim();

export const featuredLocalities = (properties: Property[], max: number): string[] => {
  const seen: string[] = [];
  for (const p of properties) {
    const name = shortLocality(p.commune);
    if (name && !seen.includes(name)) seen.push(name);
    if (seen.length >= max) break;
  }
  return seen;
};

const TYPE_PLURAL: Record<PropertyType, string> = {
  casa: 'Casas',
  departamento: 'Deptos',
  parcela_agricola: 'Parcelas',
  oficina_comercial: 'Oficinas',
  terreno: 'Terrenos',
};

// Sugerencias para el chat: primero un tipo distinto por sugerencia y luego, si faltan, otras comunas.
export const quickSearchChips = (properties: Property[], max = 3): string[] => {
  const pairs: { type: PropertyType; place: string }[] = [];
  for (const p of properties) {
    const place = shortLocality(p.commune);
    if (place && !pairs.some((x) => x.type === p.propertyType && x.place === place)) {
      pairs.push({ type: p.propertyType, place });
    }
  }
  const chosen: typeof pairs = [];
  for (const pair of pairs) {
    if (chosen.length < max && !chosen.some((c) => c.type === pair.type)) chosen.push(pair);
  }
  for (const pair of pairs) {
    if (chosen.length < max && !chosen.includes(pair)) chosen.push(pair);
  }
  return chosen.map((c) => `${TYPE_PLURAL[c.type]} en ${c.place}`);
};
