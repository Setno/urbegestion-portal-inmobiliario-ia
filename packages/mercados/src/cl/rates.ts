import type { RateFeed, RateReading } from '../types';

// Un valor de UF fuera de este rango es un dato dañado (hoy ronda los 40.000 pesos): se descarta en vez de mostrar precios absurdos.
const UF_MINIMA = 1_000;
const UF_MAXIMA = 1_000_000;

// El día de hoy en Chile (AAAA-MM-DD): de noche ya es el día siguiente en UTC.
const hoyEnChile = (now: Date): string => now.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });

const registro = (valor: unknown): valor is Record<string, unknown> => Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);

// mindicador.cl publica los indicadores del Banco Central de Chile: { serie: [{ fecha, valor }, ...] }, del día más nuevo al más antiguo.
// La UF de un día se conoce con anticipación; igual solo se usa el de hoy o, si aún no está, el último anterior.
export function parseMindicador(json: unknown, now: Date): RateReading | null {
  if (!registro(json) || !Array.isArray(json.serie)) return null;
  const hoy = hoyEnChile(now);
  let mejor: RateReading | null = null;
  for (const fila of json.serie) {
    if (!registro(fila) || typeof fila.fecha !== 'string' || typeof fila.valor !== 'number') continue;
    const fecha = fila.fecha.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha > hoy) continue;
    if (!Number.isFinite(fila.valor) || fila.valor < UF_MINIMA || fila.valor > UF_MAXIMA) continue;
    if (!mejor || fecha > mejor.date) mejor = { value: fila.valor, date: fecha };
  }
  return mejor;
}

export const CHILE_RATE_FEEDS: RateFeed[] = [
  {
    currency: 'UF',
    source: 'Banco Central de Chile, vía mindicador.cl',
    url: 'https://mindicador.cl/api/uf',
    parse: parseMindicador,
  },
];
