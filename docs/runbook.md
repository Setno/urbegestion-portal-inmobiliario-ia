# Runbook

Guía operativa. El paso a paso de la primera salida a producción está en `docs/guia-produccion.md`. Este documento se completa con las URL reales cuando existan los entornos de producción.

## Servicios y entornos

| Entorno | Servicio | Hosting | Dueño |
| --- | --- | --- | --- |
| Desarrollo | Consola (React + Vite) y funciones `api/` | Vercel, proyecto de la consola (carpeta raíz `apps/consola`), solo *previews* | Responsable del proyecto |
| Desarrollo | Sitio público (Next.js) | Vercel, proyecto `portal-inmobiliario-sitio` (carpeta raíz `apps/sitio`), solo *previews* | Responsable del proyecto |
| Desarrollo | Base de datos y funciones de avisos | Supabase `SaaS_Desarrollo` | Responsable del proyecto |
| Producción | Los tres anteriores | Por crear (ver guía de producción) | Responsable del proyecto |

## Desplegar

Los despliegues automáticos desde Git están apagados (`git.deploymentEnabled: false`). Cada despliegue se hace a mano y **producción solo con orden explícita del responsable**.

1. Verificar en verde: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run build:sitio`.
2. Aplicar primero las migraciones nuevas en la base del entorno (siempre antes que el código que las usa).
3. Desplegar la consola y luego el sitio desde la carpeta de cada proyecto.
4. Probar con los pasos de humo de `docs/guia-produccion.md` (sección 4).

## Revertir (rollback)

1. **Código:** (esto revierte el código, **no la base de datos**) en Vercel → proyecto → Deployments, elegir el despliegue anterior bueno → "Promote to Production" (o "Instant Rollback"). Se hace por proyecto: consola y sitio son independientes.
2. **Migraciones:** no se modifican las ya aplicadas. Si una migración causa un problema, se escribe una migración nueva que lo corrija (compensar), nunca se edita la anterior. Antes de aplicar una migración en producción conviene un respaldo reciente de la base.
3. **Orden:** si el problema es de la función `create_site_lead` o de las columnas públicas, el síntoma es que el sitio no puede guardar leads o no muestra propiedades; revisar primero los registros de Supabase.
4. Verificar con los pasos de humo.

## Rotar secretos

| Secreto | Dónde está | Cómo rotar |
| --- | --- | --- |
| Clave de servicio de Supabase (`SUPABASE_SERVICE_ROLE_KEY`) | Variables de Vercel (consola) | Generar una nueva en Supabase → Settings → API; actualizar en Vercel; redesplegar la consola |
| `PLATFORM_SYNC_SECRET`, `PLATFORM_METRICS_TOKEN` | Vercel (consola) y el proyecto de ventas | Cambiar en ambos lados a la vez (`docs/integracion-ventas.md`); redesplegar |
| `LLM_API_KEY` | Vercel (consola) | Crear una nueva en el proveedor; actualizar; redesplegar; revocar la anterior |
| `RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` | Supabase → Edge Functions → Secrets | Cambiar el secreto; si cambia el de Telegram, volver a registrar el webhook (`docs/guia-avisos.md`) |

La clave pública (`VITE_SUPABASE_PUBLISHABLE_KEY`) no es secreta, pero si se cambia hay que redesplegar la consola y el sitio.

## Alertas frecuentes

| Alerta | Significado | Primeros pasos | Escalar a |
| --- | --- | --- | --- |
| `limite_contacto` / `limite_corredora` en los registros de Supabase | La función `create_site_lead` rechazó un envío por exceso (3 por teléfono o correo por hora, 60 por corredora cada 10 minutos) | Revisar si es un cliente real que insiste o un ataque; el tope se ve en la migración `20261104160000` | Responsable del proyecto |
| `sitio_no_disponible` | La corredora está suspendida, cancelada o con el sitio apagado por su plan | Revisar los derechos de la corredora (`tenant_entitlements`) | Responsable del proyecto |
| Abuso de `create_site_lead` (muchos `limite_corredora` o avisos falsos) | Desde H-063 la función solo la llaman los servidores (sitio y `api/crear-lead`), así que el abuso llega por esos formularios desde varias direcciones IP | Poner o bajar la regla de límite en el Firewall de Vercel (sitio: método `POST`; consola: `/api/crear-lead`); si sigue, activar "Attack Challenge Mode" en ese proyecto. Como último recurso, suspender el sitio de la corredora afectada desde el panel y revisar sus leads recientes | Responsable del proyecto |
| Respuestas 429 de `api/chat` o `api/lead-webhook` | El límite por IP actuó | Normal si es uso intensivo desde una dirección; si es un cliente legítimo, subir el tope en `api/` | — |
| Una función de `api/` responde error de Vercel (no JSON) | Importación sin extensión `.js` o por nombre de paquete (H-046) | Llamar a la función tras cada despliegue; revisar `tests/api/vercel-imports.test.ts` | — |
| Leads sin aviso | Faltan claves de Resend o Telegram, o el secreto del Vault | `docs/guia-avisos.md` | — |

## Respaldos

- Supabase hace respaldos diarios en los planes de pago; confirmar frecuencia y retención del plan elegido al crear el proyecto de producción.
- La consola ofrece "Exportar datos" (H-025) por corredora: CSV de leads, notas y propiedades, y un JSON completo.
- Última prueba de restauración: **pendiente** (hacerla antes del primer cliente real).

## Contactos

Responsable del proyecto: el dueño del producto (correo en `PLATFORM_OWNER_EMAILS`). Soporte de Supabase y de Vercel: desde sus paneles.
