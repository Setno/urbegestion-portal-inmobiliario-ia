import type { MarketPack } from '../types';
import { CHILE_AREAS } from './locations';
import { CHILE_MESSAGES } from './messages';
import { CHILE_RATE_FEEDS } from './rates';

export const CHILE: MarketPack = {
  id: 'cl',
  name: 'Chile',
  locale: 'es-CL',
  messages: CHILE_MESSAGES,
  phonePrefix: '+56',
  phoneExample: '+56 9 1234 5678',
  privacyLaw: 'Ley 21.719',
  baseCurrency: 'CLP',
  defaultCurrency: 'UF',
  currencies: [
    { code: 'UF', fractionDigits: 0 },
    { code: 'CLP', symbol: '$', fractionDigits: 0 },
  ],
  areas: CHILE_AREAS,
  localityAliases: {
    melipilla: ['melipilla'],
    'las condes': ['las condes', 'golf', 'manquehue'],
    vitacura: ['vitacura'],
    barnechea: ['barnechea', 'dehesa', 'trapenses'],
    pirque: ['pirque', 'paine'],
    providencia: ['providencia'],
    chicureo: ['chicureo', 'colina', 'chamisero'],
  },
  sectorKeywords: ['melipilla', 'chicureo', 'pirque', 'barnechea'],
  rateFeeds: CHILE_RATE_FEEDS,
};
