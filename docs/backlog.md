# Backlog

Estados: pendiente · en curso · en revisión · hecha · bloqueada · estacionada
Orden: contener → estabilizar → mejorar. Origen: AUDITORIA.md, `npm audit` y BLUEPRINT.

| ID | Historia | Prioridad | Tamaño | Estado | Depende de |
| --- | --- | --- | --- | --- | --- |
| H-001 | Agregar lint (ESLint) y script `npm run lint` | Alta | S | hecha | — |
| H-002 | Tests de caracterización de flujos críticos | Alta | M | hecha | — |
| H-003 | Actualizar dependencias con vulnerabilidades (`vite`, `postcss`, `source-map-js`) | Alta | S | hecha | H-002 |
| H-008 | Proyecto Supabase + esquema Core (tenants, usuarios, roles, RLS) y login real | Alta | M+ | dividida en H-008.1 a H-008.7 | decisión ADR-004 |
| H-008.1 | Spike: dónde corre Supabase en desarrollo (nube gratuita o local con Docker), cómo se guardan las claves y cómo se manejan las migraciones; resultado: ADR-007 | Alta (Must) | S | hecha | ADR-004 |
| H-008.2 | Login real del panel: ingresar con correo y clave, cerrar sesión, y panel visible solo con sesión | Alta (Must) | M | hecha | H-008.1 |
| H-008.3 | Corredora (tenant) y rol: cada usuario pertenece a una corredora con un rol y el panel lo muestra; aislamiento entre corredoras con RLS | Alta (Must) | M | hecha | H-008.2 |
| H-008.4 | Permisos por rol en el panel: administrador ve todo; agente no ve Integraciones ni Identidad y Marca | Media (Should) | S | hecha | H-008.3 |
| H-008.5 | El administrador invita a un agente por correo a su corredora | Media (Should) | M | hecha | H-008.3 |
| H-008.6 | Recuperar contraseña por correo | Baja (Should) | S | hecha | H-008.2 |
| H-008.7 | Alta de una corredora nueva con su primer administrador (onboarding de tenant) | Baja (Could) | M | hecha | H-008.3 |
| H-009.1 | Capa de datos con repositorios: las tiendas de leads y propiedades pasan por un repositorio (local o Supabase); sin Supabase configurado todo sigue como hoy | Alta (Must) | S | en revisión | H-008 |
| H-009.2 | Propiedades en Supabase: catálogo público leído de la base, panel de propiedades guarda por corredora | Alta (Must) | M | en revisión | H-009.1 |
| H-009.3 | Leads en Supabase: el sitio crea leads en la corredora, el panel los ve y gestiona solo si es de esa corredora | Alta (Must) | M | en revisión | H-009.1 |
| H-009.4 | Evento `lead.created` entre Captación y CRM (Captación deja de importar el almacén de CRM) | Media (Should) | S | hecha | H-009.3 |
| H-009.5 | Imágenes de propiedades en Supabase Storage (hoy se guardan como texto base64) | Media (Should) | M | hecha | H-009.2 |
| H-010 | Extraer textos de interfaz a archivos de traducción (es-419 e inglés) | Media | M+ (dividir) | pendiente | — |
| H-011 | Paquete de mercado Chile (UF, comunas, RUT, ley de datos) | Media | M | pendiente | H-010 |
| H-012 | Consentimiento y finalidad de datos en formularios (Ley 21.719) | Alta | M | hecha | H-008 |
| H-014 | Archivar la sección de Instagram (decisión 2026-10-31: no va en primera instancia): mover a `_archivo/` con `LEEME.md` tras revisar qué código la referencia | Baja | S | hecha | — |
| H-015 | Reducir la deuda de lint suprimida (los 10 errores de hooks desaparecieron al archivar Instagram en H-014; el resto está en `eslint-suppressions.json`) y vaciar `eslint-suppressions.json` | Media | M | pendiente | H-002 |
| H-016 | Ids únicos para leads y propiedades (hoy `Date.now()` puede repetirse en el mismo milisegundo y un cambio afecta a ambos) | Media | S | hecha | H-002 |
| H-017 | Corregir el motor local del chat: la intención de crédito atrapaba mensajes con "propiedades" (contienen "pie") y la búsqueda combinaba comuna, tipo y operación con "o". Decisión 2026-10-31: el chat no evalúa crédito (lo hace el banco) y el simulador de dividendo queda apagado | Media | S | hecha | H-002 |
| H-018 | Pruebas de `api/chat.ts` y `api/lead-webhook.ts` como parte de la suite (hoy solo se verificaron con scripts temporales que no se guardaron) | Alta | S | hecha | H-002 |
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
| H-036 | Portal de plataforma (dueño del producto): vista aparte de la consola de corredoras para ver cuántas corredoras hay, agentes por corredora, leads y propiedades por corredora, actividad y salud del SaaS; ahí se mueve el alta de corredoras (hoy en Integraciones, H-008.7) | Media | M+ (dividir) | pendiente | H-008.7, H-033 |
| H-037 | Flujo de aprobación de publicaciones: una propiedad creada o editada por un agente queda en borrador o "en revisión" y solo sale al sitio y a los portales cuando el administrador de la corredora la aprueba; queda registro de quién la creó, quién la aprobó y cuándo (información fidedigna, trazable y verificable); el administrador puede rechazar con motivo | Alta | M+ (dividir) | en revisión | H-009.2, H-008.4 |
| H-038 | De lead de propietario a propiedad: lo que envía un propietario (valorizador, fotos) es solo una primera impresión y nunca se publica solo; el agente lo contacta y, desde el lead, crea la propiedad en borrador con los datos precargados y fotos propias de la corredora; el lead guarda el vínculo con la propiedad creada. Las fotos del propietario pasan a un almacenamiento privado (hoy van como texto dentro del lead) | Alta | M | en revisión | H-037, H-009.5 |
| H-013 | Despliegue final: reactivar despliegues en `vercel.json`, cargar variables y smoke test | Alta | S | bloqueada hasta nuevo aviso | todas las fases |

## Estacionadas: seguridad y comprobaciones (revisar antes del despliegue)

Decisión del 2026-10-31: mientras no haya despliegue, el trabajo se centra en que cada funcionalidad funcione. Lo de seguridad y las comprobaciones de funcionamiento amplias se estaciona aquí y se revisa **completo antes de H-013** (despliegue final). Ninguna depende de otra historia de funcionalidad, salvo H-006 (necesita el login de H-008).

| ID | Historia | Prioridad | Tamaño | Estado | Depende de |
| --- | --- | --- | --- | --- | --- |
| H-004 | Cabeceras CSP y HSTS en `vercel.json` | Media | S | estacionada | — |
| H-005 | Límite de tasa y validación extra en `api/*` | Media | M | estacionada | — |
| H-006 | Reemplazar el "Modo Master" (PIN fijo y `?agency=true`) por control real (retirado; el acceso es por login y rol) | Media | S | hecha | H-008 |
| H-007 | Mover el token de Instagram al servidor (solo si Instagram se reactiva; la sección ya está archivada, H-014) | Media | S | estacionada | — |
| H-019 | Medir cobertura de pruebas (paquete adicional) y fijar un umbral mínimo en el CI | Media | S | estacionada | H-002 |
| H-023 | Prueba E2E con Playwright del flujo de negocio: un visitante deja sus datos y el lead aparece en el CRM | Media | M | estacionada | H-008 (con datos reales) |
| H-024 | Línea base de accesibilidad (axe) y rendimiento (Lighthouse) del sitio y la consola | Media | S | estacionada | — |

H-008 se dividió el 2026-10-31 con `story-slicer` (detalle al final de este archivo). Las demás historias marcadas "dividir" se cortan con `metodo-apps:story-slicer` antes de empezar.

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

## H-014 Archivar la sección de Instagram
**Resultado (2026-10-31):** `InstagramSection`, `InstagramPostModal`, `instagramService` y los tipos de Instagram se movieron a `_archivo/instagram/` (con entrada en `_archivo/LEEME.md`) y se quitaron del repositorio; seguían en el historial de git. Ninguno estaba importado desde el sitio (era código sin uso). Se quitaron también las variables `VITE_INSTAGRAM_*` de `src/vite-env.d.ts` y las supresiones de lint asociadas (los 10 errores de hooks del modal desaparecen con él). Se mantiene el botón de enlace al perfil en el menú (`agencyConfig.contact.instagram`). Verificado: 69 pruebas, lint (0 errores), `tsc`, `build` (CSS del bundle baja de 62 a 52 kB) y el sitio carga en local con las 8 propiedades.

## H-008 dividida: Supabase, login y roles
Hoy los datos viven en el navegador y el panel solo se protege con `import.meta.env.DEV` o `VITE_ENABLE_ADMIN` (`src/core/config/adminAccess.ts`). Se corta por lo que el usuario puede ver: primero entrar de verdad (H-008.2), después saber a qué corredora pertenece (H-008.3) y recién entonces qué puede hacer (H-008.4). Las tablas no son historias por sí solas: nacen dentro de la historia que las necesita. Los leads y propiedades en Supabase son H-009. Cada migración requiere aprobación explícita antes de crearla (regla del proyecto). Crear la cuenta de Supabase y guardar sus claves lo hace el responsable del proyecto; las claves nunca pasan por el chat.

### H-008.1 Spike del entorno Supabase
**Como** responsable del proyecto **quiero** decidir dónde corre Supabase mientras desarrollamos **para** no gastar ni exponer claves por error.

**Criterios de aceptación**
1. Dado el spike (máximo medio día), cuando termina, entonces existe `docs/adr/007-*.md` que compara nube gratuita y local con Docker (costo, límites, esfuerzo, riesgo de perder datos) y recomienda una.
2. Dado el entorno elegido, cuando se sigue la guía escrita, entonces un cliente de prueba lee la salud del proyecto con las claves en `.env.local` (ignorado por git), sin claves en el repositorio.
3. Dado el ADR, cuando se revisa, entonces define cómo se crean y aprueban las migraciones (carpeta, nombres, quién las aprueba) y cómo se separan desarrollo y producción.

**Notas técnicas:** el resultado es una decisión, no código de producción. Verificar que `@supabase/supabase-js` existe y se mantiene antes de instalarlo (regla de paquetes).
**Fuera de alcance:** tablas, login, despliegue.
**Tamaño:** S

### H-008.2 Login real del panel
**Como** administradora de la corredora **quiero** entrar al panel con mi correo y clave **para** que nadie más vea mis leads.

**Criterios de aceptación**
1. Dado un usuario creado en Supabase, cuando ingresa correo y clave correctos, entonces ve el panel (Leads, Propiedades, Analítica, Integraciones, Marca) y su correo en la cabecera.
2. Dado que no hay sesión, cuando abre el panel, entonces ve solo la pantalla de ingreso y ningún dato de leads.
3. Dado un correo o clave incorrectos, cuando intenta entrar, entonces ve un mensaje de error claro y no entra (sin revelar cuál de los dos falló).
4. Dado una sesión activa, cuando cierra sesión, entonces vuelve a la pantalla de ingreso y recargar la página no la recupera.
5. Dado Supabase sin conexión, cuando intenta entrar, entonces ve "no se pudo conectar" y la pantalla no se rompe.

**Notas técnicas:** reemplaza el control por `VITE_ENABLE_ADMIN`/`DEV` de `adminAccess.ts`; la sesión la maneja el cliente de Supabase. En desarrollo hay un usuario de prueba creado por seed. El "Modo Master" (`?agency=true`) no se toca aquí (H-006, estacionada). Pruebas con el cliente simulado.
**Fuera de alcance:** roles, recuperar clave, registro público.
**Tamaño:** M

### H-008.3 Corredora (tenant) y rol
**Como** administradora **quiero** que mi usuario pertenezca a mi corredora con un rol **para** que el sistema sepa qué datos son míos.

**Criterios de aceptación**
1. Dado un usuario con membresía en la corredora A con rol administrador, cuando entra, entonces el panel muestra el nombre de la corredora y su rol.
2. Dado un usuario autenticado sin membresía, cuando entra, entonces ve "tu cuenta aún no está asociada a una corredora" y no ve el panel.
3. Dado un usuario de la corredora A, cuando consulta corredoras y membresías, entonces recibe solo las de A (prueba contra la base real con dos corredoras: no puede leer ni modificar las de B).
4. Dado el esquema, cuando se revisa, entonces `tenants` y `memberships` tienen RLS activo y hay una convención documentada (`tenant_id` obligatorio) para las tablas futuras.

**Notas técnicas:** primera migración real; requiere aprobación. El rol vive en la membresía, no en el usuario. Roles iniciales: `admin` y `agente` (jefe de equipo y vendedor quedan para después).
**Fuera de alcance:** equipos, permisos por módulo, datos de leads.
**Tamaño:** M

### H-008.4 Permisos por rol en el panel
**Como** administradora **quiero** que mis agentes no vean la configuración **para** proteger integraciones y marca.

**Criterios de aceptación**
1. Dado un administrador, cuando abre el panel, entonces ve todas las pestañas.
2. Dado un agente, cuando abre el panel, entonces ve Leads, Propiedades y Analítica, y no ve Integraciones ni Identidad y Marca.
3. Dado un agente, cuando intenta abrir una pestaña restringida (por estado guardado), entonces vuelve a una pestaña permitida.
4. Dado el cambio de rol de un usuario en la base, cuando vuelve a entrar, entonces ve las pestañas del nuevo rol.

**Notas técnicas:** la restricción visual no sustituye la de la base; las reglas de datos por rol llegan con H-009.
**Tamaño:** S

### H-008.5 Invitar a un agente
**Como** administradora **quiero** invitar a un agente por correo **para** que trabaje en mi corredora sin compartir mi clave.

**Criterios de aceptación**
1. Dado un administrador, cuando ingresa el correo de un agente y lo invita, entonces el agente recibe un correo con un enlace y, al aceptarlo y fijar su clave, entra a la corredora con rol agente.
2. Dado un agente, cuando intenta invitar a alguien, entonces no tiene la opción y la base lo rechaza.
3. Dado un correo ya invitado o ya miembro, cuando se invita de nuevo, entonces ve un aviso y no se duplica la membresía.
4. Dado un correo mal escrito, cuando se envía, entonces ve un error de validación.

**Notas técnicas:** la invitación necesita una función en el servidor (la clave de servicio nunca va en el navegador); el envío real de correos depende del entorno elegido en H-008.1.
**Tamaño:** M

### H-008.6 Recuperar contraseña
**Como** usuario **quiero** restablecer mi clave por correo **para** volver a entrar si la olvido.

**Criterios de aceptación**
1. Dado un correo registrado, cuando pido recuperar la clave, entonces recibo un correo con un enlace y puedo fijar una clave nueva con la que entro.
2. Dado un correo no registrado, cuando pido recuperar la clave, entonces veo el mismo mensaje de éxito (no se revela qué correos existen).
3. Dado un enlace vencido o ya usado, cuando lo abro, entonces veo un error claro y puedo pedir otro.

**Tamaño:** S

### H-008.7 Alta de una corredora nueva
**Como** dueño del producto **quiero** crear una corredora con su primer administrador **para** sumar clientes sin tocar la base a mano.

**Criterios de aceptación**
1. Dado el formulario de alta con nombre de corredora y correo del administrador, cuando se envía, entonces se crea el tenant y se invita al administrador.
2. Dado un usuario que no es dueño del producto, cuando intenta el alta, entonces no puede.
3. Dado un nombre de corredora repetido, cuando se envía, entonces ve un aviso y no se crea otro tenant.

**Notas técnicas:** puede posponerse mientras haya una sola corredora piloto; se vuelve necesaria con el plan SaaS (H-033).
**Tamaño:** M

**Resultado H-008.1 (2026-10-31):** ADR-007 (`docs/adr/007-entorno-supabase-desarrollo-y-produccion.md`): dos proyectos separados (`urbegestion-dev` en plan gratuito, región São Paulo, y `urbegestion-prod` en plan de pago al desplegar), claves publicables en `.env.local` y secretas solo en servidor, migraciones como SQL versionado y aprobado. Proyecto de desarrollo creado y verificado con `npm run verificar:supabase` (conexión correcta, registro público desactivado, confirmación de correo exigida). `@supabase/supabase-js` se instala en H-008.2.

**Resultado H-008.2, H-008.3, H-008.4, H-008.6 y H-006 (2026-10-31):** nuevo `src/core/auth/` (cliente de Supabase, `authService`, `useAuthStore`, `permissions`, pantallas de ingreso, recuperación y clave nueva). `@supabase/supabase-js` 2.118.0 instalado con versión exacta. El panel (`AdminDashboard`) muestra solo el ingreso si no hay sesión, y con sesión muestra corredora, rol y correo; las pestañas dependen del rol (administrador: todas; agente: Leads, Propiedades y Métricas). `ADMIN_ENABLED` ahora significa "Supabase configurado"; se retiró `VITE_ENABLE_ADMIN`. Se eliminó el Modo Master (PIN fijo, `?agency=true`, triple clic); Identidad y Marca es solo del administrador. El enlace de recuperación abre el sitio y muestra el formulario de clave nueva. Migración `supabase/migrations/20261031120000_core_tenants_memberships.sql` (tenants y memberships con RLS), `supabase/seed-dev.sql` y `supabase/tests/rls_tenants.sql`: **escritos pero aún no aplicados**; requieren aprobación y ejecución manual en el SQL Editor del proyecto de desarrollo. Pruebas: 103 (antes 69), lint (0 errores), `tsc` y `build` en verde. Pendiente de comprobar a mano con la base real: ingreso con el usuario de prueba, rol y pestañas, y recuperación por correo (requiere agregar `http://localhost:3000` en *Authentication > URL Configuration > Redirect URLs*). `npm audit` marca 1 hallazgo moderado nuevo en `minimatch` (herramienta de ESLint, solo desarrollo; no viene de Supabase).

## H-009 dividida: leads, CRM y propiedades en Supabase
Hoy los datos viven en el navegador de cada visitante (`localStorage`): lo que el panel ve no es lo que el sitio guardó. Con Supabase el sitio público y el panel comparten una sola base, separada por corredora (`tenant_id` + RLS). Decisiones: (1) el sitio atiende a una corredora fija indicada por `VITE_TENANT_ID` (el mapeo dominio → corredora llega con las plantillas de sitio); (2) catálogo de lectura pública, leads privados, y las visitas sin sesión solo pueden crear leads nuevos; (3) con Supabase no configurado, el sitio sigue funcionando con los datos locales de siempre. La migración de H-009.2 y H-009.3 es una sola (`20261031130000_catalogo_crm_properties_leads.sql`) y requiere aprobación antes de aplicarse.

### H-009.1 Capa de datos con repositorios
**Criterios de aceptación**
1. Dado Supabase no configurado, cuando se usa el sitio y el panel, entonces leads y propiedades se guardan en el navegador como hoy (las 103 pruebas actuales siguen pasando).
2. Dado un repositorio simulado, cuando se crea, cambia o borra un lead o una propiedad, entonces la tienda llama al repositorio y refleja el resultado.
3. Dado un fallo del repositorio, cuando se guarda, entonces la tienda conserva el dato en memoria y avisa con `console.warn` sin romper la pantalla.
**Tamaño:** S

### H-009.2 Propiedades en Supabase
**Criterios de aceptación**
1. Dado el sitio abierto sin sesión, cuando carga el catálogo, entonces ve las propiedades de la corredora guardadas en la base.
2. Dado un admin o agente con sesión, cuando crea o edita una propiedad, entonces queda en la base y otra persona de la misma corredora la ve.
3. Dado un agente, cuando intenta borrar una propiedad, entonces la base lo rechaza; el admin sí puede.
4. Dado un usuario de la corredora B, cuando intenta crear o editar propiedades de la A, entonces la base lo rechaza (prueba RLS contra la base real).
**Tamaño:** M

### H-009.3 Leads en Supabase
**Criterios de aceptación**
1. Dado un visitante sin sesión, cuando deja sus datos en el chat o en una ficha, entonces el lead queda en la corredora del sitio con estado `nuevo`.
2. Dado un visitante sin sesión, cuando intenta leer o modificar leads, entonces la base no le devuelve nada.
3. Dado un usuario de la corredora A, cuando abre el panel, entonces ve solo los leads de A; puede cambiar estado y agregar notas.
4. Dado un agente, cuando intenta borrar un lead, entonces la base lo rechaza; el admin sí puede.
5. Dado un usuario de B, cuando intenta leer o editar un lead de A, entonces no lo ve ni lo cambia (prueba RLS).
**Tamaño:** M

**Resultado H-009.1 a .3 (2026-10-31):** repositorios local y Supabase para propiedades y leads (`src/core/data/`, `.../services/`), tiendas conectadas, `load()` al abrir el sitio (catálogo) y al iniciar sesión (leads), leads borrados de memoria al cerrar sesión. Migración `20261031130000_catalogo_crm_properties_leads.sql` aplicada en el Supabase de desarrollo y 8 propiedades y 4 leads de ejemplo cargados (`supabase/seed-dev-catalogo.sql`). 28 pruebas nuevas (131 en total), `tsc`, lint (0 errores) y build en verde. Verificado contra la base real: la prueba RLS `supabase/tests/rls_catalogo_crm.sql` termina en "RLS OK"; un visitante sin sesión lee las 8 propiedades, crea un lead (201), no lee ningún lead y no borra nada; en el navegador, con sesión de administrador, el panel muestra los 4 leads desde la base. Falta que el responsable pruebe a mano (crear un lead desde el chat, cambiar su estado en el panel, editar una propiedad). H-009.4 y H-009.5 siguen pendientes. **Revisión independiente:** encontró que un visitante que agenda una visita crea el lead con estado `visita_agendada` y la política solo aceptaba `nuevo` (el lead se perdería). Se escribió la migración correctiva `20261031140000_leads_insert_endurecer.sql` (acepta `visita_agendada`, exige propiedad de la misma corredora y máximo 20 notas, impide cambiar `tenant_id`, `updated_at` en la base): **aprobada y aplicada** en el Supabase de desarrollo (2026-10-31); verificada con la API real: un visitante crea un lead `visita_agendada` (201) y se rechazan estado `cerrado`, 21 notas y propiedad inexistente; el cambio de corredora de una fila falla. También se corrigió en el código que editar o borrar sin permiso diera "éxito" con 0 filas y que un campo opcional borrado reapareciera. Pendiente anotado: notas simultáneas de dos agentes se pisan (H-009.4) y aviso visible cuando falla el guardado.

**Resultado H-009.5 y notas atómicas (2026-11-01):** migración `20261101120000_storage_imagenes_y_notas.sql` aplicada en desarrollo (bucket público `property-images`, 5 MB, JPG/PNG/WebP, escritura por corredora, borrado solo admin; función `append_lead_note`). Las fotos del panel se suben a Storage con Supabase y caen a base64 local si falla o no hay Supabase (`imageStorage.ts`); las propiedades con base64 antiguo siguen mostrándose. Las notas de leads se agregan en la base en un solo paso (cierra el pendiente de H-009.4). 144 pruebas, tipos, lint (0 errores) y build en verde. Falta: redimensionar fotos antes de subir y prueba RLS de Storage contra la base real desde el navegador.

**Cierre H-009.5 (2026-11-01):** la prueba RLS de Storage (`supabase/tests/rls_storage_notas.sql`) encontró que el administrador no podía borrar fotos (faltaba permiso de lectura). Migración correctiva `20261101130000_storage_ver_fotos_de_mi_corredora.sql` aplicada en desarrollo; la prueba termina en "RLS OK". Las fotos se reducen a 1600 px antes de subirse.

**Resultado H-008.5 (2026-11-01):** `api/invite.ts` (usa `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor; verifica el token, exige rol admin, la corredora sale de la base y no del cuerpo; invita primero y, si el correo ya tiene cuenta, lo agrega como agente sin duplicar ni cambiarlo de corredora). Sección "Equipo" en Integraciones (solo admin) y el enlace del correo abre la pantalla de clave nueva. 181 pruebas, tipos, lint y build en verde; revisión independiente sin bloqueantes (se corrigieron D1 a D5). No requirió migración: `memberships` no tiene políticas de escritura (comprobado con RLS real). Pendiente: probarlo a mano con el correo real en el preview; límite de frecuencia por corredora y mensaje genérico para `other_tenant` (S2), reenvío de invitaciones pendientes (S5) y `unique(user_id)` si algún día se quiere una sola corredora por usuario (requiere migración).

**Resultado H-008.7 (2026-11-01):** `api/create-tenant.ts`: GET dice si quien llama es dueño del producto y POST crea la corredora y envía la invitación a su primer administrador (si algo falla se deshace todo: corredora y cuenta). El dueño se define con la variable de servidor `PLATFORM_OWNER_EMAILS` (correos separados por comas); no hay tabla nueva ni migración. Sección "Plataforma: crear una corredora" en Integraciones, visible solo para el dueño. Nombre repetido: 409 (la base ya exige nombre único). El administrador nuevo debe usar un correo sin cuenta. 209 pruebas, tipos, lint y build en verde. Pendiente: probar a mano en el preview con `PLATFORM_OWNER_EMAILS` cargada en Vercel (Preview) y en `.env.local`.

**Resultado H-012 (2026-11-01):** los 4 formularios que capturan datos (chat, agenda en ficha, agendador y valorizador) muestran un aviso de privacidad breve bajo el botón de envío (`src/core/privacy/`), sin casilla obligatoria: la Ley 21.719 exige informar siempre, pero el consentimiento es solo una de varias bases de licitud, y para quien pide ser contactado puede apoyarse en otra. Cada lead guarda qué versión del aviso se mostró y cuándo (columna `privacy_notice`, migración `20261101140000_leads_aviso_privacidad.sql` aplicada en desarrollo y verificada con un insert de visitante). Si en el futuro se envían promociones o boletines, eso sí requiere consentimiento aparte. **Pendiente: revisión legal del texto** (la ley aún no está vigente: 1-dic-2026, con posible prórroga a 2027). 214 pruebas, tipos, lint y build en verde.

**Avance H-037 y H-038 (2026-11-01):** código listo y probado (228 pruebas, tipos, lint y build en verde): estados de publicación (borrador, en revisión, publicada, rechazada), el sitio y el chat muestran solo lo publicado, el agente crea en borrador y envía a revisión, el administrador aprueba o rechaza con motivo, y desde un lead de propietario se crea una propiedad en borrador sin copiar las fotos del propietario. **Falta aplicar la migración `20261101150000_publicacion_aprobacion.sql`** (estados, quién creó y aprobó, registro de eventos, reglas por disparador, columna `converted_property_id` en leads) y correr `supabase/tests/rls_publicacion.sql`; hasta entonces no se despliega.
