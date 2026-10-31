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
- Archivados `Zenith*`, `main-02`, `index-02.html` y `maestro.md` en `_archivo/` (fuera de git).
- Pendiente: límite de tasa (rate limiting) en `/api/*`, CSP y HSTS en `vercel.json`.

## Actualización: sitio con plantillas en el producto base (2026-10-30)
Ver docs/adr/005 y docs/adr/006. Propuesta de cambios al Blueprint en docs/propuesta-cambios-blueprint.md.

| Tema | Decisión | Motivo |
|---|---|---|
| Producto | Dos planes: **Completo** (sitio con plantillas + herramientas) y **Solo herramientas** (widget/API + CRM) | Atiende a corredoras con y sin sitio web |
| Plantillas en el MVP | La corredora elige plantilla y modifica **solo datos** (logo, colores, textos, fotos, propiedades); no la estructura | Alcance acotado para el MVP; edición de estructura en una versión posterior |
| Plantillas al lanzar | 2 (la landing actual adaptada y una distinta) | Validar que el intercambio funciona |
| Sitio público | Next.js; consola y widget siguen en React + Vite; monorepo | SEO, velocidad y un mismo código sirviendo muchos dominios |
| Dominios | Dominio propio o subdominio por corredora, conectado con registros DNS | La corredora conserva su dominio |
| Dónde corre | Servicios administrados (Supabase y Vercel) a cargo nuestro; hosting propio solo si el volumen lo justifica | Mínima operación |
| Datos de la corredora | Son de la corredora, alojados por nosotros, con exportación completa (H-025) | Confianza y portabilidad |
| Control de datos por la corredora | Tres niveles: estándar (nuestra plataforma), base dedicada (nuestra cuenta) y en su infraestructura; los dos últimos solo bajo demanda y con tarifa mayor | Cada instalación dedicada multiplica la operación |

Abierto: costos de Vercel por dominios y tráfico; precios de cada plan tras los pilotos; tratamiento legal (responsable/encargado) según el nivel de control de datos.
