'use client';

// Se ve solo si falla la lectura y no hay una copia anterior de la página que seguir mostrando.
export default function ErrorPage() {
  return (
    <main className="sitio-no-disponible">
      <h1>Sitio no disponible</h1>
      <p>Vuelve a intentarlo en unos minutos.</p>
    </main>
  );
}
