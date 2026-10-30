# Decisiones de arquitectura (30-oct-2026)

Cierran los puntos abiertos del Blueprint §16 que condicionan el arranque.

| Tema | Decisión | Motivo |
|---|---|---|
| Modelo | SaaS multi-tenant | Una sola versión que mantener; ver Blueprint §2 |
| Arquitectura | Monolito modular, API-first, un esquema de BD por módulo | Aislamiento sin el costo de operar microservicios |
| Stack | **Opción A:** Supabase (PostgreSQL + auth + RLS + archivos) + React/Vite (PWA) + funciones serverless (Vercel) | Mínima operación para un equipo sin experiencia en infraestructura; PostgreSQL estándar |
| Catálogo de propiedades | Vive en el Core; los módulos lo referencian por identificador | Más simple; lo usan los tres módulos |
| Segundo mercado | Se decide después del piloto en Chile | Evita decidir sin datos reales |
| Idiomas | es-419 e inglés (propuesta del blueprint, sin cambios) | — |
| Dispositivo | PWA primero, apps nativas solo si los pilotos lo piden | — |

## Pendientes que siguen abiertos
- Corredores piloto (3 a 5), portales con API vs. correo, revisión legal (contratos, cobranza, datos) y seguimiento de la postergación de la Ley 21.719.
- Revisión externa de seguridad y aislamiento entre corredoras antes de producción con clientes reales.

## Paso 0 aplicado (higiene de seguridad)
- Eliminado el login falso y el atajo secreto. El panel admin solo se habilita en desarrollo o con `VITE_ENABLE_ADMIN=true` (demo); no hay autenticación real hasta tener Supabase.
- La clave del LLM y la URL del webhook salieron del navegador: viven en variables de entorno del servidor y se usan vía `api/chat.ts` y `api/lead-webhook.ts`.
- Archivados `Zenith*`, `main-02`, `index-02.html`; `maestro.md` movido a `docs/archivo/`.
- Pendiente: límite de tasa (rate limiting) en `/api/*`, CSP y HSTS en `vercel.json`.
