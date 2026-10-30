# ADR-001: Frontend en React + TypeScript + Vite con Tailwind y Zustand

- Estado: aceptada (retroactiva)
- Fecha: 2026-10-30

## Contexto
El proyecto nació como una landing de demostración para una corredora y necesitaba una interfaz rica (catálogo, chat, panel con gráficos), rápida de iterar y desplegable como sitio estático. Debe evolucionar a consola web y PWA móvil primero.

## Opciones consideradas
| Opción | A favor | En contra | Costo |
| --- | --- | --- | --- |
| React + Vite + Tailwind + Zustand (elegida) | Ya construido, ecosistema grande, build rápido, PWA posible | SPA: SEO limitado para sitios públicos | Bajo |
| Next.js | SEO y servidor integrados | Reescritura, más piezas | Medio |
| Sitio sin framework | Más simple | No sirve para un panel interactivo | Bajo |

## Decisión
Mantener React 18 + TypeScript + Vite 6 como base de la consola y el widget. Tailwind para estilos y Zustand para estado. Si el sitio propio con plantillas (v2) necesita SEO, se evalúa Next.js solo para esa pieza.

## Consecuencias
Se reutiliza el código actual. El SEO de fichas públicas queda como riesgo para la v2. Faltan lint y pruebas (H-001, H-002).
