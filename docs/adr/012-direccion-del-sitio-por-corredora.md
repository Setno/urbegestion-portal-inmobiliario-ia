# ADR-012: La dirección de la visita decide qué corredora muestra el sitio

- Estado: aceptada (alcance aprobado por el responsable el 2026-11-03)
- Fecha: 2026-11-03
- Precisa: ADR-006 y ADR-011

## Contexto
Hasta H-030 el sitio Next.js atendía a una sola corredora, fijada con la variable `SITIO_TENANT_ID`. Para vender el producto, cada corredora necesita su propia dirección: un subdominio gratuito de la plataforma (`casasur.<plataforma>`) y, si su plan lo incluye, su dominio (`casasur.cl`). Además, ADR-011 dejó pendiente que una corredora cancelada seguía publicada.

## Opciones consideradas
| Opción | A favor | En contra | Costo |
| --- | --- | --- | --- |
| Un solo proyecto de Vercel; `proxy.ts` reescribe cada visita a `app/[sitio]/...` con la dirección, y la base dice qué corredora corresponde (elegida) | Una sola instalación para todas; cada dirección tiene su propia copia guardada (ISR); nadie puede pedir la página de otra corredora cambiando la ruta | Cada dominio propio hay que agregarlo al proyecto de Vercel | Bajo |
| Leer la dirección con `headers()` dentro de cada página | Menos carpetas | Las páginas dejan de guardarse en caché: cada visita consulta la base | Medio |
| Un proyecto de Vercel por corredora | Aislamiento total | Imposible de mantener con muchas corredoras | Alto |

## Decisión
- **Tabla `site_addresses`:** una fila por corredora con `subdomain` (solo la etiqueta) y `custom_domain` (sin `www.`), ambos únicos en toda la plataforma. Palabras reservadas: `www`, `app`, `api`, `admin`, `consola`, `panel`, `mail`, `correo`, `soporte`, `ayuda`, `blog`, `static`, `cdn`.
- **Escritura:** `set_site_address`, solo el administrador de la corredora; el dominio propio exige `site.custom_domain`. No se edita con el plazo de gracia vencido, suspendida ni cancelada.
- **Resolución:** `resolve_site(subdominio, dominio, corredora por defecto)` devuelve la corredora, su subdominio y su dominio propio vigente (migración `20261103140000`, que reemplazó a `resolve_site_tenant` tras la revisión). Un subdominio de la plataforma que no es de nadie nunca muestra otra corredora, y un dominio registrado tampoco, aunque el plan lo bloquee. La corredora por defecto (`SITIO_TENANT_ID`, opcional) solo se envía desde `localhost` y los previews de Vercel; la portada de la plataforma (`base` y `www.base`) no muestra ninguna. No se aceptan como dominio propio los de Vercel, los locales ni (en el panel) los de la plataforma.
- **Sitio apagado:** la resolución devuelve "ninguna" si la corredora está suspendida o cancelada, o si su plan apaga `site.enabled`. Un pago vencido no apaga el sitio: la corredora sigue recibiendo clientes mientras regulariza. Así se cierra la decisión pendiente de ADR-011.
- **Sitio Next.js:** `SITIO_DOMINIO_BASE` es el dominio de la plataforma. Sin esa variable, en local vale `localhost` (`urbe.localhost:3001`) y en producción no hay subdominios. Los formularios de visita resuelven la corredora con la dirección a la que llegó la solicitud, nunca con lo que envía el navegador.
- **SEO (H-031):** cada sitio tiene una sola dirección canónica: su dominio propio o, si no tiene, su subdominio de la plataforma. La usan los metadatos, los datos estructurados, el mapa del sitio y `robots.txt`, entre por donde entre la visita. Los previews (`*.vercel.app`) y `localhost` piden no ser indexados.

## Consecuencias
- Para activar un dominio propio, el dueño de la plataforma lo agrega al proyecto `portal-inmobiliario-sitio` en Vercel; la corredora crea los registros DNS que le muestra el panel (guía en `docs/guia-dominios.md`).
- Falta elegir y comprar el dominio de la plataforma; hasta entonces, el panel lo muestra como "(dominio de la plataforma)".
- El panel de la consola sigue leyendo su corredora de `VITE_TENANT_ID`.
- Cualquier administrador con dominio propio en su plan puede registrar un dominio ajeno y ocuparlo; no se muestra mientras el dueño no lo agregue en Vercel. La verificación por registro TXT queda en H-055.
- La consulta de la dirección se guarda 60 segundos, como el resto de los datos: un cambio de dirección tarda un par de minutos en notarse.
