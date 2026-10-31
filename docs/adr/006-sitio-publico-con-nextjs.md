# ADR-006: Sitio público con Next.js; consola y widget siguen en React + Vite

- Estado: aceptada (sin implementar)
- Fecha: 2026-10-30
- Revisa parcialmente: ADR-001

## Contexto
Con el sitio incluido en el producto base (ADR-005), las fichas de propiedades deben aparecer en buscadores y cargar rápido, y una misma aplicación debe servir el sitio de muchas corredoras según el dominio con que se la visita. Una aplicación de una sola página (SPA) como la actual es débil para el posicionamiento en buscadores. El responsable del producto no programa y aceptó la recomendación técnica.

## Opciones consideradas
| Opción | A favor | En contra | Costo |
| --- | --- | --- | --- |
| Next.js para el sitio público; consola en React/Vite (elegida) | Se genera en el servidor (buen SEO y velocidad), una sola aplicación sirve muchos dominios, encaja con Vercel y con Supabase | Dos aplicaciones en el repositorio; aprender sus convenciones | Medio |
| Todo en React/Vite (SPA) | Sin cambios | Fichas peor indexadas; más lento en móvil con mala señal | Bajo |
| Astro u otro generador estático | Muy rápido y simple | Menos adecuado para sitios dinámicos por corredora | Medio |
| WordPress o similar | Plantillas listas | Difícil de integrar con el CRM y el modelo multi-tenant; operación y seguridad adicionales | Alto |

## Decisión
- El **sitio público** de cada corredora se construye con **Next.js** y lee su contenido de Supabase (catálogo y datos del sitio).
- La **consola** (CRM y administración) y el **widget** siguen en React + Vite; la consola se mantiene como PWA.
- El repositorio pasa a **monorepo** con `apps/sitio` (Next.js), `apps/consola` (React + Vite) y paquetes compartidos (diseño, datos de mercado, textos), cuando se inicie la implementación (historia H-026).
- El sitio resuelve a qué corredora pertenece según el dominio o subdominio con que se lo visita.

## Consecuencias
- Las plantillas (H-028, H-029) se construyen sobre Next.js; la landing actual (`src/site/`) se adapta como primera plantilla.
- Por verificar antes de fijar precios: límites y costos de Vercel por cantidad de dominios y tráfico.
- Los sitios requieren cumplimiento de consentimiento de datos en formularios (H-012) y cabeceras de seguridad (H-004), que deben contemplar los dominios de Supabase.
- El ADR-001 sigue vigente para la consola y el widget.
