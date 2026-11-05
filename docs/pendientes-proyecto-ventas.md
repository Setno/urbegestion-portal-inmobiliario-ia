# Pendientes del lado de ventas (para la otra sesión)

Documento vivo. Reúne lo que hay que hacer **en el proyecto de ventas** para conectarlo con el SaaS (ADR-009), y lo que queda pendiente de este lado. Se actualiza cada vez que cambia el contrato. Última revisión: 2026-11-01.

> Cómo usarlo: copia la sección "Texto para pegar en la sesión de ventas" al inicio de esa sesión. Los detalles técnicos están en [integracion-ventas.md](integracion-ventas.md) y en el [ADR-009](adr/009-contrato-saas-ventas.md); si cambian, se actualizan aquí también.

## Idea en una frase
Ventas es dueña del negocio (planes, precios, cobros, clientes). El SaaS es dueño del producto. Se hablan por dos puertas: ventas **avisa** el plan y el estado de cada corredora, y ventas **consulta** números agregados. El SaaS nunca depende de ventas para funcionar.

## A. Antes de empezar (lo hace el responsable)
- [ ] Crear dos claves largas al azar, distintas entre sí (comando en la conversación; guardarlas en un gestor de contraseñas):
  - `PLATFORM_SYNC_SECRET`: firma de los avisos de ventas al SaaS.
  - `PLATFORM_METRICS_TOKEN`: acceso de ventas a las métricas.
- [ ] Cargar **las dos** como variables de entorno del servidor en el proyecto de Vercel del SaaS (entorno Preview; Production solo al desplegar a producción) y volver a desplegar el preview (se pide en la sesión del SaaS).
- [ ] Cargar **las mismas dos** como variables de entorno del servidor en el proyecto de ventas. Nunca en el navegador, nunca con prefijo `VITE_` o `NEXT_PUBLIC_`, nunca en el repositorio.
- [ ] Anotar la dirección del SaaS (preview hoy: `https://portal-inmobiliario-ia-git-main-setno.vercel.app`; la de producción cuando exista).

## B. Qué guardar en ventas por cada corredora cliente
| Dato | Para qué |
| --- | --- |
| `tenantRef` | Identificador propio de ventas para esa corredora (el que ventas prefiera) |
| `tenantId` | Identificador de la corredora en el SaaS (UUID). Se obtiene de `GET /api/platform/metrics`, que lista todas las corredoras con su `tenantId` y su nombre |
| Plan contratado | Define qué funciones y cupos le corresponden |
| Ajustes particulares | Excepciones del cliente sobre su plan (una función extra, más agentes, etc.) |
| Estado de la suscripción | `trial`, `active`, `past_due`, `suspended`, `cancelled` |
| Fechas | Fin de la prueba y fin del plazo de gracia |
| Fecha del último aviso enviado | Para que cada aviso nuevo lleve una fecha mayor que el anterior |

Los **planes** se definen en ventas como un conjunto de funciones prendidas y cupos. El SaaS no conoce nombres de plan ni precios: recibe el resultado ya calculado (plan más ajustes del cliente).

## C. Enviar avisos al SaaS (`POST /api/platform/tenant-sync`)
- [ ] Armar el mensaje con `tenantId` (o solo `tenantRef` una vez vinculado), `planCode`, `status`, `trialEndsAt`, `graceEndsAt`, `features`, `limits`, `contractVersion: 1` y `updatedAt`.
- [ ] Firmarlo: `X-Timestamp` (milisegundos) y `X-Signature` = `sha256=` + HMAC-SHA256 de `"<timestamp>.<cuerpo exacto>"` con `PLATFORM_SYNC_SECRET`. Ejemplo en Node en [integracion-ventas.md](integracion-ventas.md).
- [ ] `updatedAt` **siempre mayor** que el del aviso anterior de esa corredora; un aviso más antiguo se ignora.
- [ ] Enviar un aviso cuando ocurra cualquiera de estos eventos: alta de la corredora, pago confirmado, pago atrasado (con fecha de gracia), suspensión, reactivación, cancelación, cambio de plan, ajuste particular.
- [ ] Reintentar si falla la red. Es seguro repetir el mismo mensaje.
- [ ] Interpretar las respuestas: `200` (si `applied: false` con `stale`, el aviso era antiguo), `401` firma inválida o caducada, `404` corredora desconocida, `409` referencia ya usada por otra corredora.

Qué hace el SaaS con cada estado:
| Estado | Efecto |
| --- | --- |
| `trial`, `active` | Todo funciona |
| `past_due` | Todo funciona con aviso en el panel; pasado `graceEndsAt` queda como suspendida |
| `suspended` | Panel en solo lectura; descarga de datos activa; sitio público visible y recibiendo leads |
| `cancelled` | Solo descarga de datos |

## D. Consultar métricas (`GET /api/platform/metrics`)
- [ ] Consultar con `Authorization: Bearer <PLATFORM_METRICS_TOKEN>`, por ejemplo una vez al día.
- [ ] Guardar el resultado en ventas con su fecha para tener historial (el SaaS solo entrega la foto de hoy).
- [ ] Datos disponibles por corredora: agentes, propiedades totales y publicadas, leads de 30 días y totales, último ingreso y última actividad. De la plataforma: cantidad de corredoras, versión y salud.
- [ ] Ideas de uso: detectar clientes inactivos (sin ingreso hace semanas), clientes cerca de su cupo (propuesta de plan mayor), uso real para decidir precios.
- [ ] No llegan nombres de leads ni contenido de propiedades, y no deben pedirse.

## E. Alta de corredoras
Hoy el alta es **manual**: el dueño del producto entra al panel del SaaS, pestaña **Plataforma**, escribe el nombre de la corredora y el correo de su administrador, y el SaaS le envía la invitación. Después de eso:
- [ ] Obtener el `tenantId` de la corredora nueva desde las métricas (buscar por nombre).
- [ ] Guardar el vínculo `tenantRef` y `tenantId` en ventas y enviar el primer aviso.
- Pendiente a futuro (H-043.3): que ventas pueda dar el alta directamente por una llamada firmada. Cuando esté, se reemplaza este paso manual.

## F. Catálogo de claves vigente (contrato v1)
Funciones (sí/no), todas prendidas por defecto si ventas no las menciona:
- `site.enabled`: sitio web propio. Reservada.
- `site.custom_domain`: dominio propio. Reservada.
- `ai.chat`: asistente de chat en el sitio. **Se aplica.**
- `ai.llm_server`: modelo de lenguaje en el servidor (si no, motor local). **Se aplica.**
- `crm.export`: descarga de propiedades, contactos y notas. **Se aplica.**
- `valuation.owner_form`: formulario de propietarios. **Se aplica.**
- `publication.approval_flow`: flujo de aprobación de publicaciones. Reservada.
- `branding.edit`: edición de identidad y marca. **Se aplica.**
- `widget.embed`: widget para el sitio actual de la corredora. Reservada.

Cupos (número; vacío = sin límite):
- `limit.agents`: agentes. **Se aplica** (el servidor no invita sobre el cupo).
- `limit.properties_published`: propiedades publicadas a la vez. **Se aplica** (panel y base).
- `limit.leads_per_month`: **no se bloquea a propósito**; ventas puede usar las métricas para avisar o cobrar.
- `limit.ai_messages_per_month`, `limit.storage_mb`: todavía no se miden.

Se pueden enviar claves nuevas antes de que el SaaS las use: se guardan y esperan. Para crear una variable nueva se sigue el procedimiento del ADR-009.

## G. Pruebas para hacer juntos cuando esté conectado
1. Aviso de una corredora de prueba con estado `active` y el chat apagado: el sitio no muestra el botón del asistente.
2. Cambiar a `past_due` con fecha de gracia: aparece el aviso amarillo en el panel.
3. Cambiar a `suspended`: el panel queda en solo lectura y la descarga de datos sigue activa.
4. Cambiar a `cancelled`: solo se ve "Mi corredora" con la descarga de datos.
5. Volver a `active`: todo se normaliza.
6. Enviar un aviso con fecha anterior: el SaaS responde `applied: false` y no cambia nada.
7. Cupo de agentes en 1: la segunda invitación se rechaza.
8. Consultar las métricas y comprobar que no llegan datos de leads ni de propiedades.
9. Probar una firma equivocada: responde `401`.

## H. Reglas que no se negocian
- Ningún dato de clientes finales (leads, notas, propiedades) va a ventas, solo agregados.
- Las claves solo viven en el servidor y en el gestor de contraseñas del responsable.
- Si ventas se cae, el SaaS sigue funcionando con el último estado recibido.
- Un estado desconocido o dato ilegible nunca deja a una corredora sin servicio.

## I. Pendientes de este lado (SaaS) que dependen del responsable
- [ ] Cargar las dos claves en Vercel y avisar para volver a desplegar el preview (ver sección A).
- [ ] Decidir si los leads deben tener tope por plan (hoy no se bloquean).
- [ ] H-043.3: alta de corredora llamada desde ventas, y medir mensajes de IA y almacenamiento.
- [ ] Probar en el preview los estados de suscripción con una fila de derechos de prueba.

---

## Texto para pegar en la sesión de ventas

> Estoy construyendo un SaaS inmobiliario (proyecto "portal-inmobiliario") y este proyecto de ventas debe conectarse con él por un contrato versionado (v1). Reglas: ventas es dueña de planes, precios, cobros, clientes y métricas del negocio; el SaaS nunca depende de ventas para funcionar.
>
> Lo que ventas debe hacer: (1) guardar por cada corredora cliente su `tenantRef`, su `tenantId` del SaaS, su plan, sus ajustes particulares, el estado de suscripción (`trial`, `active`, `past_due`, `suspended`, `cancelled`) y sus fechas; (2) definir los planes como conjuntos de funciones (sí/no) y cupos (número o vacío = sin límite) con las claves del contrato; (3) enviar avisos firmados al SaaS en `POST /api/platform/tenant-sync` cada vez que cambie el plan o el estado, con `updatedAt` siempre creciente (firma HMAC-SHA256 hexadecimal de `"<X-Timestamp>.<cuerpo>"` con `PLATFORM_SYNC_SECRET`, encabezados `X-Timestamp` en milisegundos y `X-Signature: sha256=<hex>`); (4) consultar a diario `GET /api/platform/metrics` con `Authorization: Bearer <PLATFORM_METRICS_TOKEN>` y guardar el historial (devuelve solo cantidades y fechas por corredora).
>
> Las dos claves son variables de entorno del servidor (nunca en el navegador). Los detalles, el catálogo de claves y las pruebas de aceptación están en el documento `docs/pendientes-proyecto-ventas.md` y en `docs/integracion-ventas.md` del proyecto del SaaS; te los pego a continuación.
