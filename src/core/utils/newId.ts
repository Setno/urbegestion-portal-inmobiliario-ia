// Genera ids únicos aunque se creen varios en el mismo milisegundo.
export const newId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
