// Correos de relleno que guardaron versiones anteriores cuando la persona no dejó uno (H-053): no son correos reales.
const RELLENO = new Set(['sin-correo@solicitud.cl', 'propietario@sin-email.cl']);

// El correo real de un lead, o '' si no tiene (vacío o de relleno).
export const realEmail = (email: unknown): string => {
  const limpio = typeof email === 'string' ? email.trim() : '';
  return RELLENO.has(limpio.toLowerCase()) ? '' : limpio;
};

// Lo que se muestra en pantalla: nunca un hueco ni un correo inventado.
export const displayEmail = (email: unknown): string => realEmail(email) || 'Sin correo';
