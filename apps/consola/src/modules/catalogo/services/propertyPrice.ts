import type { Property } from '../types/property';
import type { Money } from '@portal/dinero';

// El precio de una propiedad como dinero (monto con su moneda).
export const priceOf = (p: Pick<Property, 'priceAmount' | 'priceCurrency'>): Money => ({
  amount: p.priceAmount,
  currency: p.priceCurrency,
});
