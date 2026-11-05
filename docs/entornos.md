# Entornos y cuentas de Supabase

Cómo dejar guardados los datos de las dos cuentas para pasar de una a otra sin volver a escribir direcciones ni claves.

## Las dos cuentas

| | Cuenta A (actual) | Cuenta B (nueva) |
| --- | --- | --- |
| Papel | **Producción** | **Desarrollo** |
| Proyecto del CRM | `ppzuhlsskiktsfteouwv` (hoy con los datos de prueba; se limpia antes de usarlo en producción) | `hidnuzcgsrwsesrxvcxs` (`Dev_Inmobiliario`, creado el 2026-11-04 con las 26 migraciones; corredora de prueba `BontesDev`, id `224c79ae-7fef-4d38-9c15-05ad5f94cb1c`) |
| Proyecto de ventas | *(el de ventas; se queda aquí)* | — |
| Correo de la cuenta | *(anótalo aquí)* | *(anótalo aquí)* |

El identificador del proyecto (la parte de `https://<identificador>.supabase.co`) **no es secreto** y puede quedar escrito en este documento. Las claves **sí** lo son.

## Qué es secreto y dónde guardarlo

| Dato | ¿Secreto? | Dónde guardarlo |
| --- | --- | --- |
| Identificador y dirección del proyecto (`https://xxxx.supabase.co`) | No | Este documento |
| Clave pública (`sb_publishable_...`) | No es secreta, pero no se publica en el repositorio | Los archivos `.env.desarrollo` y `.env.produccion` |
| Clave de servicio (`SUPABASE_SERVICE_ROLE_KEY`), contraseña de la base, claves de Resend, Telegram, modelo de lenguaje | **Sí** | Un gestor de contraseñas (Bitwarden, 1Password, el del navegador) y las variables de Vercel. **Nunca** en el chat ni en el repositorio |
| Correo y contraseña de cada cuenta de Supabase | **Sí** | El gestor de contraseñas |

## Cambiar de entorno en tu computador (una sola vez de preparación)

1. En la carpeta del proyecto crea dos archivos de texto: `.env.desarrollo` y `.env.produccion`. Ambos quedan fuera de Git automáticamente.
2. Dentro de cada uno, las mismas variables que ya conoces, con los valores de su cuenta (ver `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` y, si corresponde, `VITE_TENANT_ID`.
3. Para pasar de uno a otro:

```bash
npm run entorno -- desarrollo
```

```bash
npm run entorno -- produccion
```

El comando copia el archivo que elegiste a `.env.local` y te dice cuál quedó activo y el identificador del proyecto, **sin mostrar nunca las claves**. Después reinicia el servidor (`npm run dev`) para que tome el cambio. Al pasar a producción te avisa que lo que hagas afecta datos reales.

## Vercel

No hay nada que cambiar a mano: cada variable de Vercel tiene un conjunto para *Production* y otro para *Preview* y *Development*. Se cargan una vez:

- *Preview* y *Development* → proyecto de la cuenta B (desarrollo).
- *Production* → proyecto de la cuenta A (producción), solo cuando se decida salir a producción (`docs/guia-produccion.md`).

## Conexión de Claude con Supabase

La conexión de Supabase de la aplicación de Claude se autoriza con **una cuenta a la vez**. Para cambiar de cuenta sin teclear nada:

1. Usa dos **perfiles del navegador** (por ejemplo, un perfil de Chrome para la cuenta A y otro para la B), cada uno con su sesión de Supabase guardada por el gestor de contraseñas.
2. Para pasar de una a otra: Ajustes → Conectores → Supabase → desconectar, y volver a conectar desde el perfil del navegador de la cuenta que quieres. La autorización la hace el navegador; no se escribe ninguna clave.
3. Comprobación: en la sesión pide "lista los proyectos de Supabase". Si aparece el proyecto esperado, estás en la cuenta correcta.

Regla de seguridad: **las migraciones y los cambios de prueba van a desarrollo (B)**. A producción (A) solo se aplica lo que ya se probó en B, y siempre con tu orden.
