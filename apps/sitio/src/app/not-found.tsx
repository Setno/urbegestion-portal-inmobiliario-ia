import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="sitio-no-disponible">
      <h1 className="text-2xl font-bold mb-2">Esta página no está disponible</h1>
      <p className="mb-4">Puede que la propiedad ya no esté publicada.</p>
      <Link href="/" className="font-bold underline">Ver todas las propiedades</Link>
    </main>
  );
}
