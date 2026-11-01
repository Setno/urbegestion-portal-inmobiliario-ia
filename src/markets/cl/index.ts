import type { MarketPack } from '../types';
import { CHILE_AREAS } from './locations';

export const CHILE: MarketPack = {
  id: 'cl',
  name: 'Chile',
  locale: 'es-CL',
  areaLabel: 'Región',
  localityLabel: 'Comuna',
  phonePrefix: '+56',
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
};
