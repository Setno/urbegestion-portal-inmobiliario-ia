# Traspaso a la sesión del monorepo (H-026)

Para quien abre la sesión nueva. Escrito el 2026-11-01 al cerrar la sesión anterior. Estado del repositorio al cierre: `main` limpio, último commit `3af13fc`, 604 pruebas, tipos, lint y build en verde, preview en Vercel al día.

## Texto para pegar al abrir la sesión

> Vamos a empezar H-026: pasar el repositorio a monorepo (ADR-006). Lee primero `CLAUDE.md`, `docs/adr/006-sitio-publico-con-nextjs.md`, `docs/backlog.md` (H-026 a H-032), `docs/estado.md`, `ESTRUCTURA.md` y `docs/traspaso-monorepo.md`. Reglas de esta sesión: (1) trabajar en una rama aparte (`monorepo`), sin unir a `main` hasta que el preview se vea y funcione igual que hoy y yo lo apruebe; (2) **no mover ni cambiar nada todavía**: tu primera entrega es un plan por etapas, cada una con su criterio de "terminado" y cómo revertirla, para que lo revisemos juntos; (3) esta historia es solo la reorganización técnica, sin cambiar lo que hace el producto; el sitio por corredora con plantillas (H-027 en adelante) viene después; (4) explícame en español claro y dame pasos concretos para probar, que no programo.

## Lo que hay que saber del estado actual
- **Una sola aplicación** React 18 + Vite 6 + Tailwind 3 + Zustand, con las rutas `api/` de Vercel (funciones del servidor) en la raíz. El paquete se llama `urbegestion-real-estate-ai`.
- **Código** en `src/`: `core` (admin, auth, brand, config, data, events, export, i18n, market, money, platform, privacy, storage, ui, utils), `modules/{captacion,crm,catalogo}`, `markets/cl` y `site` (la landing). Mapa en `ESTRUCTURA.md`.
- **Pruebas:** Vitest + jsdom; incluyen `src/**`, `tests/**` y `api/**` (`vite.config.ts`). Hay también pruebas SQL en `supabase/tests/`, que se ejecutan a mano contra el Supabase de desarrollo.
- **Despliegue:** Vercel, con despliegue automático desde Git **desactivado** (`vercel.json`); los previews se crean a mano con la integración de Vercel. Cada commit debe tener su preview. Producción no se toca sin orden explícita.
- **Supabase:** migraciones en `supabase/migrations/` (no se modifican las ya aplicadas; una nueva requiere aprobación). Proyecto de desarrollo en la memoria (`reference_supabase_dev_conector`).
- **Lint:** 0 errores y 0 avisos, `eslint-suppressions.json` vacío; hay que mantenerlo así.
- **Variables de entorno:** `VITE_*` son públicas; las claves de servidor viven solo en Vercel. No leer ni imprimir `.env`.

## Cosas delicadas al mover
- Las funciones de `api/` importan código de `src/core/platform/contract.ts` y `syncProtocol.ts`; si `api/` y `src/` terminan en carpetas distintas, esas importaciones deben seguir funcionando en Vercel. Hay que decidir de qué paquete compartido salen.
- `src/core/platform/contract.test.ts` y otros leen documentos de `docs/` con `?raw`; revisar sus rutas si cambia la estructura.
- Los alias, `tsconfig`, Tailwind (`content`), PostCSS y `vite.config.ts` apuntan a `src/`; cada app tendrá los suyos.
- El `vercel.json` de la raíz (cabeceras, reescrituras, `deploymentEnabled: false`) debe seguir aplicando al despliegue de la consola. Un segundo despliegue para `apps/sitio` es una decisión aparte.
- `CLAUDE.md`, `ESTRUCTURA.md` y las tablas de comandos hay que actualizarlos al final de cada etapa, con comandos reales verificados.
- Reglas de CLAUDE.md que aplican al mover: no cambiar `src/modules/crm`, `src/modules/captacion`, `src/modules/catalogo/stores` ni `src/core/storage` sin la suite en verde; no desactivar ni borrar pruebas; no instalar paquetes sin justificar; lo desechado va a `_archivo/` (ignorado por git) y no se sube.
- Las rutas nuevas aún sin versionar no se pueden mover con `git mv`.

## Preguntas que el plan debe responder (y llevar al responsable)
1. ¿Qué administrador de paquetes y qué herramienta de monorepo (por ejemplo, espacios de trabajo de npm, con o sin una herramienta de caché)? Justificar y verificar que existe y se mantiene.
2. ¿Qué va a `packages/`? Candidatos: textos y paquete de mercado (`i18n`, `markets`), dinero (`money`), contrato de plataforma (`platform`), diseño (`ui`). Decidir el corte antes de mover.
3. ¿Dónde viven las funciones `api/` (con la consola, o aparte)?
4. ¿Cómo se despliega cada app en Vercel y cómo se hacen los previews con dos apps?
5. ¿En cuántas etapas se hace para que cada una deje el sitio funcionando? Propuesta de partida: (a) reorganizar sin cambiar nada, solo mover la consola a `apps/consola`; (b) extraer paquetes compartidos uno por uno; (c) recién después crear `apps/sitio` vacío con Next.js. Verificar y ajustar.

## Fuera de alcance de esta sesión
- Plantillas y editor del sitio (H-027 a H-032), dominios por corredora (H-030), SEO (H-031).
- Traducciones restantes del panel (estacionadas), alta de corredoras desde ventas (H-043.3), claves de la conexión con ventas (pendientes del responsable; ver `docs/pendientes-proyecto-ventas.md`).
- Despliegue a producción y las historias de seguridad estacionadas (H-004, H-005, H-007, H-019, H-023, H-024): se revisan antes de H-013.

## Cierre esperado de la sesión
Rama `monorepo` con lo que se haya aprobado, suite, tipos, lint y build en verde, preview funcionando igual que `main`, documentos actualizados y una nota en `docs/estado.md` de dónde quedó. Unir a `main` solo con aprobación explícita.
