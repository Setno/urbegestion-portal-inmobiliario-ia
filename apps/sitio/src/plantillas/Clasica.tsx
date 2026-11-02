import type { CSSProperties } from 'react';
import type { SiteData } from '@portal/sitio-datos';

// Esqueleto de la plantilla clásica: comprueba que el sitio lee y muestra los datos de la corredora.
// La landing completa se adapta aquí con H-028.
export function Clasica({ site }: { site: SiteData }) {
  const { brand, theme, content } = site;
  const { contact } = brand;
  const colors = { '--color-primario': theme.primary, '--color-acento': theme.accent } as CSSProperties;

  return (
    <div className="clasica" style={colors}>
      <header className="clasica-cabecera">
        {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.brandName} height={48} /> : <strong>{brand.brandName}</strong>}
      </header>

      <main className="clasica-portada">
        <p className="clasica-marca">{brand.brandName}</p>
        <h1>
          {content.hero.headline} {content.hero.headlineHighlight && <em>{content.hero.headlineHighlight}</em>}
        </h1>
        {brand.tagline && <p>{brand.tagline}</p>}
        {content.hero.services && <p>{content.hero.services}</p>}
      </main>

      {(contact.phone || contact.email) && (
        <footer className="clasica-pie">
          {contact.phone && <a href={`tel:${contact.phone}`}>{contact.phoneDisplay || contact.phone}</a>}
          {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
        </footer>
      )}
    </div>
  );
}
