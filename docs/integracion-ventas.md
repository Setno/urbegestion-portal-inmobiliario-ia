# Integración con el proyecto de ventas (contrato v1, ADR-009)

Esta guía es para quien programa el lado de ventas. El SaaS expone dos puntos; ninguno de los dos hace que el SaaS dependa de ventas.

## Variables de entorno (solo en el servidor del SaaS, en Vercel)
| Variable | Para qué | Cómo crearla |
| --- | --- | --- |
| `PLATFORM_SYNC_SECRET` | Firma de las llamadas de ventas al SaaS | Una clave larga al azar (32 bytes o más). La misma debe cargarse en el servidor de ventas |
| `PLATFORM_METRICS_TOKEN` | Token con que ventas consulta las métricas | Otra clave larga al azar, distinta de la anterior |
| `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` | Ya existen (las usan invitar y crear corredoras) | — |

Nunca van en el navegador, en el repositorio ni en el chat. Con ninguna de las dos cargadas, los endpoints responden `503 not_configured` y el SaaS sigue funcionando.

## Ventas → SaaS: `POST /api/platform/tenant-sync`
Informa el plan, el estado y los derechos de una corredora. Es idempotente y respeta el orden por `updatedAt`.

Encabezados:
- `X-Timestamp`: milisegundos desde 1970 al momento de enviar (caduca a los 5 minutos).
- `X-Signature`: `sha256=` + HMAC-SHA256 en hexadecimal de `"<X-Timestamp>.<cuerpo exacto>"` con `PLATFORM_SYNC_SECRET`.

Cuerpo (JSON):
```json
{
  "tenantId": "uuid de la corredora en el SaaS",
  "tenantRef": "id de la corredora en ventas",
  "planCode": "completo",
  "status": "active",
  "trialEndsAt": null,
  "graceEndsAt": null,
  "features": { "ai.chat": true, "site.custom_domain": false },
  "limits": { "limit.agents": 3, "limit.storage_mb": null },
  "contractVersion": 1,
  "updatedAt": "2026-11-02T10:00:00Z"
}
```
- Se identifica la corredora con `tenantId` (la primera vez) o solo con `tenantRef` (una vez vinculada). Si `tenantRef` ya pertenece a otra corredora: `409 tenant_ref_taken`.
- `updatedAt` es obligatorio. Un mensaje más antiguo que el ya aplicado responde `200 {"applied": false, "reason": "stale"}` y no cambia nada.
- Las claves de `features` y `limits` que el SaaS no conoce se guardan igual; las que no se envían valen su valor por defecto (`src/core/platform/contract.ts`).
- Respuestas: `200` aplicado, `400` cuerpo inválido, `401` firma inválida o caducada, `404` corredora desconocida, `409` referencia ya usada, `413` cuerpo muy grande, `503` sin configurar.

Ejemplo de firma en Node:
```js
import { createHmac } from 'node:crypto';
const body = JSON.stringify(mensaje);
const timestamp = String(Date.now());
const signature = 'sha256=' + createHmac('sha256', process.env.PLATFORM_SYNC_SECRET).update(`${timestamp}.${body}`).digest('hex');
await fetch('https://<dominio-del-saas>/api/platform/tenant-sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Timestamp': timestamp, 'X-Signature': signature },
  body,
});
```

## SaaS → ventas: `GET /api/platform/metrics`
Ventas consulta (el SaaS nunca empuja). Encabezado `Authorization: Bearer <PLATFORM_METRICS_TOKEN>`. Devuelve solo cantidades y fechas:
```json
{
  "contractVersion": 1,
  "capturedAt": "2026-11-02T10:00:00Z",
  "platform": { "tenantsTotal": 1, "appVersion": "f70bfa3", "health": "ok" },
  "tenants": [
    { "tenantId": "uuid", "name": "Corredora A", "agentsCount": 2, "propertiesTotal": 10, "propertiesPublished": 7,
      "leads30d": 4, "leadsTotal": 25, "lastLoginAt": "2026-11-01T08:00:00Z", "lastActivityAt": "2026-11-01T09:00:00Z" }
  ]
}
```
`ai_messages_30d` y `storage_mb` del ADR-009 todavía no se miden (no hay dónde contarlos); se agregan a esta respuesta cuando existan, sin cambiar la versión.

## Qué hace el SaaS con lo que recibe
Los derechos quedan en `tenant_entitlements`; el panel los lee al iniciar sesión y el código los consulta con `can()`, `limitOf()`, `hasRoom()` y `accessMode()`.

**Estado de la suscripción (`status`)**
| Estado | Qué ocurre |
| --- | --- |
| `trial`, `active` | Todo funciona |
| `past_due` | Todo funciona, con un aviso en el panel (con la fecha de `graceEndsAt` si viene); pasado ese plazo se trata como suspendida |
| `suspended` | Panel en solo lectura (se ve todo, no se cambia nada); la descarga de datos sigue activa; el sitio público sigue visible y sigue recibiendo leads |
| `cancelled` | Solo queda la descarga de datos; los agentes ven un aviso |

**Funciones y cupos: dónde se aplican hoy**
| Clave | Aplicación |
| --- | --- |
| `branding.edit` | Se oculta la pestaña Identidad & Marca |
| `crm.export` | Se ocultan el botón de exportar del CRM y la descarga de datos |
| `ai.llm_server` | El asistente usa el motor local aunque el servidor esté elegido |
| `limit.agents` | El servidor (`api/invite`) no invita si el cupo está lleno, ni si la cuenta está en solo lectura o cancelada |
| `limit.properties_published` | El panel no deja publicar ni aprobar sobre el cupo, y la base también lo hace cumplir con un disparador (los borradores no cuentan) |
| `site.enabled`, `site.custom_domain`, `widget.embed` | Reservadas: se aplican cuando existan el sitio por corredora y el widget |
| `ai.chat` | Se apagan el botón del asistente (barra, portada y barra móvil) y el widget del chat. El sitio público lee los derechos sin sesión con una función que entrega solo estado y funciones |
| `valuation.owner_form` | Se apagan los accesos "Vende con Nosotros" / "Vende tu Propiedad" y el formulario de propietarios |
| `publication.approval_flow` | Reservada (sin efecto por ahora) |
| `limit.leads_per_month` | Reservada a propósito: no se bloquean leads (cada lead perdido es un cliente perdido de la corredora). Ventas puede usar `leads30d` de las métricas para avisar o cobrar |
| `limit.ai_messages_per_month`, `limit.storage_mb` | Reservadas: hoy no se miden (H-043.3) |

## Para ampliar el contrato
Ver "Cómo se agrega una variable nueva" en el ADR-009. Agregar una clave no requiere migración ni cambia el endpoint.
