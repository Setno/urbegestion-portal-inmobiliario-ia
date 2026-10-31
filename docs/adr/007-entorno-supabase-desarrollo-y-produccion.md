# ADR-007: Entorno de Supabase para desarrollo y producción, claves y migraciones

- Estado: aceptada
- Fecha: 2026-10-31
- Complementa a: ADR-004 (Supabase como backend) y ADR-002 (secretos en el servidor)

## Contexto
ADR-004 eligió Supabase. Falta decidir dónde corre mientras desarrollamos, cómo se separan desarrollo y producción, cómo se guardan las claves y cómo se cambia el esquema de la base. El equipo no tiene Docker instalado y el responsable no programa. No hay despliegue hasta el final (H-013).

## Opciones consideradas
| Opción | A favor | En contra | Costo |
| --- | --- | --- | --- |
| Proyecto en la nube, plan gratuito, solo para desarrollo (elegida) | Sin instalar nada; se ve en el panel web; igual al producto final | Se pausa tras una semana sin uso; datos de prueba en la nube | Gratis |
| Supabase local con Docker | Datos solo en el computador; sin pausas | Docker Desktop es pesado en Windows; más piezas que mantener | Gratis |
| Un único proyecto para desarrollo y producción | Un solo lugar | Datos reales mezclados con pruebas; producción en plan gratuito se pausa | Pago desde el día 1 |

## Decisión
1. **Dos proyectos separados.** Ahora, `urbegestion-dev` (plan gratuito, región São Paulo, dentro de una organización propia del producto). En el despliegue final se crea `urbegestion-prod` en plan de pago aplicando las mismas migraciones. Nunca se comparten claves ni datos entre ambos.
2. **Claves.**
   - En el navegador solo van la URL del proyecto y la clave publicable (`sb_publishable_...`), en `.env.local` (ignorado por git) como `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
   - La clave secreta (`sb_secret_...`) y la contraseña de la base nunca se ponen en variables `VITE_*`, ni en el repositorio, ni en el chat. Si hace falta en el servidor (por ejemplo invitar usuarios, H-008.5), vive en las variables de entorno de las funciones `api/*` con otro nombre.
   - Si una clave se expone, se regenera desde el panel de Supabase.
3. **Migraciones.** El esquema se define solo con archivos SQL versionados en `supabase/migrations/`, con nombre `AAAAMMDDHHMMSS_descripcion.sql`. Una migración ya aplicada no se modifica: se crea otra. Cada migración se aprueba explícitamente antes de crearse y de aplicarse. La forma de aplicarlas (SQL Editor del panel o CLI de Supabase) se decide en H-008.3, que trae la primera migración; hasta entonces no hay ninguna.
4. **Autenticación.** Registro público desactivado (cuentas por invitación) y confirmación de correo activada.
5. **Paquete.** `@supabase/supabase-js` (MIT, versión 2.118.0, última modificación 2026-10-28, repositorio oficial de Supabase). Se instalará en H-008.2, que es la primera historia que lo usa.

## Consecuencias
- Producción se crea en minutos aplicando las migraciones, sin copiar datos de prueba.
- El proyecto gratuito se pausa si no se usa una semana; se reactiva desde el panel.
- Se debe revisar el costo real del plan de pago al crear `urbegestion-prod` (por verificar).
- La verificación de conexión (`node --env-file=.env.local scripts/verificar-supabase.mjs`) imprime solo estados, nunca claves.
