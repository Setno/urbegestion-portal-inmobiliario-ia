import { useMemo } from 'react';
import { create } from 'zustand';
import { es, type MessageKey } from './messages.es';
import { en } from './messages.en';
import { getMarketPack } from '@portal/mercados';
import { useMarketStore } from '../market/useMarketStore';

export type Locale = 'es' | 'en';
export const LOCALES: Locale[] = ['es', 'en'];
export type { MessageKey };

const dictionaries: Record<Locale, Record<string, string>> = { es, en };

export type Params = Record<string, string | number>;

export const capitalize = (text: string): string => (text ? text[0].toUpperCase() + text.slice(1) : text);

// 'one' o 'other' según las reglas del idioma (Intl.PluralRules); las demás formas se tratan como 'other'.
export const plural = (locale: Locale, count: number): 'one' | 'other' =>
  new Intl.PluralRules(locale).select(count) === 'one' ? 'one' : 'other';

// Busca el texto en los del mercado, luego en los del idioma y por último en español; sin texto devuelve la clave.
export function translate(
  locale: Locale,
  key: MessageKey,
  params?: Params,
  marketMessages?: Record<string, string>,
): string {
  const raw = marketMessages?.[key] ?? dictionaries[locale][key] ?? dictionaries.es[key] ?? key;
  return params ? raw.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole)) : raw;
}

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LOCALE_KEY = 'ui.locale';

// Preferencia de esta persona en este navegador (no es un dato de negocio); sin ella, español.
const readStoredLocale = (): Locale => {
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    return LOCALES.find((l) => l === stored) ?? 'es';
  } catch (error) {
    console.warn('No se pudo leer el idioma guardado', error);
    return 'es';
  }
};

// El idioma de la interfaz: el que eligió la persona (queda en su navegador) o español.
// Más adelante el idioma de la corredora será el valor inicial para quien no haya elegido.
export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: readStoredLocale(),
  setLocale: (locale) => {
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch (error) {
      console.warn('No se pudo guardar el idioma', error);
    }
    if (typeof document !== 'undefined') document.documentElement.lang = locale;
    set({ locale });
  },
}));

const marketMessages = (locale: Locale): Record<string, string> | undefined =>
  getMarketPack(useMarketStore.getState().marketId).messages[locale];

// Para código que no es un componente (servicios, textos que arma una función).
export const t = (key: MessageKey, params?: Params): string =>
  translate(useLocaleStore.getState().locale, key, params, marketMessages(useLocaleStore.getState().locale));

export const tn = (key: string, count: number, params?: Params): string => {
  const locale = useLocaleStore.getState().locale;
  return translate(locale, `${key}.${plural(locale, count)}` as MessageKey, { count, ...params }, marketMessages(locale));
};

// Para componentes: se vuelven a pintar si cambia el idioma o el mercado.
export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  const marketId = useMarketStore((s) => s.marketId);
  return useMemo(() => {
    const messages = getMarketPack(marketId).messages[locale];
    return {
      locale,
      t: (key: MessageKey, params?: Params) => translate(locale, key, params, messages),
      tn: (key: string, count: number, params?: Params) =>
        translate(locale, `${key}.${plural(locale, count)}` as MessageKey, { count, ...params }, messages),
    };
  }, [locale, marketId]);
}
