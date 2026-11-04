'use client';

import { useEffect, useState } from 'react';

// El video de la portada solo se pone en pantallas anchas y si la persona no pidió reducir el movimiento.
// Se decide en el navegador: en el HTML del servidor nunca hay video, así un celular no lo descarga (H-049).
export function VideoPortada({ src, poster }: { src: string; poster?: string }) {
  const [permitido, setPermitido] = useState(false);
  useEffect(() => {
    const ancha = window.matchMedia('(min-width: 768px)').matches;
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPermitido(ancha && !reducir);
  }, []);
  if (!permitido) return null;
  return (
    <video autoPlay muted loop playsInline preload="metadata" poster={poster || undefined} className="absolute inset-0 w-full h-full object-cover scale-105 brightness-75">
      <source src={src} />
    </video>
  );
}
