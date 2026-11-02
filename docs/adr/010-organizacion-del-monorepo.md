# ADR-010: Organización del monorepo

- Estado: aceptada (plan aprobado por el responsable el 2026-11-02)
- Fecha: 2026-11-02
- Precisa: ADR-006

## Contexto
ADR-006 decidió pasar a monorepo con `apps/sitio`, `apps/consola` y paquetes compartidos, sin fijar herramientas ni el corte de paquetes. El cambio no debe alterar lo que hace el producto, y el preview tiene que seguir funcionando al terminar cada etapa. El proyecto de Vercel tiene un solo ajuste de carpeta raíz, compartido por todas las ramas.

## Opciones consideradas
| Opción | A favor | En contra | Costo |
| --- | --- | --- | --- |
| Espacios de trabajo de npm, sin más herramientas (elegida) | Ya está en uso, sin paquetes nuevos, Vercel lo reconoce | Sin caché de tareas | Bajo |
| npm con Turborepo | Caché y orden de tareas | Otra herramienta que aprender; hoy las pruebas tardan 31 s y el build 14 s | Medio |
| Cambiar a pnpm | Instalación más estricta | Rehace el archivo de versiones y la instalación en Vercel, sin beneficio hoy | Medio |

## Decisión
- **Herramienta:** espacios de trabajo de npm. Turborepo se puede agregar después sin rehacer nada, cuando el tiempo de build o de CI lo justifique.
- **Paquetes ahora:** `@portal/plataforma` (`contract.ts` y `syncProtocol.ts`), `@portal/mercados` (`src/markets`) y `@portal/dinero` (`src/core/money`, sin `currentRates`, que se queda en la consola porque lee la configuración de la corredora).
- **Paquetes después (H-028, cuando el sitio los necesite):** textos (`i18n`) y diseño (`ui`), hoy atados a la tienda de mercado, al inicio de sesión y al panel.
- **Funciones `api/`:** terminan en `apps/consola/api`. Sus direcciones `/api/...` no cambian, así que el proyecto de ventas no tiene que tocar nada. Importan los paquetes por ruta relativa con extensión `.js` (por ejemplo `../../../packages/plataforma/src/contract.js` desde `apps/consola/api/`), nunca por nombre: se probó `@portal/plataforma/contract` en un preview y la función se cae, porque Vercel solo compila lo que se importa por ruta relativa. Lo vigila `tests/api/vercel-imports.test.ts`.
- **Vercel:** un proyecto por aplicación. La consola conserva `portal-inmobiliario-ia`, con sus direcciones y variables, y carpeta raíz `apps/consola`. El sitio tendrá proyecto propio cuando haya algo que mostrar (H-027 o H-028). Los previews siguen siendo a mano, uno por cada aplicación que cambió.
- **Etapas:** 0 línea base; 1 mover la consola; 2 extraer paquetes uno por uno; 3 mover `api/` y cambiar la carpeta raíz en Vercel; 4 crear `apps/sitio` vacío. Cada etapa es reversible con `git revert`; `main` no cambia hasta la aprobación del responsable. Criterios en `docs/monorepo-linea-base.md`.

## Consecuencias
- Los comandos habituales se siguen ejecutando desde la raíz, y `.env.local` se queda donde está.
- Mientras la carpeta raíz de Vercel apunte a `apps/consola` (etapa 3) y la rama no esté unida, no se pueden crear previews nuevos de `main`; los ya creados siguen funcionando. El ajuste se revierte con un clic.
- El bloqueo de despliegues automáticos (`git.deploymentEnabled: false`) solo rige si Vercel encuentra `vercel.json` en la carpeta raíz configurada. El 2026-11-02 se subió el commit que lo movía antes de cambiar el ajuste y hubo un despliegue automático de la rama, que falló sin efecto. En `main` ese despliegue sería de producción: el `vercel.json` y la carpeta raíz deben coincidir antes de cualquier push. Para revertir la unión, primero se devuelve la carpeta raíz a la raíz del repositorio y después se sube el revert.
- Tailwind y el lint pueden dejar de ver archivos sin dar error al cambiar las rutas, así que cada etapa compara el CSS generado y las reglas activas con la línea base.
