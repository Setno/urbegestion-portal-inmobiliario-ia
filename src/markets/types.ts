// Un paquete de mercado reúne todo lo que cambia de un país a otro (ADR-008). Ningún módulo importa un país:
// pide el paquete por su id a través de `getMarketPack`.

export interface LocationZone {
  groupName: string;
  localities: string[];
}

// Primer nivel de ubicación del país (en Chile, la región; en otros países un estado, provincia o departamento).
export interface LocationArea {
  id: string; // código estable (ISO 3166-2 cuando existe)
  name: string;
  zones: LocationZone[];
}

// Una moneda o unidad de cuenta que el mercado usa para precios (en Chile: el peso y la UF).
export interface CurrencyDef {
  code: string; // 'CLP', 'UF'
  symbol?: string; // '$' va antes del monto; sin símbolo solo se muestra el código después
  fractionDigits: number;
}

export interface MarketPack {
  id: string; // 'cl'
  name: string;
  locale: string; // 'es-CL': idioma y formatos por defecto
  areaLabel: string; // cómo se llama el primer nivel: "Región"
  localityLabel: string; // y el segundo: "Comuna"
  phonePrefix: string;
  privacyLaw: string;
  baseCurrency: string; // moneda en la que se convierten las demás ('CLP')
  defaultCurrency: string; // moneda con la que se muestran y cargan los precios por defecto ('UF')
  currencies: CurrencyDef[];
  areas: LocationArea[];
  // Palabras que una persona usa para nombrar una comuna ("golf" para Las Condes). Clave en minúsculas, igual que
  // parte del nombre de la comuna guardada; sirve al chat para entender búsquedas.
  localityAliases: Record<string, string[]>;
  // Sectores que se escriben distinto en la lista y en la ficha ("Colina (Chicureo)" frente a "Chicureo / Colina");
  // dos nombres que contengan la misma palabra clave cuentan como el mismo lugar.
  sectorKeywords: string[];
}
