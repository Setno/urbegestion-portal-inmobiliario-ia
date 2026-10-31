# Backlog

Estados: pendiente · en curso · en revisión · hecha · bloqueada · estacionada
Orden: contener → estabilizar → mejorar. Origen: AUDITORIA.md, `npm audit` y BLUEPRINT.

| ID | Historia | Prioridad | Tamaño | Estado | Depende de |
| --- | --- | --- | --- | --- | --- |
| H-001 | Agregar lint (ESLint) y script `npm run lint` | Alta | S | hecha | — |
| H-002 | Tests de caracterización de flujos críticos | Alta | M | hecha | — |
| H-003 | Actualizar dependencias con vulnerabilidades (`vite`, `postcss`, `source-map-js`) | Alta | S | hecha | H-002 |
| H-008 | Proyecto Supabase + esquema Core (tenants, usuarios, roles, RLS) y login real | Alta | M+ (dividir) | pendiente | decisión ADR-004 |
| H-009 | Leads y CRM en Supabase con evento `lead.created` entre Captación y CRM | Alta | M+ (dividir) | pendiente | H-008 |
| H-010 | Extraer textos de interfaz a archivos de traducción (es-419 e inglés) | Media | M+ (dividir) | pendiente | — |
| H-011 | Paquete de mercado Chile (UF, comunas, RUT, ley de datos) | Media | M | pendiente | H-010 |
| H-012 | Consentimiento y finalidad de datos en formularios (Ley 21.719) | Alta | M | pendiente | H-008 |
| H-014 | Archivar la sección de Instagram (decisión 2026-10-31: no va en primera instancia): mover a `_archivo/` con `LEEME.md` tras revisar qué código la referencia | Baja | S | pendiente | — |
| H-015 | Reducir la deuda de lint suprimida (45 variables sin usar, 10 hooks, 13 `any`) y vaciar `eslint-suppressions.json` | Media | M | pendiente | H-002 |
| H-016 | Ids únicos para leads y propiedades (hoy `Date.now()` puede repetirse en el mismo milisegundo y un cambio afecta a ambos) | Media | S | en revisión | H-002 |
| H-017 | Corregir el motor local del chat: la intención de crédito atrapaba mensajes con "propiedades" (contienen "pie") y la búsqueda combinaba comuna, tipo y operación con "o". Decisión 2026-10-31: el chat no evalúa crédito (lo hace el banco) y el simulador de dividendo queda apagado | Media | S | en revisión | H-002 |
| H-018 | Pruebas de `api/chat.ts` y `api/lead-webhook.ts` como parte de la suite (hoy solo se verificaron con scripts temporales que no se guardaron) | Alta | S | en revisión | H-002 |
| H-020 | Pruebas de pantallas del CRM (Kanban, filtros, ficha del lead, notas, exportación CSV) con Testing Library | Media | M | pendiente | H-002; hacerla antes de rediseñar el CRM |
| H-021 | Pruebas de pantallas de catálogo y captación (filtros, formulario de propiedades, chat, valorizador de 4 pasos, agenda) (el simulador de dividendo queda apagado, ver H-017) | Media | M | pendiente | H-002 |
| H-022 | Pruebas de la tienda de marca y de la pestaña de Identidad y Marca | Baja | S | pendiente | H-002 |
| H-025 | Exportación completa de los datos de una corredora (propiedades, contactos, notas) en CSV/JSON | Media | M | pendiente | H-008 |
| H-026 | Pasar el repositorio a monorepo: `apps/consola` (React + Vite) y `apps/sitio` (Next.js) con paquetes compartidos | Alta | M+ (dividir) | pendiente | ADR-006 |
| H-027 | Modelo de plantilla: datos del sitio en la base de datos y separación entre contenido y diseño | Alta | M+ (dividir) | pendiente | H-008, H-026 |
| H-028 | Plantilla 1: adaptar la landing actual (`src/site/`) al sitio Next.js | Alta | M | pendiente | H-027 |
| H-029 | Plantilla 2 y prueba de intercambio de plantilla sin perder datos | Media | M | pendiente | H-028 |
| H-030 | Dominio propio o subdominio por corredora: resolución por dominio y guía de registros DNS | Alta | M+ (dividir) | pendiente | H-027 |
| H-031 | SEO del sitio: fichas indexables, mapa del sitio y metadatos | Media | S | pendiente | H-028 |
| H-032 | Editor de datos del sitio para la corredora (logo, colores, textos, fotos; sin cambiar la estructura) | Alta | M+ (dividir) | pendiente | H-027, H-008 |
| H-033 | Planes y límites por plan (Completo y Solo herramientas) en el Core | Media | M | pendiente | H-008 |
| H-034 | Widget embebible y API pública para el plan Solo herramientas | Media | M+ (dividir) | pendiente | H-008, H-033 |
| H-035 | Editor de estructura del sitio (mover, agregar y quitar secciones) | Baja | M+ | fuera del MVP | H-032 |
| H-013 | Despliegue final: reactivar despliegues en `vercel.json`, cargar variables y smoke test | Alta | S | bloqueada hasta nuevo aviso | todas las fases |

## Estacionadas: seguridad y comprobaciones (revisar antes del despliegue)

Decisión del 2026-10-31: mientras no haya despliegue, el trabajo se centra en que cada funcionalidad funcione. Lo de seguridad y las comprobaciones de funcionamiento amplias se estaciona aquí y se revisa **completo antes de H-013** (despliegue final). Ninguna depende de otra historia de funcionalidad, salvo H-006 (necesita el login de H-008).

| ID | Historia | Prioridad | Tamaño | Estado | Depende de |
| --- | --- | --- | --- | --- | --- |
| H-004 | Cabeceras CSP y HSTS en `vercel.json` | Media | S | estacionada | — |
| H-005 | Límite de tasa y validación extra en `api/*` | Media | M | estacionada | — |
| H-006 | Reemplazar el "Modo Master" (PIN fijo y `?agency=true`) por control real | Media | S | estacionada (necesita auth, H-008) | H-008 |
| H-007 | Mover el token de Instagram al servidor (solo si Instagram se reactiva; hoy se archiva con H-014) | Media | S | estacionada | — |
| H-019 | Medir cobertura de pruebas (paquete adicional) y fijar un umbral mínimo en el CI | Media | S | estacionada | H-002 |
| H-023 | Prueba E2E con Playwright del flujo de negocio: un visitante deja sus datos y el lead aparece en el CRM | Media | M | estacionada | H-008 (con datos reales) |
| H-024 | Línea base de accesibilidad (axe) y rendimiento (Lighthouse) del sitio y la consola | Media | S | estacionada | — |

Las historias marcadas "dividir" se cortan con `metodo-apps:story-slicer` antes de empezar.

H-025 a H-035 salen de la decisión del 2026-10-30 de incluir el sitio con plantillas en el producto base (ADR-005 y ADR-006). H-004 (CSP y HSTS) debe contemplar los dominios de Supabase y de los sitios por corredora.

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
4. Dado el motor local del chat, cuando pregunto por "casas en Lo Barnechea", entonces recomienda la casa de esa comuna (y hoy también casas de otras comunas: bug conocido H-017).
5. Dado `webhookService`, cuando `/api/lead-webhook` responde 503 o 404, entonces el resultado es un fallo con mensaje claro y no una excepción.

**Notas técnicas:** requiere un framework de pruebas (Vitest + Testing Library). Usar `metodo-apps:qa-tester`.
**Fuera de alcance:** E2E con navegador.
**Tamaño:** M

**Resultado (2026-10-30):** ESLint 10 con typescript-eslint y react-hooks sobre `src/` y `api/`. Estado inicial: 57 errores y 12 advertencias (45 variables sin usar, 10 errores de hooks, 13 `any`, 1 dependencia de efecto). Los errores existentes se suprimieron con la línea base de ESLint (`eslint-suppressions.json`), de modo que `npm run lint` termina en 0 y cualquier error nuevo falla. Los 10 errores de hooks están todos en `InstagramPostModal`, que hoy no se usa en el sitio (H-014).

**Resultado (2026-10-30):** Vitest 5 + jsdom (sin Testing Library, no hay pruebas de pantallas). 40 pruebas en 5 archivos: `localStore` (6), tienda de leads (9), tienda de propiedades (5), motor local del chat (11) y `webhookService` (9). Comprobado con una mutación: al romper el guardado de notas fallan 2 pruebas. Bugs conocidos fijados y documentados en las pruebas: ids repetidos en el mismo milisegundo (H-016) y el motor del chat (H-017). **Lo que H-002 no cubre y dónde quedó registrado:** funciones de `api/` (H-018), medición de cobertura (H-019), pantallas del CRM (H-020), pantallas de catálogo y captación y cálculo hipotecario (H-021), tienda de marca (H-022), E2E (H-023) y accesibilidad/rendimiento (H-024). La sección de Instagram queda fuera a propósito (H-014: código sin uso). Mientras esas historias no existan, cualquier cambio en pantallas se prueba a mano en local.

## H-003 Dependencias vulnerables
`npm audit` (2026-10-30): 3 hallazgos, 2 altos (vite, source-map-js) y 1 moderado (postcss). Afectan al servidor de desarrollo y al compilador, no al sitio compilado. Actualizar tras H-002 y comprobar `build` y las pruebas.

**Resultado (2026-10-30):** `npm audit fix` sin `--force`; solo cambió `package-lock.json`: vite 6.4.3 → 6.4.5, postcss-selector-parser → 6.1.5 y source-map-js → 1.2.2 (todos cambios de parche). `npm audit`: 0 vulnerabilidades. Verificado: lint (0 errores), `tsc`, 40 pruebas, `build`, `npm ci --dry-run` y comprobación manual del sitio y de las 5 pestañas del panel en local. El bundle compilado no cambió de tamaño (420,75 kB). El CI ahora **falla** ante vulnerabilidades altas (antes era informativo).

## H-018 Pruebas de `api/`
**Resultado (2026-10-31):** 22 pruebas nuevas en `tests/api/` (14 de `chat`, 8 de `lead-webhook`), con `fetch` y variables de entorno simuladas; suite total: 62 pruebas. Viven en `tests/` y no junto al archivo porque Vercel convierte en función todo archivo dentro de `api/`. `vite.config.ts` ahora también ejecuta `tests/**/*.test.ts`. Verificado: tests, lint (0 errores), `tsc` y `build`. No se encontraron comportamientos incorrectos.

## H-016 y H-017 Ids únicos y motor local del chat
**Resultado (2026-10-31):** *H-016:* nuevo `src/core/utils/newId.ts` (`prefijo-fecha-aleatorio`); lo usan `useLeadStore` y `usePropertyStore`. Dos registros creados en el mismo milisegundo ya tienen ids distintos y cambiar uno no afecta al otro. *H-017:* la búsqueda del chat local exige que se cumpla todo lo que el usuario menciona (comuna, tipo y operación) y corrige el error de precedencia que traía todas las ventas con la palabra "venta"; "parcela/agrícola/campo" pasan a ser palabras de tipo y no de comuna. El chat ya no calcula crédito: ante dividendo, crédito, hipotecario, banco o pie, explica que lo evalúa el banco y ofrece contacto (`provide_contact`); se quitó el chip "Simular dividendo" y la mención al dividendo en las recomendaciones. La calculadora de la ficha de propiedad quedó detrás de `agencyConfig.features.mortgageSimulator` (apagado). El campo `mortgageStatus` del lead no se tocó. Pruebas: 69 (antes 62); los tres casos `BUG CONOCIDO` se convirtieron en pruebas del comportamiento correcto. Verificado: tests, lint (0 errores), `tsc`, `build` y chat y ficha revisados en el navegador.
