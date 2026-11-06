# Guía de producción (H-013 y "Producción: base propia, proyecto del sitio y variables")

Esta guía separa lo que **hace Claude en el repositorio** de lo que **debes hacer tú**, porque requiere tus cuentas, tus claves o una decisión tuya. Nada de esto se ha ejecutado: producción no se toca sin tu orden explícita.

## 0. Estado de partida (2026-11-04)

- Desarrollo usa el proyecto de Supabase `SaaS_Desarrollo`. Producción **no existe aún**.
- Los despliegues automáticos desde Git están apagados en los dos proyectos de Vercel (`apps/consola/vercel.json` y `apps/sitio/vercel.json`). Cada despliegue se hace a mano.
- La seguridad estacionada ya está resuelta en el código: cabeceras (H-004), creación de leads por función con topes (H-052/H-055), columnas públicas de propiedades (H-047) y límite por dirección IP en `api/` (H-005).

## 1. Base de datos de producción (tú)

1. En Supabase, crea un proyecto nuevo (nombre sugerido: `portal-produccion`), en la región más cercana a Chile. Anota la contraseña de la base en tu gestor de claves.
2. Aplica **todas las migraciones, en orden** de `supabase/migrations/` (hay 27; el orden es el del nombre del archivo, de la más antigua a la más nueva). Dos formas:
   - Con la CLI de Supabase: `supabase link --project-ref <ref>` y `supabase db push`.
   - O pegando cada archivo en el editor SQL, uno por uno, en orden. Tras cada uno debe decir "Success".
2b. **Si reutilizas el proyecto de la cuenta A (ex desarrollo, renombrado "CRM producción")**: no hace falta aplicar migraciones de nuevo, pero sí vaciarlo de datos de prueba. En `supabase/mantenimiento/`: pega `1-ver-que-hay.sql` (solo lectura: confirma las migraciones y cuenta los datos); haz un respaldo; pega `2-vaciar-datos-de-prueba.sql` (escribe antes tu correo; termina en `rollback`, revisa el resultado y cámbialo a `commit` para confirmar); borra a mano las fotos en Storage → property-images; vuelve a pegar `1-ver-que-hay.sql` y comprueba que todo da 0 salvo tus usuarios. Revisa también que el secreto `lead_alert_url` del Vault apunte a las funciones de esta cuenta.
3. Verifica con las pruebas de seguridad de `supabase/tests/` **en un proyecto de desarrollo o de prueba con las mismas migraciones, nunca en producción** (crean usuarios y leads falsos y se apoyan en un `rollback` final). Cada archivo `rls_*.sql` debe terminar con un mensaje que empieza por `RLS OK`; si alguna dice `FALLO`, **no sigas**. En producción solo se comprueba que las migraciones se aplicaron sin error y se hacen los pasos de humo de la sección 4.
4. En Authentication → URL Configuration, pon la dirección del panel como "Site URL" y agrégala a las URL permitidas de redirección. Desactiva "Allow new users to sign up" (las cuentas se crean por invitación).
5. En Authentication → Providers → Email, deja activa la confirmación de correo.
6. Activa los respaldos diarios (Database → Backups). Anota quién puede restaurar.

## 2. Variables de entorno (tú, en Vercel y Supabase)

**Nunca pegues estas claves en un chat ni en un archivo del repositorio.**

### Proyecto de la consola (carpeta raíz `apps/consola`), entorno *Production*

| Variable | Qué es |
| --- | --- |
| `VITE_SUPABASE_URL` | Dirección del proyecto de producción |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave pública (empieza con `sb_publishable_`) |
| `VITE_TENANT_ID` | Solo si esta instalación atiende a una sola corredora (modo actual del sitio de demostración) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio: **solo en el servidor**, nunca con prefijo `VITE_` |
| `PLATFORM_OWNER_EMAILS` | Correos del dueño del producto, separados por comas |
| `PLATFORM_SYNC_SECRET`, `PLATFORM_METRICS_TOKEN` | Claves largas al azar para hablar con el proyecto de ventas (`docs/integracion-ventas.md`) |
| `LLM_API_KEY`, `AI_PROVIDER`, `AI_MODEL` | Solo si usas el asistente con modelo de lenguaje en el servidor |
| `GHL_WEBHOOK_URL` | Opcional: reenvío de leads |
| `VITE_TELEGRAM_BOT` | Opcional: nombre del bot de avisos, sin `@` |

### Proyecto del sitio (`portal-inmobiliario-sitio`, carpeta raíz `apps/sitio`), entorno *Production*

| Variable | Qué es |
| --- | --- |
| `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` | Producción (el sitio acepta también los nombres `VITE_...`) |
| `SITIO_DOMINIO_BASE` | El dominio de la plataforma (`docs/guia-dominios.md`), por ejemplo `miplataforma.cl` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio de producción (H-063): con ella el servidor del sitio crea los leads. Sin ella el sitio no guarda solicitudes. **Solo en el servidor**, nunca con prefijo `NEXT_PUBLIC_` |
| `GHL_WEBHOOK_URL` | Opcional |

No cargues `SITIO_TENANT_ID` en producción: sirve solo para `localhost` y los previews.

### Supabase → Edge Functions → Secrets

`RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `PANEL_URL`; y la dirección de `alerta-lead` en el Vault. Pasos en `docs/guia-avisos.md`.

## 3. Firewall de Vercel (tú, 5 minutos por proyecto)

El límite por IP del código es "mejor esfuerzo" (cada instancia lleva su propia cuenta). El tope firme se pone en Vercel → proyecto → Firewall → Rules:

- Ruta que contiene `/api/chat`: máximo 15 solicitudes por 10 minutos por IP → "Rate Limit".
- Ruta que contiene `/api/lead-webhook`: máximo 10 por 10 minutos por IP.
- En el proyecto del sitio, método `POST`: máximo 30 por 10 minutos por IP (cubre las acciones de visita, chat y tasación).
- Activa "Attack Challenge Mode" solo si sufres un ataque.

- Ruta que contiene `/api/crear-lead` (proyecto de la consola): máximo 10 solicitudes por 10 minutos por IP (landing y chat de la consola, H-063).

**Cerrado en H-063:** la función `create_site_lead` ya no se puede llamar con la clave pública de Supabase (que cualquiera ve): solo la llaman los servidores con la clave de servicio, es decir, el sitio (acciones de visita, chat y tasación) y `api/crear-lead` de la consola. Ambos limitan por dirección IP (6 envíos cada 10 minutos); los topes por corredora (60 cada 10 minutos) y por teléfono o correo (3 por hora) siguen en la base. **Lo que queda:** quien automatice envíos desde varias direcciones IP al sitio sigue pudiendo llenar el cupo de una corredora por unos minutos; para eso están las reglas de firewall de arriba y, si hiciera falta, un captcha (Cloudflare Turnstile), que se puede sumar después sin cambiar esta estructura. Si se detecta un abuso, ver "Alertas frecuentes" del runbook.

## 4. Lista de despliegue (H-013) — solo con tu orden explícita

Antes de pedir el despliegue, esto debe estar en verde (Claude lo verifica y lo informa):

- [ ] `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` y `npm run build:sitio` sin errores.
- [ ] `npm audit` sin vulnerabilidades altas ni críticas.
- [ ] Migraciones aplicadas en producción sin error, y pruebas `rls_*.sql` en `RLS OK` en el proyecto de desarrollo (con las mismas migraciones).
- [ ] Variables cargadas (sección 2). Una por una, sin pegar valores en el chat.
- [ ] Revisión legal del aviso de privacidad y de la cookie de campaña (`docs/backlog.md`, H-058).
- [ ] Un preview del sitio y de la consola probado a mano con la base de **producción vacía** (una corredora de prueba).

Pasos del despliegue:

1. En `apps/consola/vercel.json` y `apps/sitio/vercel.json`, el bloque `"git": { "deploymentEnabled": false }` se **deja como está** si sigues desplegando a mano. Solo se quita si decides desplegar automáticamente desde `main` (en ese caso, cada unión a `main` sería producción).
2. Despliega primero el proyecto de la consola y después el del sitio, desde la carpeta de cada uno: `vercel --prod` (requiere tu orden).
3. Prueba de humo (smoke test), en este orden:
   - La consola abre y pide iniciar sesión.
   - Entra con la cuenta de la corredora de prueba: se ven propiedades y leads.
   - El sitio de la corredora de prueba abre en su dirección y muestra el catálogo.
   - Envía una solicitud de visita desde el sitio: el lead aparece en el CRM y llega el aviso.
   - Llama a cada función de `api/`: `curl -i https://<consola>/api/lead-webhook` debe responder JSON, no un error de Vercel (lección H-046).
   - Abre una página del sitio con `?utm_source=prueba` dos veces y una tercera sin parámetros; confirma que la tercera **no** trae la cookie `atribucion` (`curl -I`, revisar `set-cookie` y `x-vercel-cache`).
4. Si algo falla: revertir según `docs/runbook.md`.

## 5. Lo que queda abierto

- Verificación de dominios propios con registro TXT (H-055): hasta entonces, el dominio propio queda "pendiente" y solo el dueño de la plataforma lo activa.
- Semgrep en rojo en el CI y avisos moderados de `npm audit` (`minimatch`): revisar antes del despliegue.
- Aviso de cookies y revisión legal con abogado.
