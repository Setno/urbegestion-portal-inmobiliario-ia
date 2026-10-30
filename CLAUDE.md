# Portal Inmobiliario IA (landing-ventas)

Plataforma web para corredores de propiedades: sitio con catálogo, asistente de IA y consola de gestión de leads (CRM). Hoy es un prototipo de frontend para una corredora (UrbeGestión) que evoluciona hacia una plataforma SaaS multi-tenant (Captación, CRM, Gestión). PRD: docs/prd.md · Estado: docs/estado.md · Backlog: docs/backlog.md · Visión: `BLUEPRINT Inmobiliario.md` · Decisiones: DECISIONES.md y docs/adr/ · Mapa del código: ESTRUCTURA.md

Este proyecto sigue la metodología del plugin metodo-apps (modo adoptado).

## Stack
- Lenguaje / framework: TypeScript, React 18, Vite 6, Tailwind 3, Zustand, Recharts, Framer Motion.
- Base de datos: ninguna todavía (datos en `localStorage` mediante `src/core/storage/localStore.ts`). Destino decidido: Supabase (PostgreSQL), ver docs/adr/004.
- Hosting: Vercel (SPA + funciones en `api/`). **No hay despliegue hasta nuevo aviso**; solo habrá uno final.

## Comandos (verificados el 2026-10-30)
| Acción | Comando |
| --- | --- |
| Instalar | `npm ci` (validado con `--dry-run`) |
| Correr en local | `npm run dev` → http://localhost:3000 (panel admin habilitado solo en dev) |
| Tests rápidos | no existen aún (historia H-002) |
| Suite completa | no existe aún (H-002) |
| Lint | `npm run lint` (0 errores; la deuda previa está suprimida en `eslint-suppressions.json`, ver H-015) |
| Tipos | `npx tsc --noEmit` |
| Build | `npm run build` (ejecuta `tsc && vite build`) |
| Probar producción local | `npm run preview` → http://localhost:4173 (el panel admin no debe aparecer) |
| E2E | no existen |

Las rutas `api/*` no existen bajo `npm run dev`; requieren `vercel dev` o un despliegue (el chat cae al motor local y el webhook responde "sin conexión").

## Convenciones (observadas en el código)
- Estructura: `src/core` (config, marca, almacenamiento, consola admin), `src/modules/{captacion,crm,catalogo}` con `components/ stores/ types/ services/ data/`, `src/markets/cl` (datos de Chile), `src/site` (landing). Detalle en ESTRUCTURA.md.
- Nombres: componentes en PascalCase, tiendas `useXStore`, tipos en `types/`, textos de interfaz en español escritos en el código (pendiente i18n, H-010).
- Estado: tiendas Zustand que persisten vía `createLocalStore`; ningún componente debe llamar a `localStorage` directo para datos de negocio.
- Manejo de errores: `try/catch` con `console.warn` y degradación silenciosa (por ejemplo, el chat cae al motor local si falla el LLM).
- Secretos: nunca en el cliente. Las claves viven en variables de entorno del servidor (`api/*`); las `VITE_*` son públicas.
- Tests: un archivo de test por módulo, nombres que describen el comportamiento (aún sin framework).

## Reglas de este proyecto (pedidas por el usuario)
- El usuario tiene conocimientos bajos de programación y es ingeniero civil y de procesos: explicar en español claro, sin jerga innecesaria, y dar pasos concretos para probar.
- **Commits** solo al cerrar una fase grande, y antes se prueba en local (`npm run dev`, `npm run build` + `npm run preview`) y el usuario da el visto bueno.
- **Cada commit local se sube también a GitHub** (`origin`). Nunca force push.
- **No desplegar en Vercel** hasta orden explícita; `vercel.json` desactiva los despliegues automáticos desde Git.
- **No mezclar versiones antiguas con nuevas**: lo desechado va a `_archivo/` (ignorado por git, con su `LEEME.md`), no se commitea ni se sube.
- `BLUEPRINT Inmobiliario.md` es del usuario: no se versiona sin permiso.

## Definición de terminado
Criterios de aceptación con tests que pasan; suite, lint, tipos y build en verde (hoy: tipos y build); revisión del subagente sin bloqueantes; sin secretos ni datos reales; PR o rama con evidencia.

## Prohibido
- Modificar migraciones ya aplicadas; crear una nueva.
- Desactivar, saltar o borrar tests sin aprobación.
- Instalar paquetes sin justificar y verificar que existen y se mantienen.
- Leer o imprimir `.env` o credenciales.
- Desplegar a producción sin confirmación explícita.
- Tocar `src/modules/crm`, `src/modules/captacion` o `src/core/storage` sin tests de caracterización (H-002) cuando existan.

## Flujo
Explorar → plan (aprobado) → test que falla → implementar → verificar → revisión → rama + commit + push → unión a main con aprobación.

## Lecciones aprendidas
- Los scripts de edición masiva deben ser idempotentes y no re-copiar respaldos (se pisó una copia una vez); verificar `git status` antes de commitear (un `git add` fallido dejó un commit incompleto).
- Las rutas nuevas aún sin versionar no se pueden mover con `git mv`.
