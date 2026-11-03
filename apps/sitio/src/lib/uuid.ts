// Solo la forma en minúsculas que entrega la base: cada propiedad tiene una sola dirección.
export const esUuid = (valor: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(valor);
