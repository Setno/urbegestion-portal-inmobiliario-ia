// Sin backend no existe autenticación real: el panel admin solo se habilita
// en desarrollo o si se activa explícitamente (demo) con VITE_ENABLE_ADMIN=true.
export const ADMIN_ENABLED: boolean =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN === 'true';
