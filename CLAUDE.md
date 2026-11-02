# Portal Inmobiliario IA (landing-ventas)

Plataforma web para corredores de propiedades: sitio con catálogo, asistente de IA y consola de gestión de leads (CRM). Hoy es un prototipo de frontend para una corredora (UrbeGestión) que evoluciona hacia una plataforma SaaS multi-tenant (Captación, CRM, Gestión). PRD: docs/prd.md · Estado: docs/estado.md · Backlog: docs/backlog.md · Visión: `BLUEPRINT Inmobiliario.md` · Decisiones: DECISIONES.md y docs/adr/ · Mapa del código: ESTRUCTURA.md

Este proyecto sigue la metodología del plugin metodo-apps (modo adoptado).

## Stack
- Lenguaje / framework: TypeScript, React 18, Vite 6, Tailwind 3, Zustand, Recharts, Framer Motion.
- Base de datos: Supabase (PostgreSQL) para usuarios, corredoras, propiedades y leads cuando hay `VITE_TENANT_ID`; sin él, los datos siguen en `localStorage` (`src/core/storage/localStore.ts`). Acceso a datos vía repositorios (`src/core/data/`). Ver docs/adr/004 y 007.
- Sitio público por corredora (decidido, sin implementar): Next.js, ver docs/adr/006; la consola y el widget siguen en React + Vite.
- Hosting: Vercel (SPA + funciones en `api/`). Desde 2026-11-01 cada commit se despliega como *preview* (con variables de desarrollo) para probar en la web; producción no se toca sin orden explícita.

## Comandos (verificados el 2026-10-30)
| Acción | Comando |
| --- | --- |
| Instalar | `npm ci` (validado con `--dry-run`) |
| Correr en local | `npm run dev` → http://localhost:3000 (el panel admin pide iniciar sesión con Supabase; necesita `.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`; sin ellas el panel no aparece; con `VITE_TENANT_ID` (id de la corredora) leads y propiedades van a Supabase, sin él quedan en el navegador) |
| Tests rápidos | `npm test` (Vitest + jsdom, ~3 s); `npm run test:watch` para desarrollo |
| Suite completa | `npm test` (578 pruebas, incluidas las de pantalla (CRM, catálogo y captación) con Testing Library; sin cobertura medida aún) |
| Lint | `npm run lint` (0 errores y 0 avisos; sin deuda suprimida, H-015) |
| Tipos | `npx tsc --noEmit` |
| Build | `npm run build` (ejecuta `tsc && vite build`) |
| Probar producción local | `npm run preview` → http://localhost:4173 (el panel admin aparece solo si hay claves de Supabase y siempre pide login) |
| E2E | no existen |
| Verificar Supabase | `npm run verificar:supabase` (imprime solo estados, nunca claves) |

Las rutas `api/*` no existen bajo `npm run dev`; requieren `vercel dev` o un despliegue (el chat cae al motor local y el webhook responde "sin conexión").

## Convenciones (observadas en el código)
- Estructura: `src/core` (config, marca, almacenamiento, consola admin), `src/modules/{captacion,crm,catalogo}` con `components/ stores/ types/ services/ data/`, `src/markets/cl` (datos de Chile), `src/site` (landing). Detalle en ESTRUCTURA.md.
- Nombres: componentes en PascalCase, tiendas `useXStore`, tipos en `types/`, textos de interfaz en español escritos en el código (pendiente i18n, H-010).
- Estado: tiendas Zustand que persisten vía `createLocalStore`; ningún componente debe llamar a `localStorage` directo para datos de negocio.
- Manejo de errores: `try/catch` con `console.warn` y degradación silenciosa (por ejemplo, el chat cae al motor local si falla el LLM).
- Secretos: nunca en el cliente. Las claves viven en variables de entorno del servidor (`api/*`); las `VITE_*` son públicas.
- Tests: un `*.test.ts` junto al módulo, nombres que describen el comportamiento. Las pruebas de caracterización fijan lo que el código hace hoy; los comportamientos incorrectos se marcan `BUG CONOCIDO` y se corrigen en su propia historia (no cambiar la prueba para esconderlos).

## Reglas de este proyecto (pedidas por el usuario)
- El usuario tiene conocimientos bajos de programación y es ingeniero civil y de procesos: explicar en español claro, sin jerga innecesaria, y dar pasos concretos para probar.
- **Commits** al cerrar cada historia con suite, tipos, lint y build en verde; no se pide autorización por commit (orden del 2026-11-01).
- **Cada commit local se sube también a GitHub** (`origin`). Nunca force push.
- **Cada commit se despliega en Vercel como preview** (no producción), a mano; `vercel.json` mantiene desactivados los despliegues automáticos desde Git. Producción solo con orden explícita.
- **No mezclar versiones antiguas con nuevas**: lo desechado va a `_archivo/` (ignorado por git, con su `LEEME.md`), no se commitea ni se sube.
- `BLUEPRINT Inmobiliario.md` es del usuario: no se versiona sin permiso.

## Definición de terminado
Criterios de aceptación con tests que pasan; suite, lint, tipos y build en verde (hoy: lint, tipos, tests y build); revisión del subagente sin bloqueantes; sin secretos ni datos reales; PR o rama con evidencia.

## Prohibido
- Modificar migraciones ya aplicadas; crear una nueva.
- Desactivar, saltar o borrar tests sin aprobación.
- Instalar paquetes sin justificar y verificar que existen y se mantienen.
- Leer o imprimir `.env` o credenciales.
- Desplegar a producción sin confirmación explícita.
- Cambiar `src/modules/crm`, `src/modules/captacion`, `src/modules/catalogo/stores` o `src/core/storage` sin que `npm test` esté en verde.

## Flujo
Explorar → plan (aprobado) → test que falla → implementar → verificar → revisión → rama + commit + push → unión a main con aprobación.

## Lecciones aprendidas
- Los scripts de edición masiva deben ser idempotentes y no re-copiar respaldos (se pisó una copia una vez); verificar `git status` antes de commitear (un `git add` fallido dejó un commit incompleto).
- Las rutas nuevas aún sin versionar no se pueden mover con `git mv`.
