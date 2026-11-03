import type { ReactNode } from 'react';
import './sitio.css';

const FUENTES = 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="motion-safe:scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FUENTES} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
