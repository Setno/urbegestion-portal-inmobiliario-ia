// Funciones que existen solo en previews y en desarrollo, nunca en producción (por ejemplo "Probar sin publicar").
// vite.config.ts fija __PORTAL_PREVIEW__ al compilar: true con VERCEL_ENV=preview o con `npm run dev`; en cualquier otro caso, false.
// El servidor lo comprueba por su cuenta (api/portales/_comun.ts): esconder el botón no es la única barrera.
declare const __PORTAL_PREVIEW__: boolean | undefined;

export const isPreviewBuild: boolean = typeof __PORTAL_PREVIEW__ !== 'undefined' && __PORTAL_PREVIEW__ === true;
