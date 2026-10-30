# Backlog

Estados: pendiente · en curso · en revisión · hecha · bloqueada
Orden: contener → estabilizar → mejorar. Origen: AUDITORIA.md, `npm audit` y BLUEPRINT.

| ID | Historia | Prioridad | Tamaño | Estado | Depende de |
| --- | --- | --- | --- | --- | --- |
| H-001 | Agregar lint (ESLint) y script `npm run lint` | Alta | S | en revisión | — |
| H-002 | Tests de caracterización de flujos críticos | Alta | M | pendiente | — |
| H-003 | Actualizar dependencias con vulnerabilidades (`vite`, `postcss`, `source-map-js`) | Alta | S | pendiente | H-002 |
| H-004 | Cabeceras CSP y HSTS en `vercel.json` | Media | S | pendiente | — |
| H-005 | Límite de tasa y validación extra en `api/*` | Media | M | pendiente | — |
| H-006 | Reemplazar el "Modo Master" (PIN fijo y `?agency=true`) por control real | Media | S | bloqueada (necesita auth, H-008) | H-008 |
| H-007 | Mover el token de Instagram al servidor | Media | S | pendiente | — |
| H-008 | Proyecto Supabase + esquema Core (tenants, usuarios, roles, RLS) y login real | Alta | M+ (dividir) | pendiente | decisión ADR-004 |
| H-009 | Leads y CRM en Supabase con evento `lead.created` entre Captación y CRM | Alta | M+ (dividir) | pendiente | H-008 |
| H-010 | Extraer textos de interfaz a archivos de traducción (es-419 e inglés) | Media | M+ (dividir) | pendiente | — |
| H-011 | Paquete de mercado Chile (UF, comunas, RUT, ley de datos) | Media | M | pendiente | H-010 |
| H-012 | Consentimiento y finalidad de datos en formularios (Ley 21.719) | Alta | M | pendiente | H-008 |
| H-014 | Decidir qué hacer con la sección de Instagram (sin uso en el sitio): activarla o archivarla; si se activa, corregir los hooks de `InstagramPostModal` | Baja | S | pendiente | — |
| H-015 | Reducir la deuda de lint suprimida (45 variables sin usar, 10 hooks, 13 `any`) y vaciar `eslint-suppressions.json` | Media | M | pendiente | H-002 |
| H-013 | Despliegue final: reactivar despliegues en `vercel.json`, cargar variables y smoke test | Alta | S | bloqueada hasta nuevo aviso | todas las fases |

Las historias marcadas "dividir" se cortan con `metodo-apps:story-slicer` antes de empezar.

---

## H-001 Lint
**Como** desarrollador **quiero** un comando de lint **para** detectar errores de estilo y de lógica antes de commitear.

**Criterios de aceptación**
1. Dado el repositorio, cuando ejecuto `npm run lint`, entonces corre ESLint sobre `src/` y `api/` y termina con código 0 en el estado actual (reglas ajustadas o hallazgos documentados).
2. Dado un archivo con una variable sin usar y la regla activa, cuando ejecuto el lint, entonces falla con el archivo y la línea.
3. Dado el CI, cuando corre en una rama, entonces ejecuta el lint.

**Notas técnicas:** requiere instalar ESLint y plugins de React/TypeScript; justificar y verificar versiones antes de instalar.
**Fuera de alcance:** reformatear todo el código.
**Tamaño:** S

## H-002 Tests de caracterización
**Como** desarrollador **quiero** pruebas que fijen el comportamiento actual **para** refactorizar sin romper el CRM.

**Criterios de aceptación**
1. Dado `localStore`, cuando guardo, cargo y borro un valor y cuando el contenido está corrupto, entonces devuelve lo guardado, `null` tras borrar y `null` ante datos corruptos sin lanzar error.
2. Dado la tienda de leads, cuando agrego un lead, cambio su estado y agrego una nota, entonces la lista y el almacenamiento reflejan los tres cambios (la nota debe verse sin recargar).
3. Dado la tienda de propiedades, cuando agrego, edito y borro, entonces el almacenamiento queda consistente.
4. Dado el motor local del chat, cuando pregunto por "casas en Lo Barnechea", entonces recomienda solo propiedades de esa comuna.
5. Dado `webhookService`, cuando `/api/lead-webhook` responde 503 o 404, entonces el resultado es un fallo con mensaje claro y no una excepción.

**Notas técnicas:** requiere un framework de pruebas (Vitest + Testing Library). Usar `metodo-apps:qa-tester`.
**Fuera de alcance:** E2E con navegador.
**Tamaño:** M

**Resultado (2026-10-30):** ESLint 10 con typescript-eslint y react-hooks sobre `src/` y `api/`. Estado inicial: 57 errores y 12 advertencias (45 variables sin usar, 10 errores de hooks, 13 `any`, 1 dependencia de efecto). Los errores existentes se suprimieron con la línea base de ESLint (`eslint-suppressions.json`), de modo que `npm run lint` termina en 0 y cualquier error nuevo falla. Los 10 errores de hooks están todos en `InstagramPostModal`, que hoy no se usa en el sitio (H-014).

## H-003 Dependencias vulnerables
`npm audit` (2026-10-30): 3 hallazgos, 2 altos (vite, source-map-js) y 1 moderado (postcss). Afectan al servidor de desarrollo y al compilador, no al sitio compilado. Actualizar tras H-002 y comprobar `build` y las pruebas.
