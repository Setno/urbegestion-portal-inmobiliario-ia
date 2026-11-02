import type { CurrencyRates } from '@portal/dinero';
import { agencyConfig } from '../config/agencyConfig';

// Las tasas vigentes. Hoy la UF se ajusta desde Integraciones (agencyConfig); más adelante vendrán de cada corredora.
export const currentRates = (): CurrencyRates => ({ UF: agencyConfig.market.ufValueClp });
