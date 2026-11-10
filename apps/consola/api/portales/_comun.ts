// Auxiliar de las funciones de portales. El guion bajo evita que Vercel lo publique como una función.
declare const process: { env: Record<string, string | undefined> };

// Dirección a la que Mercado Libre devuelve al administrador. Debe coincidir EXACTAMENTE con la registrada en la app.
export const redirectUriFor = (request: Request): string =>
  process.env.ML_REDIRECT_URI ||
  `${(process.env.SITE_URL || new URL(request.url).origin).replace(/\/+$/, '')}/api/portales/mercadolibre-retorno`;
