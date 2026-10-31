# ADR-002: Secretos solo en el servidor, con funciones serverless de Vercel y despliegue único al final

- Estado: aceptada
- Fecha: 2026-10-30

## Contexto
La versión inicial guardaba la clave del LLM y la URL del webhook en el navegador (`localStorage` o variables `VITE_*`), es decir, expuestas. Hoy no existe backend. El usuario decidió desplegar en Vercel una sola vez, al final.

## Opciones consideradas
| Opción | A favor | En contra | Costo |
| --- | --- | --- | --- |
| Funciones serverless en `api/` (elegida) | Sin servidor propio, claves en variables de entorno, mismo despliegue | Solo prueban de verdad en Vercel o con `vercel dev` | Bajo |
| Dejar las claves en el cliente | Cero cambios | Claves públicas y abusables | — |
| Backend propio | Control total | Operación pesada para el equipo | Alto |

## Decisión
`api/chat.ts` (LLM) y `api/lead-webhook.ts` (webhook) leen `LLM_API_KEY`, `AI_PROVIDER`, `AI_MODEL` y `GHL_WEBHOOK_URL` del entorno. El cliente solo llama a esos endpoints. El panel admin exige iniciar sesión con Supabase Auth (antes se habilitaba solo en desarrollo o con `VITE_ENABLE_ADMIN=true`). `vercel.json` desactiva los despliegues automáticos desde Git hasta el despliegue final.

## Consecuencias
Sin claves en el navegador. Pendientes: límite de tasa en `/api/*` (H-005) y cabeceras CSP/HSTS (H-004). En el despliegue final hay que reactivar los despliegues y cargar las variables (H-013). Esta decisión se absorbe parcialmente cuando exista Supabase (funciones en el servidor de Supabase).
