# Monorepo (H-026): línea base y prueba de cada etapa

Cómo está todo antes de mover nada (rama `monorepo`, medido el 2026-11-02 sobre el commit `e0fdec2`). Cada etapa se compara contra esto. Decisiones en `docs/adr/010-organizacion-del-monorepo.md`.

## Lo que se mide en cada etapa
| Qué | Línea base | Condición |
| --- | --- | --- |
| Pruebas | 604 pasan, en 57 archivos | Las mismas 604, comparadas por nombre |
| Tipos | sin errores | Igual |
| Lint | 156 archivos revisados, 0 errores y 0 avisos | Ningún archivo deja de revisarse |
| Reglas de lint activas | `src/App.tsx`: 93, con `react-hooks`; `api/chat.ts`: 91; `scripts/verificar-supabase.mjs`: 86 | Mismas cantidades |
| CSS generado | 53.418 bytes (`index-CeaLyH-Y.css`) | Mismo tamaño; una baja indica que Tailwind perdió archivos |
| JS generado | 1.213.556 bytes (`index-D8ldTTZh.js`) | Diferencia mínima y explicada |
| Dependencias externas | las de `package-lock.json` | Mismas versiones |

## Funciones del servidor en el preview de `main` (`9fc9311`)
Sin clave de acceso, llamadas por GET. Los dos commits posteriores solo cambian documentos.

| Función | Importa de `src/` | Respuesta | ¿Es la esperada? |
| --- | --- | --- | --- |
| `/api/lead-webhook` | No | 200, `{"configured":false}` | Sí |
| `/api/chat` | No | 405 (solo acepta POST) | Sí, la función carga |
| `/api/create-tenant` | No | Por medir en el preview de la rama | |
| `/api/invite` | Sí | **500, se cae al cargar** | **No (H-046)** |
| `/api/platform/metrics` | Sí | **500, se cae al cargar** (debería ser 503, `not_configured`) | **No (H-046)** |
| `/api/platform/tenant-sync` | Sí | **500, se cae al cargar** | **No (H-046)** |

Causa, según los registros de Vercel: `ERR_MODULE_NOT_FOUND`. Las tres importan archivos de `src/` sin extensión, y Node no los encuentra en Vercel. Las pruebas no lo detectan porque Vitest sí resuelve esas rutas.

## Espacios de trabajo en OneDrive
Probado con una carpeta temporal en el mismo disco: npm creó los enlaces entre paquetes y Node los resolvió, también 20 segundos después con OneDrive activo. Es una prueba corta, así que se mantiene la precaución de pausar OneDrive durante la etapa 1.

## Prueba manual en el preview (etapas 1 y 3)
Entrar con la cuenta de Vercel, porque los previews están protegidos.

1. Abrir el sitio: portada, catálogo y filtros se ven igual que en el preview de `main`.
2. Abrir una ficha y enviar una consulta de prueba: el lead aparece en el panel.
3. Usar el chat: responde con el motor local (el preview no tiene clave de IA).
4. Iniciar sesión en el panel y revisar Leads, Propiedades y Mi corredora.
5. Invitar a un agente de prueba: hoy falla por H-046.
6. Usar "recuperar clave": llega el correo y el enlace abre el sitio.

Para los pasos 5 y 6, la dirección `https://portal-inmobiliario-ia-git-monorepo-setno.vercel.app/**` debe estar permitida en Supabase (desarrollo), en Authentication → URL Configuration.
