# Portal Inmobiliario IA (landing-ventas)

Plataforma web para corredores de propiedades: sitio con catálogo, asistente de IA y consola de gestión de leads (CRM). Hoy es un prototipo de frontend para una corredora (UrbeGestión) que evoluciona hacia una plataforma SaaS multi-tenant (Captación, CRM, Gestión). PRD: docs/prd.md · Avance: docs/avance.md · Estado: docs/estado.md · Backlog: docs/backlog.md · Visión: `BLUEPRINT Inmobiliario.md` · Decisiones: DECISIONES.md y docs/adr/ · Mapa del código: ESTRUCTURA.md

Este proyecto sigue la metodología del plugin metodo-apps (modo adoptado).

## Stack
- Lenguaje / framework: TypeScript, React 18, Vite 6, Tailwind 3, Zustand, Recharts, Framer Motion.
- Base de datos: Supabase (PostgreSQL) para usuarios, corredoras, propiedades, leads y datos del sitio cuando hay `VITE_TENANT_ID`; sin él, los datos siguen en `localStorage` (`apps/consola/src/core/storage/localStore.ts`). Acceso a datos vía repositorios (`apps/consola/src/core/data/`). Ver docs/adr/004 y 007.
- Monorepo con espacios de trabajo de npm (ADR-010, H-026): la consola y sus funciones viven en `apps/consola`, el sitio en `apps/sitio`, y los paquetes compartidos en `packages/`; los comandos se ejecutan desde la raíz.
- Sitio público por corredora: Next.js en `apps/sitio` (ADR-006, ADR-011, ADR-012; plantilla clásica, catálogo, ficha con formulario de visita, SEO y una dirección por corredora hechos; falta el chat y el valorizador, H-028.4); la consola y el widget siguen en React + Vite.
- Avisos de leads (H-054): funciones de Supabase en `supabase/functions/` (Deno), que se despliegan aparte del código de Vercel; guía en `docs/guia-avisos.md`.
- Hosting: Vercel (SPA + funciones en `apps/consola/api/`; carpeta raíz del proyecto: `apps/consola`, y su `vercel.json` vive ahí). El sitio tiene su propio proyecto (`portal-inmobiliario-sitio`, carpeta raíz `apps/sitio`, que trae su `vercel.json` con los despliegues automáticos desactivados). Desde 2026-11-01 cada commit se despliega como *preview* (con variables de desarrollo) para probar en la web; producción no se toca sin orden explícita.

## Comandos (verificados el 2026-11-03)
| Acción | Comando |
| --- | --- |
| Instalar | `npm ci` (validado con `--dry-run`) |
| Correr el sitio en local | `npm run dev:sitio` → http://<subdominio>.localhost:3001 (lee `.env.local` de la raíz y necesita las claves de Supabase; la corredora sale de la dirección, ADR-012: en desarrollo existe el subdominio `urbe`. `SITIO_TENANT_ID` o `VITE_TENANT_ID` es opcional y se usa en `localhost` y en los previews; `SITIO_DOMINIO_BASE` es el dominio de la plataforma; `GHL_WEBHOOK_URL` es opcional y reenvía los leads. Si falla la conexión por certificado, usar `NODE_OPTIONS=--use-system-ca`, como en `.claude/launch.json`) |
| Build del sitio | `npm run build:sitio` |
| Correr en local | `npm run dev` → http://localhost:3000 (el panel admin pide iniciar sesión con Supabase; necesita `.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`; sin ellas el panel no aparece; con `VITE_TENANT_ID` (id de la corredora) leads y propiedades van a Supabase, sin él quedan en el navegador) |
| Tests rápidos | `npm test` (Vitest + jsdom, ~30 s); `npm run test:watch` para desarrollo |
| Suite completa | `npm test` (840 pruebas, incluidas las de pantalla (CRM, catálogo y captación) con Testing Library; sin cobertura medida aún) |
| Lint | `npm run lint` (0 errores y 0 avisos; sin deuda suprimida, H-015) |
| Tipos | `npx tsc --noEmit` |
| Build | `npm run build` (ejecuta `tsc && vite build` en `apps/consola`; el resultado queda en `apps/consola/dist`) |
| Probar producción local | `npm run preview` → http://localhost:4173 (el panel admin aparece solo si hay claves de Supabase y siempre pide login) |
| E2E | no existen |
| Verificar Supabase | `npm run verificar:supabase` (imprime solo estados, nunca claves) |

Las rutas `api/*` no existen bajo `npm run dev`; requieren `vercel dev` o un despliegue (el chat cae al motor local y el webhook responde "sin conexión").

## Convenciones (observadas en el código)
- Estructura, dentro de `apps/consola/`: `src/core` (config, marca, almacenamiento, consola admin), `src/modules/{captacion,crm,catalogo}` con `components/ stores/ types/ services/ data/`, `src/site` (landing). Paquetes compartidos en `packages/`: `plataforma` (contrato con ventas), `mercados` (datos de Chile), `dinero` y `sitio-datos` (datos públicos del sitio). Detalle en ESTRUCTURA.md.
- Nombres: componentes en PascalCase, tiendas `useXStore`, tipos en `types/`, textos de interfaz en español escritos en el código (pendiente i18n, H-010).
- Estado: tiendas Zustand que persisten vía `createLocalStore`; ningún componente debe llamar a `localStorage` directo para datos de negocio.
- Manejo de errores: `try/catch` con `console.warn` y degradación silenciosa (por ejemplo, el chat cae al motor local si falla el LLM).
- Secretos: nunca en el cliente. Las claves viven en variables de entorno del servidor (`api/*`); las `VITE_*` son públicas.
- Tests: un `*.test.ts` junto al módulo, nombres que describen el comportamiento. Las pruebas de caracterización fijan lo que el código hace hoy; los comportamientos incorrectos se marcan `BUG CONOCIDO` y se corrigen en su propia historia (no cambiar la prueba para esconderlos).

## Reglas de este proyecto (pedidas por el usuario)
- El usuario tiene conocimientos bajos de programación y es ingeniero civil y de procesos: explicar en español claro, sin jerga innecesaria, y dar pasos concretos para probar.
- **Commits** al cerrar cada historia con suite, tipos, lint y build en verde; no se pide autorización por commit (orden del 2026-11-01).
- **Cada commit local se sube también a GitHub** (`origin`). Nunca force push.
- **Cada commit se despliega en Vercel como preview** (no producción), a mano; `apps/consola/vercel.json` mantiene desactivados los despliegues automáticos desde Git. Producción solo con orden explícita.
- **No mezclar versiones antiguas con nuevas**: lo desechado va a `_archivo/` (ignorado por git, con su `LEEME.md`), no se commitea ni se sube.
- `BLUEPRINT Inmobiliario.md` es del usuario: no se versiona sin permiso.
- **Avance:** al cerrar cada historia se actualiza `docs/avance.md` y se informa al usuario el porcentaje hacia el MVP.

## Definición de terminado
Criterios de aceptación con tests que pasan; suite, lint, tipos y build en verde (hoy: lint, tipos, tests y build); revisión del subagente sin bloqueantes; sin secretos ni datos reales; PR o rama con evidencia.

## Prohibido
- Modificar migraciones ya aplicadas; crear una nueva.
- Desactivar, saltar o borrar tests sin aprobación.
- Instalar paquetes sin justificar y verificar que existen y se mantienen.
- Leer o imprimir `.env` o credenciales.
- Desplegar a producción sin confirmación explícita.
- Cambiar `apps/consola/src/modules/crm`, `apps/consola/src/modules/captacion`, `apps/consola/src/modules/catalogo/stores` o `apps/consola/src/core/storage` sin que `npm test` esté en verde.

## Flujo
Explorar → plan (aprobado) → test que falla → implementar → verificar → revisión → rama + commit + push → unión a main con aprobación.

## Lecciones aprendidas
- Los scripts de edición masiva deben ser idempotentes y no re-copiar respaldos (se pisó una copia una vez); verificar `git status` antes de commitear (un `git add` fallido dejó un commit incompleto).
- Las rutas nuevas aún sin versionar no se pueden mover con `git mv`.
- Una carpeta recién movida puede quedar en un estado de OneDrive que Node ve como acceso directo, y `eslint .` la omite sin avisar: pasó de 157 a 20 archivos revisados, en verde. Por eso `npm run lint` nombra cada carpeta de código; cada carpeta nueva se agrega ahí, y al mover carpetas se compara la cantidad de archivos revisados.
- El bloqueo de despliegues automáticos vive en `apps/consola/vercel.json` y solo rige si la carpeta raíz de Vercel apunta ahí: si no coinciden al hacer push, Vercel despliega solo, y en `main` sería producción (ADR-010).
- Las pruebas no detectan si una función de `api/` arranca en Vercel: importar sin extensión `.js`, o un paquete por nombre (`@portal/...`), funciona en Vitest y la tumba al desplegar (H-046, ADR-010). Las funciones importan los paquetes por ruta relativa; tras desplegar, llamarlas.
