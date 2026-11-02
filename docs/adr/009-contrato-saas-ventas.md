# ADR-009: El control comercial vive en el proyecto de ventas; el SaaS y ventas se hablan por un contrato de variables versionado y ampliable

- Estado: aceptada (aprobada por el responsable el 2026-11-01; la migración y los endpoints de H-043.2 requieren su aprobación aparte)
- Fecha: 2026-11-01

## Contexto
El producto se vende con un funnel y una landing de ventas que el responsable gestiona en un proyecto aparte. Hay que decidir dónde viven las suscripciones, la facturación, los datos de contacto de los clientes y las métricas del negocio (cuántas corredoras, altas, bajas, ingresos), y cómo se enteran el uno del otro. El responsable pidió dos cosas: que una caída del lado de ventas no afecte al SaaS, y que el contrato entre ambos admita variables nuevas sin rehacerlo, porque eso también servirá para prender, apagar o personalizar paquetes de venta.

## Opciones consideradas
| Opción | A favor | En contra | Costo |
| --- | --- | --- | --- |
| A. Todo el control comercial dentro del SaaS | Un solo lugar | Mezcla producto con negocio; una falla de cobro o de ventas puede afectar al SaaS; datos de clientes junto a datos de terceros | Alto y creciente |
| B. Control comercial en el proyecto de ventas; contrato mínimo entre ambos (recomendada) | Aislamiento de fallas y de datos; cada proyecto cambia a su ritmo | Hay que mantener un contrato entre los dos | Bajo-medio |
| C. Dos sistemas sin contrato (carga manual) | Cero desarrollo | No escala; los paquetes no se pueden prender o apagar solos | Bajo hoy, alto después |

## Decisión (propuesta)
Se elige la opción B, con estas reglas.

### 1. Quién es dueño de qué
- **Ventas:** planes y precios, suscripciones, cobros y facturas, contacto y seguimiento del cliente, métricas del negocio. Define qué incluye cada paquete.
- **SaaS:** corredoras y sus datos (propiedades, leads, notas), y la aplicación de lo que ventas dispone (qué funciones y límites tiene cada corredora). No conoce precios ni cobros.
- Los datos de las corredoras (contenido de leads, propiedades, notas) **nunca** salen hacia ventas; solo salen números agregados.

### 2. Regla de aislamiento
El SaaS no depende de ventas para funcionar. Guarda el último estado recibido y lo aplica; si ventas no responde, nada cambia. El SaaS nunca llama a ventas durante una acción de un usuario.

### 3. Contrato versionado (`contract_version`, hoy 1)
Reglas para que sea ampliable:
- Cada variable tiene una **clave estable** (por ejemplo `limit.agents`), un tipo, un valor por defecto y una descripción, en un catálogo único en el código del SaaS (`src/core/platform/contract.ts`) y en este documento.
- **Agregar una variable no rompe nada:** quien recibe ignora las claves que no conoce; quien no recibe una clave usa su valor por defecto.
- **Nunca se renombra ni se reutiliza una clave.** Si deja de servir, se marca como obsoleta y se sigue aceptando.
- Un cambio que sí rompa (cambiar el significado de una clave) sube `contract_version`.
- Los permisos del producto se consultan siempre con dos funciones, `can('clave')` y `limit('clave')`, y nunca mirando el nombre del plan. Así un paquete se arma o se personaliza cambiando datos, no código.

### 4. Dirección ventas → SaaS (se aplica en el SaaS)
| Variable | Tipo | Significado |
| --- | --- | --- |
| `tenant_ref` | texto | Identificador de la corredora en ventas |
| `name`, `admin_email`, `market` | texto | Datos para dar de alta la corredora (hoy lo hace H-008.7) |
| `plan_code` | texto | Nombre del paquete (informativo; no se usa para decidir permisos) |
| `status` | `trial` · `active` · `past_due` · `suspended` · `cancelled` | Estado de la suscripción |
| `trial_ends_at`, `grace_ends_at` | fecha | Fin de la prueba y del plazo de gracia |
| `features` | mapa clave → sí/no | Funciones prendidas o apagadas |
| `limits` | mapa clave → número (vacío = sin límite) | Cupos |
| `contract_version`, `updated_at` | número, fecha | Versión y orden de llegada (se ignora un mensaje más antiguo que el último) |

Lo que ventas envía ya viene **resuelto** (paquete + ajustes particulares de esa corredora): el SaaS no recalcula nada. Personalizar un paquete para un cliente es cambiar su mapa en ventas.

Comportamiento por estado (propuesta): `trial` y `active` completo; `past_due` completo con aviso en el panel hasta `grace_ends_at`; `suspended` panel en solo lectura y sitio público visible; `cancelled` solo exportación de datos y borrado a los N días acordados.

Claves iniciales (todas con valor por defecto en el catálogo):
- Funciones: `site.enabled`, `site.custom_domain`, `ai.chat`, `ai.llm_server`, `crm.export`, `valuation.owner_form`, `publication.approval_flow`, `branding.edit`, `widget.embed`.
- Cupos: `limit.agents`, `limit.properties_published`, `limit.leads_per_month`, `limit.ai_messages_per_month`, `limit.storage_mb`.

### 5. Dirección SaaS → ventas (solo agregados, por corredora y de la plataforma)
| Variable | Significado |
| --- | --- |
| `tenant_ref` | A qué corredora corresponde |
| `agents_count` | Agentes activos |
| `properties_total`, `properties_published` | Propiedades |
| `leads_30d`, `leads_total` | Leads (solo la cantidad) |
| `ai_messages_30d`, `storage_mb` | Uso de IA y de archivos |
| `last_login_at`, `last_activity_at` | Actividad |
| `captured_at`, `contract_version` | Cuándo se midió |
| Plataforma: `tenants_total`, `app_version`, `health` | Salud del conjunto |

### 6. Cómo viajan
- **Ventas → SaaS:** una llamada HTTPS firmada a `api/platform/tenant-sync` (secreto compartido en variables de entorno del servidor, nunca en el cliente). Es idempotente: repetirla no cambia nada.
- **SaaS → ventas:** ventas **consulta** (`GET api/platform/metrics`, con token); el SaaS no empuja. Así el SaaS no depende de que ventas esté arriba.
- En la base del SaaS: una tabla `tenant_entitlements` (corredora, estado, `features` y `limits` como JSON, versión, fecha). Ampliar el catálogo no requiere migración.

### 7. Cómo se agrega una variable nueva
1. Escribirla en el catálogo (`contract.ts`) con clave, tipo, valor por defecto y descripción; agregarla a este documento.
2. Usarla en el producto con `can()` o `limit()`.
3. Cuando ventas la empiece a enviar, ya se aplica; mientras tanto vale el valor por defecto.
Una prueba automática comprueba que toda clave usada en el código exista en el catálogo.

## Consecuencias
- **H-033 (planes y límites)** se reduce a aplicar el contrato: `can()`/`limit()` y los avisos. Los planes y precios se definen en ventas.
- **H-036 (portal del dueño)** deja de ser un panel comercial: queda solo lo operativo del SaaS (salud, suspender una corredora, ver agregados) y el alta de corredoras pasa a ser una función que ventas llama.
- **Sin clientes aún:** no se construye un panel comercial propio todavía; para los primeros clientes bastan el panel del medio de cobro y una planilla en ventas. Lo único que se construye antes es el contrato.
- Costo: hay que mantener el catálogo y el contrato al día, y probar que ambos lados lo respetan.

## Implementación (2026-11-01)
- H-043.1: catálogo y funciones en `src/core/platform/`. H-043.2: tabla `tenant_entitlements` (migración `20261101230000`), `api/platform/tenant-sync` (HMAC-SHA256 con marca de tiempo de 5 minutos, idempotente y en orden por `updatedAt`) y `api/platform/metrics` (token; función SQL `platform_metrics()` que solo ejecuta la clave de servicio). Guía para el lado de ventas: docs/integracion-ventas.md.
- Mientras la corredora no tenga fila de derechos (o no haya Supabase), el panel usa los valores por defecto: todo prendido.
- Pendiente (H-043.3): alta de corredora llamada desde ventas, y medir `ai_messages_30d` y `storage_mb`.

## Revisión
Revisar cuando haya diez clientes de pago o si aparece una variable que no cabe en `features`/`limits`.
