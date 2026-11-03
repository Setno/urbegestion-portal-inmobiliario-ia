'use client';

import { SitioNoDisponible } from './SitioNoDisponible';

// Se ve solo si falla la lectura y no hay una copia anterior de la página que seguir mostrando.
export default function ErrorPage() {
  return <SitioNoDisponible />;
}
