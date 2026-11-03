import type { CSSProperties, ReactNode } from 'react';
import { hasAbout, hasTestimonials, type SiteData } from '@portal/sitio-datos';
import { BarraMovil } from './BarraMovil';
import { Cabecera } from './Cabecera';
import { Pie } from './Pie';

// Lo común a todas las páginas de la plantilla: colores de la corredora, cabecera, pie y barra del celular.
export function Marco({ site, children }: { site: SiteData; children: ReactNode }) {
  const { brand, theme, layout, content } = site;
  const mostrarSobreNosotros = layout.showAboutSection && hasAbout(content);
  const mostrarTestimonios = layout.showTestimonialsSection && hasTestimonials(content);
  const colores = {
    '--color-urbe-primary': theme.primary,
    '--color-urbe-primary-dark': theme.primaryDark,
    '--color-urbe-accent': theme.accent,
    '--color-urbe-accent-hover': theme.accentHover,
  } as CSSProperties;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans" style={colores}>
      <Cabecera brand={brand} mostrarSobreNosotros={mostrarSobreNosotros} mostrarTestimonios={mostrarTestimonios} />
      <main>{children}</main>
      <Pie brand={brand} footer={content.footer} mostrarSobreNosotros={mostrarSobreNosotros} mostrarTestimonios={mostrarTestimonios} />
      <BarraMovil contact={brand.contact} />
    </div>
  );
}
