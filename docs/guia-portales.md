# Guía: conectar Mercado Libre y Portal Inmobiliario (H-068)

Portal Inmobiliario funciona como parte de Mercado Libre, así que se conecta una sola vez. Esta guía tiene dos partes: lo que hace **la plataforma** (una vez) y lo que hace **cada corredora** (desde su panel).

> Los nombres exactos de los botones de Mercado Libre pueden variar un poco; lo importante es obtener los tres datos del paso 3.

## 1. Una vez, por la plataforma: registrar la aplicación

1. Entra a [developers.mercadolibre.cl](https://developers.mercadolibre.cl) con la cuenta de la empresa (no la de una corredora).
2. Crea una aplicación nueva ("Mis aplicaciones" → "Crear aplicación"). Nombre sugerido: el de la plataforma.
3. En la configuración de la aplicación, completa:
   - **URL de redireccionamiento:** `https://<dirección del panel>/api/portales/mercadolibre-retorno`. Debe ser `https` y **idéntica** a la que usa la plataforma (variable `ML_REDIRECT_URI`, o `SITE_URL` + esa ruta).
   - **Permisos:** lectura y escritura.
4. Anota el **App ID** (es el `ML_CLIENT_ID`) y la **Clave secreta** (es el `ML_CLIENT_SECRET`). La clave secreta no se comparte ni se pega en ningún chat ni archivo del repositorio.

Mercado Libre acepta una sola dirección de retorno por aplicación. Por eso conviene una aplicación para desarrollo (con la dirección de un preview estable) y otra para producción.

## 2. Variables que carga la plataforma (servidor, nunca en el navegador)

Se cargan en el proyecto de Vercel de la consola (variables de entorno del servidor, sin el prefijo `VITE_`):

| Variable | Qué es |
| --- | --- |
| `ML_CLIENT_ID` | App ID de la aplicación |
| `ML_CLIENT_SECRET` | Clave secreta de la aplicación |
| `PORTALES_STATE_SECRET` | Texto largo y aleatorio que firma la vuelta desde Mercado Libre (mínimo 32 caracteres). Para generarlo: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ML_REDIRECT_URI` | Opcional. La dirección de retorno exacta del paso 1; si falta, se arma con `SITE_URL` |

Sin estas variables el botón "Conectar Mercado Libre" avisa que la conexión aún no está disponible; no rompe nada.

## 3. Por cada corredora

1. La corredora necesita una cuenta de vendedor en Mercado Libre y un **paquete de publicaciones de inmuebles** contratado (sin él, Mercado Libre rechaza los avisos).
2. En el panel: **Mi corredora → Portales inmobiliarios → Conectar Mercado Libre**. Solo el administrador lo ve.
3. Mercado Libre pide autorizar la aplicación; al aceptar, el panel vuelve y muestra "Mercado Libre conectado" con el número de cuenta.
4. "Desconectar" borra la conexión; los avisos ya publicados quedan en Mercado Libre.

## Cómo se protege

- Los tokens se guardan en la tabla `portal_connections`, que **ni el administrador puede leer**: solo las funciones del servidor. El navegador solo ve a qué portal está conectada la corredora y con qué cuenta.
- La vuelta desde Mercado Libre lleva un estado firmado que vence a los 10 minutos y ata la conexión a la corredora y al administrador que la pidió.
- Una prueba de seguridad (`supabase/tests/rls_portales.sql`) comprueba que visitantes, agentes y administradores de otras corredoras no ven ni cambian conexiones ajenas.
