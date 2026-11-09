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
| H-009.1 | Capa de datos con repositorios: las tiendas de leads y propiedades pasan por un repositorio (local o Supabase); sin Supabase configurado todo sigue como hoy | Alta (Must) | S | hecha (unida a main el 2026-10-31; estado corregido el 2026-11-03) | H-008 |
| H-009.2 | Propiedades en Supabase: catálogo público leído de la base, panel de propiedades guarda por corredora | Alta (Must) | M | hecha (unida a main el 2026-10-31; estado corregido el 2026-11-03) | H-009.1 |
| H-009.3 | Leads en Supabase: el sitio crea leads en la corredora, el panel los ve y gestiona solo si es de esa corredora | Alta (Must) | M | hecha (unida a main el 2026-10-31; estado corregido el 2026-11-03) | H-009.1 |
| H-009.4 | Evento `lead.created` entre Captación y CRM (Captación deja de importar el almacén de CRM) | Media (Should) | S | hecha | H-009.3 |
| H-009.5 | Imágenes de propiedades en Supabase Storage (hoy se guardan como texto base64) | Media (Should) | M | hecha | H-009.2 |
| H-010 | Extraer textos de interfaz a archivos de traducción (es-419 e inglés) | Media | M+ | dividida en H-010.1 a H-010.4 | — |
| H-010.1 | Infraestructura de idiomas: textos con clave en `src/core/i18n` (español base e inglés con las mismas claves, comprobado en compilación y por una prueba), parámetros, plural por idioma y textos propios de cada paquete de mercado; primera tajada migrada: buscador y grilla del catálogo y la sección de zonas del panel | Media | S | hecha (2026-11-01) | ADR-008 |
| H-010.2 | Textos del sitio público a traducibles: tarjeta de propiedad, barra de navegación y barra móvil, agenda de visitas y ficha de propiedad (con su ficha comercial para WhatsApp). Quedan fuera a propósito: el simulador de dividendo (apagado y específico de Chile) y los textos de marca de cada corredora (portada, "Sobre nosotros", testimonios, pie de página), que se editan con H-032 | Media | M | hecha (2026-11-01) | H-010.1 |
| H-010.3 | Textos de Captación a traducibles: asistente de chat (botón, formulario, sugerencias y motor local de respuestas, que entiende consultas en español e inglés sea cual sea el idioma de la pantalla) y valorizador de propietarios (4 pasos, avisos de archivos y confirmación) | Media | M | hecha (2026-11-01) | H-010.1 |
| H-010.4 | Textos del panel a traducibles (CRM, propiedades, métricas, integraciones, identidad) y selector de idioma por corredora y por usuario | Media | M+ | estacionada (2026-11-01, decisión del responsable: primero validar el SaaS en Chile; traducir el resto del panel y el idioma por defecto de la corredora cuando se vaya a otro mercado). Hecho: selector de idioma, acceso, marco del panel, métricas, equipo, plataforma, publicación y exportación | H-010.1 |
| H-011 | Paquete de mercado Chile formal (interfaz `MarketPack`: UF, ubicaciones, RUT, ley de datos) y elección del segundo mercado para probar la abstracción (ADR-008) | Media | M | hecha para Chile (2026-11-01); la elección del segundo mercado queda diferida por decisión del responsable hasta que se quiera desarrollar | H-010, H-040 |
| H-012 | Consentimiento y finalidad de datos en formularios (Ley 21.719) | Alta | M | hecha | H-008 |
| H-014 | Archivar la sección de Instagram (decisión 2026-10-31: no va en primera instancia): mover a `_archivo/` con `LEEME.md` tras revisar qué código la referencia | Baja | S | hecha | — |
| H-015 | Reducir la deuda de lint suprimida (los 10 errores de hooks desaparecieron al archivar Instagram en H-014; el resto está en `eslint-suppressions.json`) y vaciar `eslint-suppressions.json` | Media | M | hecha (2026-11-01: 0 errores y 0 avisos; `eslint-suppressions.json` vacío) | H-002 |
| H-016 | Ids únicos para leads y propiedades (hoy `Date.now()` puede repetirse en el mismo milisegundo y un cambio afecta a ambos) | Media | S | hecha | H-002 |
| H-017 | Corregir el motor local del chat: la intención de crédito atrapaba mensajes con "propiedades" (contienen "pie") y la búsqueda combinaba comuna, tipo y operación con "o". Decisión 2026-10-31: el chat no evalúa crédito (lo hace el banco) y el simulador de dividendo queda apagado | Media | S | hecha | H-002 |
| H-018 | Pruebas de `api/chat.ts` y `api/lead-webhook.ts` como parte de la suite (hoy solo se verificaron con scripts temporales que no se guardaron) | Alta | S | hecha | H-002 |
| H-020 | Pruebas de pantallas del CRM (Kanban, filtros, ficha del lead, notas, exportación CSV) con Testing Library | Media | M | hecha (2026-11-01: 19 pruebas de la pantalla; se instaló Testing Library) | H-002; hacerla antes de rediseñar el CRM |
| H-021 | Pruebas de pantallas de catálogo y captación (filtros, formulario de propiedades, chat, valorizador de 4 pasos, agenda) (el simulador de dividendo queda apagado, ver H-017) | Media | M | hecha (2026-11-01: 47 pruebas de pantalla en 5 archivos) | H-002 |
| H-022 | Pruebas de la tienda de marca y de la pestaña de Identidad y Marca | Baja | S | hecha (2026-11-01: 7 pruebas de la tienda y 6 de la pestaña) | H-002 |
| H-025 | Exportación completa de los datos de una corredora (propiedades, contactos, notas) en CSV/JSON | Media | M | hecha (probada a mano por el responsable, 2026-11-01) | H-008 |
| H-026 | Pasar el repositorio a monorepo: `apps/consola` (React + Vite) y `apps/sitio` (Next.js) con paquetes compartidos | Alta | M+ (dividir) | hecha (etapas 0 a 3 unidas a `main` el 2026-11-02; la etapa 4 se cerró con H-027.3) | ADR-006, ADR-010 |
| H-027 | Modelo de plantilla: datos del sitio en la base de datos y separación entre contenido y diseño | Alta | M+ | dividida en H-027.1 a H-027.4 | H-008, H-026 |
| H-027.1 | Lo que el administrador guarda en Identidad y Marca (nombre, logo, contacto, colores y secciones activas) lo ven todos los visitantes en cualquier equipo | Alta | M | hecha en código y unida a main (2026-11-03); falta la prueba a mano de guardar la marca desde el panel con una sesión real | ADR-011 |
| H-027.2 | Los textos del sitio (portada, "Sobre nosotros", testimonios y pie de página) son datos de cada corredora, y una corredora nueva no muestra datos de otra | Alta | M | hecha (unida a main el 2026-11-03) | H-027.1 |
| H-027.3 | `apps/sitio` en Next.js muestra, generada en el servidor, la marca de la corredora leída de la base (cierra la etapa 4 de H-026) | Alta | M | hecha (unida a main el 2026-11-03; proyecto `portal-inmobiliario-sitio` creado en Vercel) | H-027.1 |
| H-027.4 | Cada corredora tiene una plantilla asignada que decide cómo se ven sus datos; una plantilla desconocida usa la predeterminada | Media | S | hecha (unida a main el 2026-11-03) | H-027.3 |
| H-028 | Plantilla 1: adaptar la landing actual (`src/site/`) al sitio Next.js | Alta | M+ | dividida en H-028.1 a H-028.4 | H-027 |
| H-028.1 | Secciones de la plantilla clásica en Next.js: cabecera, portada, sobre nosotros, testimonios, pie y barra móvil, con los colores de cada corredora | Alta | M | hecha (unida a main el 2026-11-03) | H-027 |
| H-028.2 | Catálogo público en el sitio: propiedades publicadas pintadas desde el servidor, con buscador sin precio | Alta | M | hecha (unida a main el 2026-11-03) | H-028.1 |
| H-028.3 | Ficha pública de la propiedad en su propia dirección y formulario de visita que crea un lead en el CRM | Alta | M+ | hecha (unida a main el 2026-11-03) | H-028.2 |
| H-028.4 | Asistente de IA y valorizador en el sitio, según lo que incluya el plan de la corredora | Media | M | dividida en H-028.4a a c (plan aprobado el 2026-11-04) | H-028.3 |
| H-028.4a | Valorizador para propietarios en el sitio: formulario "¿Quieres vender o arrendar tu propiedad?" que crea un lead de propietario (`venta_propietario`, fuente `captacion_propietarios`) en la corredora de la dirección, con aviso de privacidad, campo trampa y webhook; sin subida de fotos por ahora. La sección aparece solo si la página recibe la función de envío (el plan lo decide en H-028.4b) | Media | S | hecha en código (2026-11-04), falta probarla a mano | H-028.3 |
| H-028.4b | Plan de la corredora en el sitio: función de la base que entrega solo si tiene chat (`ai.chat`) y valorizador (`valuation.owner_form`); el sitio muestra u oculta cada herramienta. Requiere migración nueva (aprobar el SQL antes de aplicarla) | Media | S | hecha en código (2026-11-04): migración `20261104120000_funciones_del_sitio.sql` aplicada en desarrollo, prueba en la base en verde; falta probarla a mano | H-028.4a |
| H-028.4c | Chat con asistente en el sitio: botón flotante con el motor de reglas, recomienda propiedades del catálogo de la corredora y deja el contacto como lead; el modelo de lenguaje en el servidor queda para después | Media | M | hecha en código (2026-11-04): aparece solo si el plan incluye `ai.chat`; si no hay coincidencias lo dice y ofrece avisar; falta probarla a mano | H-028.4b |
| H-029 | Plantilla 2 y prueba de intercambio de plantilla sin perder datos | Media | M | pendiente | H-028 |
| H-030 | Dominio propio o subdominio por corredora: resolución por dominio y guía de registros DNS | Alta | M+ (dividir) | hecha en código (2026-11-03; migración aplicada en desarrollo, prueba RLS en verde, ADR-012); falta el dominio de la plataforma | H-027 |
| H-031 | SEO del sitio: fichas indexables, mapa del sitio y metadatos | Media | S | hecha en código (2026-11-03) | H-028 |
| H-032 | Editor de datos del sitio para la corredora (logo, colores, textos, fotos; sin cambiar la estructura) | Alta | M+ (dividir) | hecha en código (2026-11-03): textos del sitio; logo, colores y foto del corredor ya se editaban (H-027.1). Migración aplicada en desarrollo | H-027, H-008 |
| H-033 | Aplicar planes y límites en el SaaS con `can()` y `limit()` según el contrato (ADR-009); los planes y precios se definen en ventas | Media | M | hecha en el panel (2026-11-01: 20 pruebas nuevas): avisos y modos por estado (pago pendiente, solo lectura, cancelada), funciones `branding.edit`, `crm.export` y `ai.llm_server`, cupo de agentes en el servidor y de propiedades publicadas en el panel. Lo que falta está en H-045 | H-043 |
| H-034 | Widget embebible y API pública para el plan Solo herramientas | Media | M+ (dividir) | pendiente | H-008, H-033 |
| H-035 | Editor de estructura del sitio (mover, agregar y quitar secciones) | Baja | M+ | fuera del MVP | H-032 |
| H-036 | Panel operativo del dueño del producto dentro del SaaS (reducido por ADR-009): salud del sistema, ver agregados por corredora y suspender o reactivar una corredora; el control comercial vive en el proyecto de ventas y el alta de corredoras pasa a ser una función que ventas llama (hoy en Integraciones, H-008.7) | Baja | M | pendiente | H-043 |
| H-037 | Flujo de aprobación de publicaciones: una propiedad creada o editada por un agente queda en borrador o "en revisión" y solo sale al sitio y a los portales cuando el administrador de la corredora la aprueba; queda registro de quién la creó, quién la aprobó y cuándo (información fidedigna, trazable y verificable); el administrador puede rechazar con motivo | Alta | M+ (dividir) | hecha (probada a mano por el responsable, 2026-11-01) | H-009.2, H-008.4 |
| H-038 | De lead de propietario a propiedad: lo que envía un propietario (valorizador, fotos) es solo una primera impresión y nunca se publica solo; el agente lo contacta y, desde el lead, crea la propiedad en borrador con los datos precargados y fotos propias de la corredora; el lead guarda el vínculo con la propiedad creada. Las fotos del propietario pasan a un almacenamiento privado (hoy van como texto dentro del lead) | Alta | M | hecha (probada a mano por el responsable, 2026-11-01) | H-037, H-009.5 |
| H-039 | Corregir el filtro de comunas del catálogo: el contador del buscador compara de forma flexible y la grilla de forma exacta, así que al elegir "Lo Barnechea (La Dehesa / Los Trapenses)" el contador dice 1 propiedad y la grilla queda vacía (igual con Chicureo, Melipilla y Pirque). Prueba invertida en `Catalogo.test.tsx` | Alta | S | hecha (probada a mano por el responsable, 2026-11-01) | H-021 |
| H-040 | Ubicaciones por mercado y zonas de trabajo de la corredora: cargar las 16 regiones de Chile con sus comunas como dato jerárquico, y que cada corredora elija dónde opera; el buscador, el formulario de propiedades, el valorizador y el chat usan esas zonas y el sitio deja de decir "Santiago" (ADR-008, propuesta; la columna nueva de zonas requiere migración aprobada) | Alta | M | hecha (probada a mano por el responsable, 2026-11-01) | H-039 |
| H-041 | Precio con su moneda: la propiedad guarda monto y moneda en vez de `price_uf`; la UF pasa a ser una moneda del paquete Chile con su conversión (ADR-008; migración nueva con migración de datos, requiere aprobación) | Media | M+ | hecha (probada a mano por el responsable, 2026-11-01) | H-040 |
| H-042 | Restaurar la marca original: tras guardar un cambio en la misma sesión, "Restaurar Original" devolvía lo editado porque guardar pisaba el objeto de origen; ahora la tienda guarda su propia copia del original (descubierto al escribir las pruebas de H-022) | Media | S | hecha (2026-11-01) | H-022 |
| H-043 | Contrato SaaS-ventas v1 (ADR-009), dividida en H-043.1 y H-043.2 | Alta | M+ | dividida | — |
| H-043.1 | Catálogo de variables (`src/core/platform/contract.ts`), lector tolerante, `can()`/`limitOf()`/`hasRoom()`/`accessMode()`, tienda `useEntitlementsStore` idempotente y en orden, y prueba de que el ADR-009 nombra cada clave | Alta | M | hecha (2026-11-01: 19 pruebas; sin base de datos; el producto no cambia: sin ventas conectadas todo queda prendido y sin límites) | ADR-009 |
| H-043.2 | Tabla `tenant_entitlements` (migración `20261101230000` aplicada en desarrollo, con prueba RLS en verde), `api/platform/tenant-sync` firmada, idempotente y en orden, `api/platform/metrics` de solo agregados, y lectura de los derechos en el panel | Alta | M | hecha en código (2026-11-01: 23 pruebas nuevas; guía en `docs/integracion-ventas.md`). Falta cargar `PLATFORM_SYNC_SECRET` y `PLATFORM_METRICS_TOKEN` en Vercel (Preview) para probar con una llamada real | H-043.1 |
| H-043.3 | Alta de corredora llamada desde ventas (hoy solo la hace el dueño desde el panel): reutilizar la lógica de `api/create-tenant.ts` en una función compartida y exponerla firmada; medir `ai_messages_30d` y `storage_mb` | Media | M | pendiente | H-043.2 |
| H-044 | Panel ordenado por rol: el agente ve Leads, Propiedades y Métricas; el administrador suma "Mi corredora" (equipo, zonas, modo de publicación, descarga de datos), Integraciones (solo conectores e IA) e Identidad y Marca; el dueño del producto suma "Plataforma" (lo confirma el servidor). Primera etapa, sin cambiar el contenido de cada sección | Media | S | hecha (2026-11-01: 7 pruebas nuevas del panel y de permisos) | H-043.2 |
| H-045 | Derechos también en el sitio público y en la base: función pública de solo lectura (`get_tenant_public_entitlements`, sin plan ni cupos) para apagar el chat y el formulario de propietarios, y disparador que hace cumplir `limit.properties_published` aunque se evite el panel. Los leads no se limitan (un lead perdido es un cliente perdido); su uso se mide con las métricas | Media | M | hecha (2026-11-01: migración `20261101240000` aplicada en desarrollo con prueba SQL en verde; 6 pruebas nuevas) | H-033 |
| H-046 | Corregir las funciones `api/invite`, `api/platform/metrics` y `api/platform/tenant-sync`, que se caían al cargar en Vercel (`ERR_MODULE_NOT_FOUND`: importaban archivos de `src/` sin extensión). Afectaba la invitación de agentes (desde H-033) y la conexión con ventas (desde H-043.2). Encontrado al medir la línea base de H-026 | Alta | S | hecha (2026-11-02: con una prueba que impide que vuelva; responsable aprobó tras la prueba manual del preview, que incluía invitar a un agente) | — |
| H-047 | Limitar en la base lo que un visitante puede leer de una propiedad: la política pública filtra filas y no columnas, así que con la clave pública se pueden pedir columnas internas de las propiedades publicadas de cualquier corredora (quién creó y aprobó, coordenadas; comprobado como visitante el 2026-11-02). Migración nueva con vista o permisos por columna; exige cambiar el `select('*')` del repositorio de la consola. Revisar antes de H-013 | Alta | M | hecha en código (2026-11-04): migración `20261104170000` aplicada en desarrollo; un visitante solo lee una lista explícita de columnas; prueba `rls_propiedades_publicas.sql` en verde | H-028.2 |
| H-048 | Propiedades vendidas o arrendadas en el sitio: el estado `vendida`, `arrendada` o `reservada` no se considera, así que una publicada sale como disponible; decidir cómo se muestra, en el sitio y en la consola, antes de que el panel permita cambiarlo | Media | S | hecha en código (2026-11-03): vendidas y arrendadas fuera del sitio, reservadas con etiqueta, selector en el panel | H-028.2 |
| H-049 | Portada propia de cada corredora: el video y la foto de la portada son los mismos para todas y vienen de servidores ajenos (aclarar licencia); alojarlos en almacenamiento propio, dejar elegirlos y no descargar el video en celular | Media | M | hecha en código (2026-11-04): foto y video de portada por corredora (editor con subida de foto), fondo neutro sin servidores ajenos, el video solo en pantallas anchas y sin "reducir movimiento"; sin migración; falta probarla a mano | H-032 |
| H-050 | Afinar la comparación de comunas: `matchesCommune` compara por contenido, así que una corredora acotada a una zona con Pinto también muestra María Pinto, de otra región, y una comuna vacía siempre coincide; dejar una sola función de zonas en `@portal/mercados` para la consola y el sitio | Media | S | hecha en código (2026-11-08): `matchesCommune` ya no compara por contenido; el nombre más corto debe abrir al más largo y seguir con un sector entre paréntesis o con barra ("Pinto" ya no coincide con "María Pinto"), y una comuna vacía no coincide con nada. Sigue pendiente dejar una sola función de zonas para consola y sitio (hoy ambos usan `@portal/mercados`) | H-028.2 |
| H-051 | Filtro por precio y selector de moneda en el sitio; requiere que la tasa de la UF venga de cada corredora y no de la configuración escrita en el código | Media | M | hecha en código (2026-11-04, ADR-013): filtro de precio mínimo y máximo con selector de moneda; la UF del día se lee de una fuente pública declarada por el paquete de mercado (Chile) y no se escribe a mano. Pendiente: mindicador.cl no responde a Node ni desde la máquina de desarrollo ni desde Vercel (comprobado en el preview del 2026-11-04: agota la espera de 5 s); falta sumar la API oficial de la CMF (clave gratuita en `CMF_API_KEY`) como fuente de la UF. Mientras tanto el filtro funciona solo en UF | H-028.3 |
| H-052 | Proteger el envío de leads del sitio antes de abrirlo al público: límite por dirección IP o verificación contra robots en el formulario, y cerrar el insert directo en `leads` con la clave pública (hoy permite cualquier corredora y cualquier columna) dejándolo pasar por una función de la base; identificadores con formato válido pero inventados aún generan una página por dirección. Revisar antes de H-013, junto con H-005 | Alta | M | hecha en código (2026-11-04): migración `20261104160000` aplicada en desarrollo; el visitante crea leads con la función `create_site_lead` (valida corredora y plan, columnas permitidas y topes: 60 por corredora cada 10 minutos y 3 por teléfono o correo por hora); el insert directo quedó solo para miembros de la corredora; pruebas `rls_leads_por_funcion.sql` y `rls_catalogo_crm.sql` en verde. Un límite por IP real queda para el firewall de Vercel | H-028.3 |
| H-053 | Exportación CSV de leads a prueba de texto escrito por visitantes: comillas en cada celda, neutralizar `= + - @` al inicio para que Excel no lo tome como fórmula y no cortar el archivo con `#`; mostrar "Sin correo" en el CRM | Media | S | hecha en código (2026-11-04): el CRM exporta con la misma función segura que "Mi corredora" y muestra "Sin correo"; falta probarla a mano | H-028.3 |
| H-054 | Avisar a la corredora cuando entra un lead nuevo: el panel solo los lee al iniciar sesión, así que una solicitud de visita puede quedar horas sin verse si no hay webhook configurado | Alta | M | hecha en código (2026-11-03): aviso en vivo en el panel, por correo y por Telegram; migración aplicada y funciones desplegadas en desarrollo. Faltan las claves de Resend y del bot de Telegram (guía en docs/guia-avisos.md) | H-028.3 |
| H-055 | Dominios propios a prueba de abusos y sitio apagado también en la API: hoy cualquier administrador con `site.custom_domain` puede registrar un dominio ajeno y ocuparlo (el primero que lo guarda se lo queda; no se muestra mientras el dueño de la plataforma no lo agregue en Vercel). Dejarlo "pendiente" hasta verificarlo (registro TXT) y activarlo desde el panel del dueño. Además, `get_tenant_public_site` y el insert de leads con la clave pública no consultan `site_is_public`: con el id de una corredora suspendida se pueden leer sus datos públicos y crearle leads directo contra la API (revisar junto con H-052) | Media | M | parcial (2026-11-04): el insert de leads ya consulta si el sitio está activo (H-052); falta verificar dominios propios con registro TXT y activarlos desde el panel del dueño | H-030 |
| H-056 | Próxima acción por contacto: cada lead guarda qué hay que hacer y para cuándo; el CRM muestra "Para hoy" (vencidas, de hoy y sin acción) y al cumplirla deja una nota (ver criterios abajo) | Alta | M | hecha en código (2026-11-04); migración `20261104130000` aplicada en desarrollo; probada a mano por el responsable (2026-11-04) | H-054 |
| H-057 | Línea de tiempo del contacto: historial de llamadas, WhatsApp, correos, visitas y notas con fecha y autor | Alta | M | hecha en código (2026-11-04); migración `20261104140000` aplicada en desarrollo, prueba RLS en verde; probada a mano por el responsable (2026-11-04) | H-056 |
| H-058 | Atribución: fuente, campaña (UTM) y propiedad consultada en cada lead que entra por el sitio | Alta | S | hecha en código (2026-11-04); migración `20261104150000` aplicada en desarrollo y verificada (la columna rechaza claves ajenas, valores que no son texto y textos enormes); probada a mano por el responsable (2026-11-04) | H-028.3 |
| H-059 | Agenda de visitas: calendario dentro del panel con las visitas agendadas, sin sincronizar con calendarios externos | Alta | M+ | hecha en código (2026-11-04); sin migración nueva; probada a mano por el responsable (2026-11-04) | H-056 |
| H-060 | Reportes básicos: leads por etapa, fuente y agente, y tiempo de primera respuesta | Media | M | hecha en código (2026-11-04), sin migración nueva; el reporte por agente queda fuera hasta la asignación de leads; falta probarla a mano | H-057, H-058 |
| H-061 | Dashboard de gestión de leads: unir la pestaña Métricas con los Reportes, con tarjetas de números clave y gráficos (embudo, leads por semana, origen y campaña); los indicadores salen de la investigación de mercado (ver abajo) y se afinan con el responsable | Media | M+ (dividir) | primera tajada hecha en código (2026-11-08): indicadores del núcleo en la vista Reportes; faltan los que necesitan un dato nuevo (ver abajo) y la unión con la pestaña Métricas | H-060 |
| H-062 | Producción: base propia, proyecto del sitio y variables | Alta | M | preparada (2026-11-04): guía paso a paso en `docs/guia-produccion.md` (migraciones en orden, variables, firewall); los pasos de crear el proyecto de Supabase de producción, cargar las claves y configurar Vercel los hace el responsable | H-013 |
| H-063 | Cerrar del todo el abuso de `create_site_lead` por la clave pública: captcha (Turnstile) o firma de cada envío con un secreto de servidor en el sitio; la landing de la consola no guarda secretos. Hoy lo frenan solo los topes de la función (ver `docs/guia-produccion.md`) | Media | M | hecha en código (2026-11-04): migración `20261105100000` aplicada en desarrollo (cuenta B), `create_site_lead` solo para `service_role`; sitio y `api/crear-lead` la llaman con la clave de servicio y límite por IP; el captcha (Turnstile) queda opcional para después. Falta cargar `SUPABASE_SERVICE_ROLE_KEY` en el proyecto del sitio en Vercel | H-052 |
| H-064 | La consola toma la corredora de la sesión del usuario y no de la variable `VITE_TENANT_ID`: una sola consola atiende a todas las corredoras (la membresía trae el id; `dataSource` lo guarda y avisa los cambios; los repositorios se rearman por corredora; al cambiar de corredora se vacían y recargan todas las tiendas; las cargas lentas de la corredora anterior se descartan) | Alta | M | hecha (2026-11-06): revisión por subagente (3 bloqueantes de fugas entre corredoras, corregidos con pruebas), 1137 pruebas, E2E real sin `VITE_TENANT_ID`. Límites conocidos: con sesión sin membresía se mantiene el respaldo `VITE_TENANT_ID` (portada pública de desarrollo); si un usuario tuviera varias membresías se usa la más antigua (hoy hay una por usuario) | H-008.3 |
| H-065 | Imágenes de propiedades: indicar en el formulario las medidas y el peso recomendados (formatos, tamaño máximo, proporción) y ajustarlas al cargarlas (redimensionar y recortar centrado a una proporción fija) para que se vean bien en el sitio; evaluar un script que ajuste las ya cargadas. Se suma el peso de las imágenes del sitio (Lighthouse: ahorro estimado de 520 KiB en la carga principal) | Media | S | hecha en parte (2026-11-08): el formulario de propiedades indica las medidas recomendadas (1600 × 1000 px, 16:10) y las fotos nuevas se recortan al centro a esa proporción y se reducen a 1600 px de ancho (JPEG 82 %). Falta, si se quiere, un script que ajuste las ya cargadas | H-009.5 |
| H-066 | Con ninguna región de Chile marcada en las zonas de trabajo de la corredora, el sitio no muestra ninguna propiedad (se vio al probar producción: aparecieron al marcar la Región Metropolitana). Diagnosticar el filtro por zonas del sitio y decidir: sin zonas marcadas se muestran todas, o el panel avisa que hay que marcar al menos una. Relacionada con H-050 | Media | S | no reproducida en el código (2026-11-08): con ninguna región marcada `dentroDeZonas` devuelve todas las propiedades (prueba nueva lo fija, también con ids de región inexistentes). La causa más probable es la copia del sitio, que se renueva cada minuto; si vuelve a pasar, anotar la hora y la dirección para mirar los registros del sitio en Vercel | H-040, H-050 |
| H-067 | Formato guiado del teléfono y del correo al pedir una visita (formulario del sitio y de la consola): ejemplo visible (+56 9 1234 5678), validación y normalización del número, para poder contactar al cliente o conectar después un asistente o WhatsApp sin problemas | Media | S | hecha en código (2026-11-08): `normalizePhone` en `@portal/mercados` lleva el teléfono a "+56 9 1234 5678" (acepta +56, 56, 9 1234-5678, paréntesis; números de otro país con su + sin espacios); los formularios de visita, tasación y chat del sitio muestran el ejemplo, ordenan el número al salir del campo y el servidor rechaza los incompletos y guarda un solo formato; los formularios de la consola también lo ordenan al salir del campo (sin rechazar) | H-028.2 |
| H-068 | Publicar los avisos aprobados en Mercado Libre y Portal Inmobiliario (Portal Inmobiliario opera como extensión de Mercado Libre, una sola integración). Pedido del responsable el 2026-11-09; investigación y plan en la sesión de ese día. Instagram/Facebook (fase 2) y TocToc/Yapo (sin API pública, requieren convenio) quedan sin historia. Se divide en H-068.1 a H-068.5 | Media | L (dividir) | en curso | H-037, H-048 |
| H-068.1 | Traductor de una propiedad al aviso de Mercado Libre (paquete `@portal/portales`, código puro): título a 60 caracteres, precio en pesos (convierte UF con la tasa, sin tasa no inventa), fotos solo con dirección pública, atributos (dormitorios, baños, estacionamientos, superficies), ubicación y descripción; devuelve todos los motivos si no se puede armar | Media | S | hecha en código (2026-11-09): 24 pruebas, 1199 en total, revisión por subagente sin bloqueantes (corregidos valores infinitos, redondeo a cero, moneda en minúsculas y coordenadas), tipos, lint y build en verde. Pendiente para H-068.3: IDs de categoría de Chile (vienen de la API de categorías; hoy se pasan por opciones) y validar con `/items/validate`; confirmar si el portal acepta precios en UF (hoy se convierte a pesos) | H-068 |
| H-068.2 | Conexión de la cuenta: botón "Conectar Mercado Libre" en los ajustes (OAuth), tokens en tabla solo del servidor con renovación automática. Requiere migración nueva (autorizada para desarrollo el 2026-11-09) y que el responsable registre la app en developers.mercadolibre.cl | Media | M | pendiente | H-068.1 |
| H-068.3 | Botón "Publicar en portales" en una propiedad aprobada; guarda enlace y resultado o error claro (por ejemplo, sin paquete de publicaciones) | Media | M | pendiente | H-068.2 |
| H-068.4 | Sincronización: cambios de precio o estado actualizan el aviso; vendida o arrendada lo cierra | Media | M | pendiente | H-068.3 |
| H-068.5 | Estado visible en el catálogo: en qué portales está cada propiedad, con enlace y último error | Baja | S | pendiente | H-068.3 |
| H-013 | Despliegue final: reactivar despliegues en `vercel.json`, cargar variables y smoke test | Alta | S | preparada (2026-11-04): lista de despliegue y pasos de humo en `docs/guia-produccion.md` y `docs/runbook.md`; el despliegue a producción espera la orden explícita del responsable | todas las fases |

## Estacionadas: seguridad y comprobaciones (revisar antes del despliegue)

Decisión del 2026-10-31: mientras no haya despliegue, el trabajo se centra en que cada funcionalidad funcione. Lo de seguridad y las comprobaciones de funcionamiento amplias se estaciona aquí y se revisa **completo antes de H-013** (despliegue final). Ninguna depende de otra historia de funcionalidad, salvo H-006 (necesita el login de H-008).

| ID | Historia | Prioridad | Tamaño | Estado | Depende de |
| --- | --- | --- | --- | --- | --- |
| H-004 | Cabeceras CSP y HSTS en `vercel.json` | Media | S | hecha en código (2026-11-04): HSTS, política de contenido y permisos en la consola (`vercel.json`) y en el sitio (`next.config.ts`); falta mirarlas en un preview de Vercel | — |
| H-005 | Límite de tasa y validación extra en `api/*` | Media | M | hecha en código (2026-11-04): límite por dirección IP en todas las funciones de `api/` (de mejor esfuerzo; el tope firme va en el firewall de Vercel, ver `docs/guia-produccion.md`) y validación de tamaño y forma | — |
| H-006 | Reemplazar el "Modo Master" (PIN fijo y `?agency=true`) por control real (retirado; el acceso es por login y rol) | Media | S | hecha | H-008 |
| H-007 | Mover el token de Instagram al servidor (solo si Instagram se reactiva; la sección ya está archivada, H-014) | Media | S | estacionada | — |
| H-019 | Medir cobertura de pruebas (paquete adicional) y fijar un umbral mínimo en el CI | Media | S | hecha (2026-11-04): `npm run test:coverage` mide 88 % de líneas y el CI falla si baja de los mínimos fijados en `vitest.config.ts` | H-002 |
| H-023 | Prueba E2E con Playwright del flujo de negocio: un visitante deja sus datos y el lead aparece en el CRM | Media | M | hecha (2026-11-06): `npm run test:e2e` levanta consola y sitio contra la base de desarrollo (cuenta B), crea un lead desde la ficha y lo ve el agente en el CRM; las claves van en `e2e/credenciales.local` (fuera de Git, plantilla `e2e/credenciales.ejemplo`) | H-008 (con datos reales) |
| H-024 | Línea base de accesibilidad (axe) y rendimiento (Lighthouse) del sitio y la consola | Media | S | hecha a medias (2026-11-04): línea base de accesibilidad con axe-core en el CRM y los formularios del sitio (sin infracciones serias; se corrigieron etiquetas faltantes); Lighthouse del sitio compilado en local (2026-11-06): rendimiento 82, accesibilidad 96, buenas prácticas 96; SEO 66 solo porque las direcciones de prueba llevan noindex a propósito. Pendiente: LCP 3,2 s (imágenes sin redimensionar, ahorro estimado 520 KiB); falta medir la consola | — |

H-008 se dividió el 2026-10-31 con `story-slicer` (detalle al final de este archivo). Las demás historias marcadas "dividir" se cortan con `metodo-apps:story-slicer` antes de empezar.

H-025 a H-035 salen de la decisión del 2026-10-30 de incluir el sitio con plantillas en el producto base (ADR-005 y ADR-006). H-004 (CSP y HSTS) debe contemplar los dominios de Supabase y de los sitios por corredora.

---

## H-027 dividida: datos del sitio y plantillas
Detalle de la decisión en ADR-011. El orden prioriza lo que corrige un problema real: hasta ahora la marca editada quedaba solo en el navegador de quien la editaba, y una corredora nueva habría mostrado los datos de UrbeGestión.

### H-027.1 Marca en la base
**Criterios de aceptación**
1. Dado un administrador que guarda la marca, cuando otro navegador sin sesión recarga el sitio, entonces ve el cambio.
2. Dado un agente o un usuario de otra corredora, cuando intenta guardar, entonces la base lo rechaza.
3. Dado Supabase sin configurar, cuando se usa el panel, entonces todo sigue funcionando en el navegador como hoy.
4. Dado un fallo al leer o guardar, cuando ocurre, entonces el sitio no se rompe: el visitante ve los últimos datos disponibles y el administrador recibe un aviso de que no se guardó.
5. Dado el guardado, cuando el visitante recarga, entonces los colores y las secciones activas también vienen de la base.

### H-027.2 Textos como datos
**Criterios de aceptación**
1. Dada una corredora sin datos, cuando se abre su sitio, entonces muestra su nombre y una portada genérica, sin datos de otra corredora.
2. Dada una corredora sin testimonios ni "Sobre nosotros", cuando se abre su sitio, entonces esas secciones y sus enlaces no aparecen.
3. Dada una corredora sin teléfono, WhatsApp o Instagram, cuando se abre su sitio, entonces no hay botones que no llevan a ninguna parte.
4. Dados textos cargados en la base, cuando se abre el sitio, entonces cada sección los muestra.

### H-027.3 Esqueleto del sitio en Next.js
**Criterios de aceptación**
1. Dada una corredora, cuando se pide su página, entonces el HTML que entrega el servidor ya trae su nombre, sus textos y sus colores.
2. Dada una configuración incompleta o una base caída, cuando se pide la página, entonces muestra "Sitio no disponible", nunca datos ajenos.
3. Dado un cambio en la base, cuando pasa un minuto, entonces la página lo refleja sin volver a publicar.

### H-027.4 Plantilla asignada
**Criterios de aceptación**
1. Dada una corredora, cuando se lee su sitio, entonces trae su plantilla (por defecto `clasica`).
2. Dado un nombre de plantilla desconocido, cuando se abre el sitio, entonces usa la predeterminada y no se rompe.

**Resultado H-027.1 a H-027.4 (2026-11-02):** migración `20261102120000_contenido_del_sitio.sql` aplicada en desarrollo (tabla `site_content`, `get_tenant_public_site`, `set_site_brand`), con `supabase/tests/rls_sitio.sql` en verde ("RLS OK"), más la corrección `20261102130000_marca_pago_vencido.sql` (pasado el plazo de gracia tampoco se edita la marca), y la marca y los textos de UrbeGestión cargados con `supabase/seed-dev-sitio.sql`. Nuevo paquete `@portal/sitio-datos`; la tienda de marca lee y guarda en la base cuando hay `VITE_TENANT_ID`, y `apps/sitio` (Next.js 16.4.4, instalado por ADR-006) lee en el servidor. Las afirmaciones "25 años" y "42 días" salieron de los textos comunes del chat y del valorizador (se ajustó la prueba del subtítulo del valorizador, que las fijaba). La revisión independiente encontró un bloqueante, ya corregido: guardar con la lectura fallida o pendiente habría borrado datos que el formulario no muestra; ahora el formulario solo aparece tras una lectura correcta. También se corrigió: una dirección sin `https://` se completa y una inválida se avisa; no se puede guardar mientras sube una imagen; si falla la lectura, el sitio Next.js conserva la última copia buena (comprobado con una regeneración fallida en `next start`); sin calendario propio, la visita se pide con el formulario; se quitaron textos, nombres de archivo y marcadores de UrbeGestión que quedaban. De paso: subir un logo también cambia el del pie de página. Comprobado en el navegador: la consola con la corredora de desarrollo lee la marca, los textos y los 3 testimonios desde la base, y el sitio Next.js entrega el HTML con esos datos desde el servidor. **Sin probar:** guardar desde el panel con una sesión real (la regla de la base sí está probada con `rls_sitio.sql`) y ver una corredora neutra en el navegador (cubierto con pruebas de pantalla). **Fuera de alcance, para H-028:** los enlaces de WhatsApp de la ficha y la tarjeta de propiedad no se ocultan si la corredora no cargó WhatsApp; el banner "Modo Demostración Agencia IA" sigue en la landing de la consola y no debe pasar a la plantilla. El sitio aún no tiene proyecto en Vercel (ADR-010). `supabase/seed-dev-sitio.sql` trae datos reales de UrbeGestión (teléfono, correo y testimonios con nombre), los mismos que ya estaban en el código y siguen en `agencyConfig.ts` y `demoSiteContent.ts`: conviene reemplazarlos por datos de ejemplo antes de abrir el repositorio o de H-013.

## H-028 dividida: la landing como plantilla clásica

### H-028.1 Secciones de la plantilla
**Criterios de aceptación**
1. Dada una corredora con datos, cuando se abre el sitio, entonces ve su marca, colores, contacto, textos y testimonios desde el HTML del servidor.
2. Dada una corredora sin datos, cuando se abre el sitio, entonces no aparecen enlaces ni secciones vacías, ni datos de otra corredora.
3. Dada una sección apagada por la corredora, cuando se abre el sitio, entonces no aparece, tampoco en los menús.

### H-028.2 Catálogo público
**Criterios de aceptación**
1. Dada una corredora, cuando se abre el sitio, entonces el HTML ya trae solo sus propiedades publicadas dentro de sus zonas de trabajo, con columnas públicas.
2. Dado el buscador, cuando el visitante filtra por operación, tipo, comuna, dormitorios o texto, entonces ve lo que coincide y puede limpiar los filtros.
3. Dada una falla de la base, cuando se regenera la página, entonces se conserva la última copia buena y no se publica un catálogo vacío.

**Resultado H-028.1 y H-028.2 (2026-11-02):** plantilla en `apps/sitio/src/plantillas/clasica/`, catálogo en `packages/sitio-datos/src/propiedades.ts` y `apps/sitio/src/lib/getCatalogo.ts`; `matchesCommune` pasó a `@portal/mercados`. Vista en el navegador con los datos de desarrollo, en computador y celular. Sin migraciones. Fuera de esta tajada: ficha, formularios, filtro por precio, selector de moneda, chat y valorizador (H-028.3 y H-028.4).

### H-028.3 Ficha y formulario de visita
**Criterios de aceptación**
1. Dada una propiedad publicada de la corredora y dentro de sus zonas, cuando se abre su dirección, entonces la página llega pintada con sus datos, fotos y mapa.
2. Dada una propiedad de otra corredora, no publicada o fuera de zona, o una dirección inválida, cuando se abre, entonces se muestra "no disponible" y no sus datos.
3. Dado el formulario con datos válidos, cuando se envía, entonces se crea un lead de esa corredora y esa propiedad; con fecha queda como visita agendada y sin fecha como nuevo.
4. Dados datos inválidos o una falla de la base, cuando se envía, entonces la persona ve qué pasó y conserva lo escrito, sin crear nada ni registrar datos personales.

**Resultado H-028.3 (2026-11-03):** ruta `apps/sitio/src/app/propiedades/[id]`, envío en `apps/sitio/src/lib/solicitudVisita.ts`; el aviso de privacidad pasó a `@portal/sitio-datos/privacidad`. Probada de punta a punta en el navegador con la base de desarrollo: las filas de prueba quedaron correctas y se borraron. Sin migraciones. El lead también avisa al webhook si el proyecto del sitio tiene `GHL_WEBHOOK_URL`; esa parte solo está cubierta con pruebas automáticas. Fuera de esta tajada: el filtro por precio y el selector de moneda (H-051).

## H-030, H-031, H-032 y H-048: sitio listo para varias corredoras

### H-048 Vendidas, arrendadas y reservadas
**Criterios de aceptación**
1. Dada una propiedad publicada y vendida o arrendada, cuando se abre el sitio o su ficha, entonces no aparece ("no disponible").
2. Dada una reservada, entonces sigue en el catálogo y en su ficha con la etiqueta "Reservada".
3. Dado el gestor de propiedades, cuando el administrador (o quien publica directo) cambia el estado comercial, entonces se guarda y la tarjeta avisa si ya no se muestra en el sitio; el agente que solo propone no lo cambia.

### H-030 Dirección del sitio por corredora (ADR-012)
**Criterios de aceptación**
1. Dado un subdominio o dominio propio registrado, cuando alguien lo visita, entonces ve el sitio de esa corredora; un subdominio desconocido muestra "Sitio no disponible", nunca otra corredora.
2. Dada una corredora suspendida, cancelada o sin `site.enabled`, entonces su sitio no se muestra; un pago vencido no lo apaga.
3. Dado el panel, cuando el administrador guarda su subdominio y dominio, entonces se guardan en minúsculas y sin `www.`; una dirección repetida, reservada o mal escrita se explica; sin `site.custom_domain` el dominio propio queda bloqueado; con dominio escrito ve los registros DNS.
4. Dada una solicitud de visita, entonces el lead se crea en la corredora de la dirección a la que llegó.

### H-031 SEO
**Criterios de aceptación**
1. Cada página trae título, descripción, dirección canónica y vista previa para redes; cada ficha, sus datos estructurados (schema.org) con precio y disponibilidad.
2. `/sitemap.xml` lista la portada y las fichas publicadas; `/robots.txt` apunta al mapa.
3. Los previews, `localhost` y lo no disponible piden no ser indexados.

### H-032 Editor de textos del sitio
**Criterios de aceptación**
1. Dado el administrador, cuando edita la portada, "Sobre nosotros", los testimonios o el pie y guarda, entonces el sitio los muestra; la marca y los colores no cambian.
2. Puede agregar y quitar testimonios (con foto subida o por dirección) y puntos destacados; un testimonio sin nombre o comentario no se publica.
3. Un agente, otra corredora o un plan sin `branding.edit` no puede guardar; textos demasiado grandes se rechazan.

**Resultado (2026-11-03):** migraciones `20261103120000_direccion_del_sitio.sql`, `20261103130000_textos_del_sitio.sql` y `20261103140000_direccion_del_sitio_correcciones.sql` aplicadas en desarrollo, con `supabase/tests/rls_direccion_y_textos.sql` en verde ("RLS OK"). El sitio atiende cada dirección en `apps/sitio/src/app/[sitio]` (reescrita por `src/proxy.ts`; resolución en `src/lib/direccion.ts`, SEO en `src/lib/seo.ts`). Panel: "Dirección de tu sitio" en Mi corredora y "Textos del sitio" en Identidad y Marca. Probado en el navegador, en modo desarrollo y con `next start`: `urbe.localhost:3001` muestra la corredora de desarrollo, un subdominio desconocido no muestra nada, la etiqueta "Reservada" aparece, una vendida da "no disponible", el mapa del sitio y `robots.txt` responden, y una solicitud de visita creó el lead en la corredora correcta (la fila de prueba se borró). En la base de desarrollo quedó el subdominio `urbe` para la corredora de desarrollo. **Sin probar:** guardar la dirección y los textos desde el panel con una sesión real (las reglas de la base sí están probadas con SQL); un dominio propio real (falta comprar el dominio de la plataforma). **Revisión independiente:** encontró un bloqueante, ya corregido con la tercera migración: un dominio propio bloqueado por el plan (o borrado con el DNS aún apuntando) mostraba la corredora por defecto y le mandaba sus leads. Ahora la corredora por defecto solo se usa en `localhost` y en los previews, un dominio registrado nunca cae en ella y la portada de la plataforma no muestra ninguna corredora. También se corrigió: tras bajar de plan se puede cambiar el subdominio conservando el dominio guardado; no se aceptan dominios de Vercel ni de la plataforma; cada sitio tiene una sola dirección canónica (dominio propio, si no el subdominio) en metadatos, datos estructurados, mapa del sitio y `robots.txt`; marcar vendida o arrendada pide confirmación. Queda para H-055: verificar que un dominio sea de quien lo registra, y aplicar el sitio apagado también a la lectura pública y a los leads por la API. **Para después:** el aviso de "Reservada" no detiene el formulario de visita (a propósito: puede haber interés de respaldo).

## H-054 Avisos de leads nuevos

**Como** corredora **quiero** enterarme apenas alguien deja sus datos **para** responder antes que la competencia.

**Criterios de aceptación**
1. Dado el panel abierto con sesión, cuando entra un lead de la corredora (sitio, landing o chat), entonces aparece un aviso al instante y el lead se suma al CRM sin recargar; nunca llegan leads de otra corredora.
2. Dado el administrador, cuando guarda hasta tres correos y activa el aviso por correo, entonces cada lead nuevo le llega por correo con nombre, teléfono, propiedad, visita pedida y un enlace para responder por WhatsApp.
3. Dado el administrador, cuando toca "Conectar Telegram" y presiona Iniciar en el bot, entonces su chat queda conectado con un código de un solo uso que vence en 30 minutos, y desde ahí recibe los avisos; puede desconectarlo.
4. Cada lead se avisa una sola vez, aunque alguien llame a la función a mano; si el aviso falla, el lead igual queda guardado.
5. Un agente o el administrador de otra corredora no ve ni cambia los avisos.

**Resultado (2026-11-03):** migraciones `20261103150000_avisos_de_leads.sql` y `20261103160000_avisos_de_leads_correcciones.sql` aplicadas en desarrollo, con `supabase/tests/rls_avisos.sql` en verde ("RLS OK"). Funciones `alerta-lead` y `telegram-bot` desplegadas en Supabase (desarrollo), con la lógica en `supabase/functions/_compartido/avisos.ts`, y la dirección registrada en el Vault (`lead_alert_url`). Probado de punta a punta en desarrollo: un lead insertado hizo que la base llamara a la función, que lo marcó como avisado (el lead de prueba se borró). Panel: "Avisos de leads nuevos" en Mi corredora y aviso en vivo en el panel. **Revisión independiente:** sin bloqueantes ni fugas entre corredoras. Se corrigió: tope de 20 avisos por corredora cada 10 minutos (una ráfaga de leads falsos ya no agota el cupo de correos de la plataforma; los leads igual se guardan), un lead avisado no vuelve a "sin avisar", guardar los correos no apaga un Telegram recién conectado, el aviso en vivo no sale por un lead que ya estaba en la lista, un lead que llega en vivo mientras se lee la lista no se pierde, la llamada a la función espera hasta 20 segundos y los leads anteriores quedaron marcados como avisados. **Riesgo aceptado:** al publicar `leads` en Realtime, Supabase entrega los borrados sin filtrar por RLS, así que un suscriptor puede ver el identificador (solo el UUID) de un lead borrado. **Sin probar:** el envío real por correo y por Telegram (faltan las claves de Resend y del bot, guía en `docs/guia-avisos.md`) y el aviso en vivo con una sesión real.

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

**Avance H-037 y H-038 (2026-11-01):** código listo y probado (228 pruebas, tipos, lint y build en verde): estados de publicación (borrador, en revisión, publicada, rechazada), el sitio y el chat muestran solo lo publicado, el agente crea en borrador y envía a revisión, el administrador aprueba o rechaza con motivo, y desde un lead de propietario se crea una propiedad en borrador sin copiar las fotos del propietario. **Migración `20261101150000_publicacion_aprobacion.sql` aplicada en el Supabase de desarrollo el 2026-11-01** (estados, quién creó y aprobó, registro de eventos, reglas por disparador, columna `converted_property_id` en leads) y `supabase/tests/rls_publicacion.sql` en verde ("RLS OK"). Pendiente: probar a mano el flujo en la consola antes de pasar a "hecha".

**Ajuste H-037 (2026-11-01, pedido del responsable):** el flujo es configurable por corredora (`tenants.publication_mode`): `con_aprobacion` (el administrador aprueba lo que proponen los agentes; corredoras grandes) o `directa` (cada agente publica lo suyo y queda registrado como responsable; corredoras de una o dos personas). El administrador siempre puede publicar, editar y borrar cualquier propiedad. Solo el administrador cambia el modo (sección "Cómo se publican las propiedades" en Integraciones; función `set_publication_mode`). Refinamiento futuro posible: permiso de publicar por agente (hoy es por corredora).

**Avance H-040 (2026-11-01):** paquete de mercado Chile con las 16 regiones y 346 comunas (`src/markets`), interfaz `MarketPack`, tienda `useMarketStore` (mercado y zonas de la corredora; el sitio público los lee con la función `get_tenant_public_settings`), sección "Dónde trabaja tu corredora" en Integraciones (solo administrador) y buscador, formulario de propiedades, valorizador, chat y mapa que usan esas zonas. La comuna pasa a ser un campo obligatorio (antes venía preseleccionada Las Condes). Pendiente para H-032: los textos de marca que mencionan Santiago (portada, "Sobre nosotros", pie de página, testimonios) son contenido de cada corredora y se editarán desde el editor del sitio.

**Avance H-041 (2026-11-01):** el precio de una propiedad se guarda con su moneda (`price_amount` + `price_currency`; migración aplicada en desarrollo, los 8 precios existentes pasaron idénticos como UF, con prueba en `supabase/tests/precio_moneda.sql`). Nuevo módulo `src/core/money` (formato, conversión entre monedas con las tasas del mercado y comparación) y el paquete de mercado define sus monedas (Chile: UF y CLP). El formulario de propiedades pide monto y moneda; el catálogo ordena por valor real aunque haya precios en monedas distintas; la exportación trae precio y moneda en columnas separadas. Corrige además un error previo: el filtro de precio comparaba siempre contra UF aunque el visitante estuviera viendo pesos. Pendiente (no urgente): las tasas de cambio de cada corredora (hoy la UF sale de Integraciones) y borrar de `agencyConfig` el valor fijo `ufValueClp` cuando exista el paquete de tasas (H-011).

**Avance H-010.1 y H-011 (2026-11-01):** el paquete de mercado de Chile (`src/markets/cl`) ya reúne ubicaciones (16 regiones, 346 comunas), monedas (UF y peso), textos propios por idioma ("región", "comuna" / "region", "commune"), alias de comunas para el chat, sectores del filtro, prefijo y ejemplo de teléfono. Queda como decisión tuya la elección del **segundo mercado** (Blueprint sección 6: México, Colombia, Perú o Argentina; criterios: tamaño del mercado, parecido de los procesos y acceso a corredores piloto); el validador del documento de identidad (RUT en Chile) se agregará cuando algún formulario lo pida.

**Ajustes tras la prueba de H-040 y H-041 (2026-11-01, pedidos del responsable):** (1) los montos se escriben con puntos de miles mientras se tipea (campo `NumberInput`, con el cursor junto al dígito escrito, que se puede vaciar del todo y que ya no parte con un 12.000 inventado); lo usan el precio del formulario y los filtros de precio; (2) al elegir zonas de trabajo, el sitio ahora también **muestra solo las propiedades de esas zonas** (antes solo acotaba las listas del buscador): buscador, grilla y chat comparten `useOfferedProperties`; si aún no hay propiedades en la zona, el sitio lo dice; en el panel, las propiedades que quedan fuera llevan la marca "Fuera de tus zonas" (siguen ahí para poder editarlas). Las direcciones de las propiedades de ejemplo siguen siendo de Santiago porque son datos de ejemplo.

**Avance H-010.2 (2026-11-01):** la tarjeta de propiedad (incluido el mensaje que se comparte por WhatsApp, que ahora usa el nombre de la corredora configurado: "Hola Pilar Osorio…" en vez del "Hola Pilar" fijo), la barra de navegación y la barra móvil usan textos con clave en español e inglés, con pruebas en ambos idiomas.

**Cierre H-010.2 (2026-11-01):** la agenda de visitas y la ficha de propiedad usan textos con clave en español e inglés. La ficha no tenía pruebas: se escribieron 15 de caracterización antes de traducirla (más 3 en inglés). Los textos de marca que mencionan a la corredora (nombre, "Hola Pilar Osorio") salen de la configuración de la corredora y no están escritos en los textos. Las notas que se guardan dentro de cada contacto ("Visita solicitada para…") siguen en español: son datos del CRM, no texto de pantalla.

**Cierre H-010.3 (2026-11-01):** el chat y el valorizador usan textos con clave en español e inglés. El motor local reconoce las intenciones y las palabras de tipo y operación en ambos idiomas y responde en el idioma activo; el mensaje de bienvenida se traduce al cambiar de idioma sin perder la conversación; las sugerencias salen de las propiedades publicadas. El subtítulo del valorizador dejó de decir "Región Metropolitana" fijo y nombra el alcance de la corredora. Quedan en español, por decisión: el aviso de privacidad (texto legal con versión: cada idioma y país necesita revisión legal, H-012) y las afirmaciones de marca dentro de las respuestas del chat ("más de 25 años", "42 días"), que pasarán al contenido de cada corredora con H-032.


## H-056 a H-060 Captación y CRM del primer piloto

Elegidas por el responsable el 2026-11-04 (propuesta: tareas, línea de tiempo, atribución, agenda y reportes). Fuera del primer piloto, sin descartarlas: asignación de leads, pipelines por tipo de cliente, WhatsApp automático y consultas de portales por correo.

### H-056 Próxima acción por contacto
**Como** corredor **quiero** anotar qué haré con cada contacto y para cuándo **para** que ningún lead se enfríe.

**Criterios de aceptación**
1. Dado un lead abierto, cuando escribo una acción ("Llamar para confirmar visita") y una fecha y guardo, entonces queda en el lead, se ve en su tarjeta y sobrevive a recargar la página.
2. Dado un lead con acción pendiente, cuando la marco como hecha, entonces la acción se borra y queda una nota con la fecha ("Hecho: …") en el historial.
3. Dado el CRM, cuando miro el recuadro "Para hoy", entonces veo primero las acciones vencidas, luego las de hoy y luego los leads sin acción; los leads cerrados o descartados no aparecen.
4. Dado un lead con acción de fecha pasada, entonces se muestra como "Vencida" en rojo; una de hoy, como "Hoy"; una futura, con su fecha.
5. Dado una acción sin texto o con una fecha inválida, cuando intento guardar, entonces no se guarda.

**Fuera de alcance:** varias tareas por lead, avisos por correo del vencimiento, asignar a otro agente.
**Tamaño:** M. **Nota de datos:** requiere columnas `next_action_text` y `next_action_due` en `leads` (migración nueva, se muestra el SQL antes de aplicar).

### H-057 Línea de tiempo del contacto
1. Dado un lead, cuando registro una llamada, WhatsApp, correo, visita o nota, entonces aparece en un historial ordenado, con tipo, fecha y quién lo registró.
2. Dado las notas actuales (arreglo dentro del lead), entonces siguen en la Bitácora sin cambios; el historial nuevo es aparte y solo se agrega.
3. Dado un cambio de estado, entonces queda un evento automático en el historial.

### H-058 Atribución
1. Dado un visitante que llega al sitio con parámetros `utm_source`, `utm_medium` y `utm_campaign`, cuando deja sus datos, entonces el lead guarda esos valores.
2. Dado un lead de una ficha, entonces guarda la propiedad consultada; sin parámetros, la fuente queda como "Directo".
3. Dado el CRM, entonces la fuente y la campaña se ven en la ficha del lead y salen en el CSV.

### H-059 Agenda de visitas
1. Dado leads con visita agendada, cuando abro la agenda, entonces veo un calendario del mes con la cantidad de visitas por día y, al elegir un día, la lista con hora, contacto y propiedad (la vista por semana queda para después).
2. Dado una visita, cuando cambio su fecha u hora desde la agenda, entonces el lead se actualiza.
3. Dado dos visitas a la misma hora, entonces se avisa del choque.

### H-060 Reportes básicos
1. Dado el CRM, cuando abro Reportes, entonces veo cuántos leads hay por etapa y la conversión entre etapas.
2. Veo leads por origen y por campaña con su tasa de cierre (el reporte por agente queda fuera del piloto: el lead aún no tiene agente asignado).
3. Veo el tiempo promedio hasta el primer contacto y cuántos leads nuevos llevan más de 24 horas sin contactar; si el historial no cargó o los datos están incompletos, el reporte lo dice.

**Resultado H-056 (2026-11-04):** `leadTasks.ts` (estados y orden de "Para hoy"), `setNextAction` y `completeNextAction` en la tienda, columnas en el repositorio y componentes en `NextAction.tsx`. 89 pruebas del CRM nuevas y viejas en verde. **Revisión independiente:** sin bloqueantes; se corrigió el orden remoto (primero se limpia la acción, luego se agrega la nota), la fecha por defecto se calcula al guardar y la migración impide que un visitante siembre una acción al crear un lead. **Migración `20261104130000_leads_proxima_accion.sql` aplicada en desarrollo (2026-11-04) y verificada: dos columnas y política nueva.** **Limitación:** con dos agentes editando la misma acción gana el último que guarda.

**Resultado H-057 (2026-11-04):** tabla `lead_events` (migración `20261104140000_historial_de_contacto.sql` aplicada en desarrollo, con `supabase/tests/rls_historial.sql` en verde: "RLS OK"), repositorio, tienda `useTimelineStore`, componente `Timeline` en la ficha y evento automático al cambiar de etapa. 985 pruebas en verde. **Revisión independiente:** pidió cambios y se atendieron todos: el autor y la fecha de registro los fija un disparador de la base (antes eran falsificables) y se quitó una subconsulta que impedía aplicar la migración; si la base no guarda un contacto se quita de la pantalla y se avisa; un `load` en medio de un guardado ya no borra el contacto; en modo base, el cambio de etapa se anota solo si quedó guardado; borrar un lead borra su historial local; orden por fecha real, autor vacío sin puntos sueltos, aviso de tope de 200 y de que la Bitácora es aparte. La prueba RLS confirma que se rechazan las inserciones de visitantes, de otra corredora y con un lead ajeno, que el autor y la fecha no se falsifican y que el historial no se edita ni se borra.

**Resultado H-058 (2026-11-04):** el proxy del sitio recuerda 30 días (cookie `atribucion`, httpOnly, sin datos personales) los `utm_source`, `utm_medium` y `utm_campaign` del enlace; las acciones del sitio la pasan a la visita, el chat y la tasación, que la guardan en `leads.attribution`. Módulo compartido `packages/sitio-datos/src/atribucion.ts`. En el CRM: "Llegó por" en la ficha y tres columnas en el CSV. La propiedad consultada ya se guardaba (`property_id`, `property_title`). Modelo de último toque: un enlace nuevo con utm reemplaza al anterior (útil recordarlo en H-060). **Revisión independiente:** sin bloqueantes; se atendió la sanitización al leer y en la base (la columna solo admite las tres claves con texto), el aviso de privacidad menciona el origen de la campaña (versión `2026-11-04`) y se unificó la etiqueta. **Antes de publicar el sitio:** aplicar la migración primero (sin la columna, un lead con campaña no se guardaría); comprobar en el preview de Vercel que una página con `?utm_source=x` no quede en caché con su cookie (probar con `curl -I` dos veces y una tercera sin utm); el aviso de cookies queda con la revisión legal previa al despliegue. **Fuera de esta historia:** leads de la landing de la consola y envío de la atribución al webhook externo.

**Resultado H-059 (2026-11-04):** vista "Agenda" en el CRM (calendario mensual, lista del día, reagendar con fecha y hora, aviso de choque de horario), `leadAgenda.ts` y `rescheduleVisit` en la tienda. Reagendar deja el cambio de etapa y la visita en el historial; si no cambia nada, no escribe. Sin migración nueva. **Revisión independiente:** sin bloqueantes; se atendió el cambio de mes (el día elegido queda dentro del mes), el salto del calendario y el aviso al reagendar, la accesibilidad (choque en la etiqueta del día, botones "Abrir" distinguibles, mensajes de estado y error) y la fecha legible. **Criterios de decisión anotados:** el choque de horario no mira el agente (con varios agentes puede avisar de más); la búsqueda y los filtros del CRM no afectan a la agenda; se acepta reagendar a fechas pasadas sin advertir.

**Resultado H-060 (2026-11-04):** vista "Reportes" en el CRM con selector de período (7, 30, 90 días o todo), embudo con conversión entre etapas, cierre por origen y por campaña, y tiempos de respuesta (`leadReports.ts`, `Reports.tsx`, `loadAll` y `listAll` para traer los contactos de la corredora, `createdAtIso` con la hora exacta de registro). Sin migración nueva. **Decisión de alcance:** el criterio "por agente" no se hizo porque el lead no tiene agente (asignación de leads queda fuera del primer piloto). **Revisión independiente:** sin bloqueantes y fórmulas correctas; se atendió que el reporte avise si el historial está cargando, falló o llegó al tope de 5000 contactos (solo se piden llamadas, WhatsApp, correos y visitas), cuántos leads sin hora exacta no se midieron y que un lead movido de etapa sin contacto registrado no cuenta como atendido. Los leads anteriores a esta historia no tienen hora exacta y quedan fuera del promedio. **Panel a pantalla completa:** `AdminDashboard` dejó de ser una ventana flotante y ocupa toda la pantalla; falta mirar a mano las pantallas de ingreso y de clave nueva, que ahora ocupan todo el ancho.

### H-061 Dashboard de gestión de leads (propuesta, 2026-11-04)

**Investigación de mercado (blogs de proveedores de CRM inmobiliario, no estudios independientes; las cifras de referencia son orientativas):** los indicadores que más se repiten son la **velocidad de respuesta** (se apunta a minutos, no horas), la **conversión de lead a visita**, el **embudo por etapa**, la **disciplina de seguimiento** (se dice que la mayoría de las operaciones se pierden por falta de respuesta), la **conversión por fuente**, el **costo por lead por fuente** y el **tiempo hasta el cierre**. Se recomienda una mirada diaria rápida y una revisión semanal más profunda.

**Indicadores propuestos, por nivel:**
- *Núcleo (ya tenemos los datos):* tiempo hasta el primer contacto (mostrar en minutos si es menor a dos horas) y leads sin contactar; embudo y conversión lead a visita; leads sin próxima acción y acciones vencidas (H-056); cierre por origen y campaña; visitas agendadas y reagendadas.
- *Falta capturar un dato:* tiempo promedio hasta el cierre (el dato de fecha de cierre se guarda hoy solo como historial de etapa); motivo de descarte de un lead (por ejemplo "no respondió", "compró en otro lado", "sin presupuesto").
- *Necesita dato del responsable:* costo por lead y por campaña (requiere anotar la inversión de cada campaña a mano).
- *Fuera del MVP (Blueprint v2):* ofertas, comisiones esperadas, valor por operación.

**Criterios de aceptación (borrador):**
1. Dado el dashboard, cuando lo abro, entonces veo arriba de 4 a 6 tarjetas con los números clave del período elegido y su comparación con el período anterior.
2. Dado el embudo, entonces lo veo como barras y puedo ver dónde se caen más leads.
3. Dado el período, entonces veo los leads que entran por semana y su origen.
4. Dado un indicador sin datos suficientes, entonces dice por qué en vez de mostrar cero.
**Pendiente:** el responsable confirma la lista de indicadores antes de construir.

**Resultado primera tajada (2026-11-08):** la vista Reportes del CRM abre con seis tarjetas (leads nuevos, de lead a visita, primer contacto en minutos si es menor a dos horas, sin contactar hace más de 24 h, seguimiento con acciones vencidas y contactos sin próxima acción, y visitas de los próximos 7 días), cada una con su comparación con el período anterior cuando existe; sin base de comparación o sin datos lo dice en vez de mostrar cero. Debajo, leads por semana (barras con el origen al pasar el cursor) y el embudo con barras. Funciones puras con pruebas en `leadReports.ts`, pantalla en `DashboardSummary.tsx`; sin migración. Se construyó con los indicadores del núcleo, que no necesitan datos nuevos; **Segunda tajada (2026-11-09, aprobada por el responsable):** tiempo hasta el cierre (el CRM guarda `closed_at` al pasar a Cerrado y lo borra al salir) y motivo de descarte (selector en la ficha del contacto descartado), con dos tarjetas nuevas. Migración `20261109100000_leads_cierre_y_descarte.sql` aplicada en desarrollo (cuenta B) y verificada: dos columnas opcionales; los cerrados anteriores no tienen fecha y no se miden. **Falta aplicarla en producción antes de desplegar.** Decisión del responsable (2026-11-09): el costo por lead queda **opcional y para después** (parking lot; si se hace, que sea un campo opcional de inversión por campaña, sin obligar a llenarlo). Sigue pendiente (tiempo hasta el cierre y motivo de descarte necesitan guardar un dato nuevo; costo por lead necesita que se anote la inversión de cada campaña) y decidir si la pestaña Métricas se une a esta vista o se deja aparte.

## Bloque "Seguridad y salida a producción" (2026-11-04)

Orden de trabajo acordado con el responsable: H-004, H-052 (con la parte de leads de H-055), H-047, H-005, producción, H-013 y calidad (H-019, H-023, H-024). Se construyó todo lo que se puede hacer en el repositorio y en la base de desarrollo; **no se desplegó nada ni se tocó producción**. Quedan en manos del responsable: crear la base de producción y cargar las claves (H-062), la orden de despliegue (H-013), el tope firme en el firewall de Vercel, la revisión legal del aviso de privacidad y de la cookie de campaña, y decidir cómo se hace la prueba de punta a punta (H-023).
