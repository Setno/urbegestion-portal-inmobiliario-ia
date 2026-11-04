# Guía: dirección del sitio de cada corredora (H-030)

## Lo que hace la corredora (en el panel)
1. Entra como administrador a **Mi corredora → Dirección de tu sitio**.
2. Escribe su **subdominio** (por ejemplo `casasur`) y guarda. Su sitio queda en `casasur.<dominio de la plataforma>` en un par de minutos.
3. Si su plan incluye dominio propio, escribe su dominio (por ejemplo `casasur.cl`). El panel le muestra los registros DNS que debe crear donde compró el dominio:

| Tipo | Nombre | Valor |
| --- | --- | --- |
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

4. Avisa al equipo de la plataforma para activar el dominio.

## Lo que hace el dueño de la plataforma (una vez por dominio)
1. En Vercel, abre el proyecto `portal-inmobiliario-sitio` → Settings → Domains.
2. Agrega `casasur.cl` y `www.casasur.cl` (Vercel sugiere redirigir uno al otro).
3. Espera a que Vercel marque el dominio como válido; el certificado HTTPS se crea solo.

## Dominio de la plataforma (falta elegirlo)
- Comprar el dominio (por ejemplo `miportal.cl`), agregar `*.miportal.cl` al proyecto del sitio en Vercel y crear en el DNS un registro comodín (`*`) hacia Vercel.
- Cargar `SITIO_DOMINIO_BASE=miportal.cl` en el proyecto del sitio y `VITE_SITIO_DOMINIO_BASE=miportal.cl` en el de la consola.

## Probar en el computador
- `npm run dev:sitio` y abrir `http://<subdominio>.localhost:3001` (en local, `localhost` hace de dominio de la plataforma).
- `http://localhost:3001` muestra la corredora de `SITIO_TENANT_ID`, si está definida; si no, "Sitio no disponible".
- Si el servidor local no logra conectarse con la base por un error de certificado, arrancarlo con `NODE_OPTIONS=--use-system-ca` (así está en `.claude/launch.json`).
