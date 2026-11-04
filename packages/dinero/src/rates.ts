import type { MarketPack } from '@portal/mercados';
import type { CurrencyRates } from './money';

export interface LiveReading {
  currency: string;
  value: number;
  date: string; // AAAA-MM-DD
  source: string;
}

export interface LiveRates {
  rates: CurrencyRates;
  readings: LiveReading[];
}

// Cómo se pide una dirección: en el servidor del sitio se le agrega la caché diaria; en las pruebas es un doble.
export type RateFetcher = (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

// Lee las tasas del día desde las fuentes del mercado (en Chile, la UF del Banco Central). Lo que falla o no sirve se omite:
// nunca se inventa una tasa, y sin ella el sitio solo muestra las monedas que puede convertir.
export async function fetchLiveRates(pack: MarketPack, fetcher: RateFetcher, now: Date = new Date()): Promise<LiveRates> {
  const readings: LiveReading[] = [];
  await Promise.all(
    (pack.rateFeeds ?? []).map(async (feed) => {
      try {
        const response = await fetcher(feed.url);
        if (!response.ok) return;
        const reading = feed.parse(await response.json(), now);
        if (reading) readings.push({ currency: feed.currency, value: reading.value, date: reading.date, source: feed.source });
      } catch {
        // Sin red o con una respuesta rota: esta moneda queda sin tasa
      }
    }),
  );
  return { rates: Object.fromEntries(readings.map((r) => [r.currency, r.value])), readings };
}
