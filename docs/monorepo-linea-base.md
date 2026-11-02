# Monorepo (H-026): línea base y prueba de cada etapa

Cómo está todo antes de mover nada (rama `monorepo`, medido el 2026-11-02, ya con la corrección H-046 de `main`, commit `5e9126a`). Cada etapa se compara contra esto. Decisiones en `docs/adr/010-organizacion-del-monorepo.md`.

## Lo que se mide en cada etapa
| Qué | Línea base | Condición |
| --- | --- | --- |
| Pruebas | 606 pasan, en 58 archivos | Las mismas 606, comparadas por nombre |
| Tipos | sin errores | Igual |
| Lint | 157 archivos revisados, 0 errores y 0 avisos | Ningún archivo deja de revisarse |
| Reglas de lint activas | `src/App.tsx`: 93, con `react-hooks`; `api/chat.ts`: 91; `scripts/verificar-supabase.mjs`: 86 | Mismas cantidades |
| CSS generado | 53.418 bytes (`index-CeaLyH-Y.css`) | Mismo tamaño; una baja indica que Tailwind perdió archivos |
| JS generado | Local: 1.213.556 bytes (`index-D8ldTTZh.js`). En Vercel: `index-tDXwAuLy.js`; el nombre cambia porque usa otras variables | Diferencia mínima y explicada |
| Dependencias externas | las de `package-lock.json` | Mismas versiones |

## Funciones del servidor en el preview de `main` (`5e9126a`)
Sin clave de acceso, llamadas por GET. `/api/lead-webhook` y `/api/chat` se midieron en el commit `9fc9311`; no cambiaron desde entonces.

| Función | Importa de `src/` | Respuesta | Antes de H-046 |
| --- | --- | --- | --- |
| `/api/lead-webhook` | No | 200, `{"configured":false}` | Igual |
| `/api/chat` | No | 405 (solo acepta POST), la función carga | Igual |
| `/api/invite` | Sí | 405 (solo acepta POST), la función carga | 500, se caía al cargar |
| `/api/platform/metrics` | Sí | 503, `not_configured` (faltan las claves de ventas) | 500, se caía al cargar |
| `/api/platform/tenant-sync` | Sí | 405 (solo acepta POST), la función carga | 500, se caía al cargar |
| `/api/create-tenant` | No | Sin confirmar: la herramienta recibió 401 y no distingue si vino de la función. Se prueba al abrir la pestaña Plataforma | — |

Las importaciones relativas de lo que carga una función deben llevar extensión `.js`; lo vigila `tests/api/vercel-imports.test.ts`. Esto debe seguir igual al crear los paquetes (etapa 2).

Vercel también publica como funciones los demás archivos de `api/`: `/api/platform/fakeSupabase` responde 500, y lo mismo se espera de las pruebas que viven ahí. No exponen datos, porque no atienden llamadas. La etapa 3 los saca de `api/` al moverla.

## Espacios de trabajo en OneDrive
Probado con una carpeta temporal en el mismo disco: npm creó los enlaces entre paquetes y Node los resolvió, también 20 segundos después con OneDrive activo. Es una prueba corta, así que se mantiene la precaución de pausar OneDrive durante la etapa 1.

## Prueba manual en el preview (etapas 1 y 3)
Entrar con la cuenta de Vercel, porque los previews están protegidos.

1. Abrir el sitio: portada, catálogo y filtros se ven igual que en el preview de `main`.
2. Abrir una ficha y enviar una consulta de prueba: el lead aparece en el panel.
3. Usar el chat: responde con el motor local (el preview no tiene clave de IA).
4. Iniciar sesión en el panel y revisar Leads, Propiedades y Mi corredora.
5. Invitar a un agente de prueba: llega el correo de invitación.
6. Usar "recuperar clave": llega el correo y el enlace abre el sitio.

Para los pasos 5 y 6, la dirección `https://portal-inmobiliario-ia-git-monorepo-setno.vercel.app/**` debe estar permitida en Supabase (desarrollo), en Authentication → URL Configuration.
