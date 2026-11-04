import { getMarketPack } from '@portal/mercados';
import { fetchLiveRates, type LiveRates } from '@portal/dinero/tasas';

const UNA_HORA = 3600;
const ESPERA_MS = 5000;

// Las tasas del día del mercado de la corredora (en Chile, la UF del Banco Central). Se leen en el servidor y se guardan una hora:
// ningún visitante llama a la fuente. Si no responde, el sitio sigue sin esa tasa en vez de usar un valor viejo escrito a mano.
export async function getTasas(marketId: string): Promise<LiveRates> {
  try {
    return await fetchLiveRates(getMarketPack(marketId), (url) =>
      fetch(url, { next: { revalidate: UNA_HORA }, signal: AbortSignal.timeout(ESPERA_MS) }),
    );
  } catch {
    console.warn('[sitio] No se pudieron leer las tasas del día');
    return { rates: {}, readings: [] };
  }
}
