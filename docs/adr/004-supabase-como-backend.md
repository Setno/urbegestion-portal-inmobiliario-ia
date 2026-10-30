# ADR-004: Supabase (PostgreSQL gestionado) como backend y capa de persistencia

- Estado: aceptada (aún sin implementar)
- Fecha: 2026-10-30

## Contexto
Hoy los datos viven en el navegador, sin cuentas ni aislamiento. Se necesita base de datos relacional, autenticación, roles, seguridad por fila y archivos, con la mínima operación posible porque el responsable no programa.

## Opciones consideradas
| Opción | A favor | En contra | Costo |
| --- | --- | --- | --- |
| Supabase + React/Vite (elegida) | PostgreSQL con RLS, auth, storage y funciones; panel web; código abierto y autoalojable | Dependencia de un proveedor | Plan gratuito para pilotos; pago de entrada a decenas de USD/mes (por verificar) |
| Next.js + Postgres (Neon) + auth externo | Muy flexible, buen SEO | Más piezas que armar y mantener | Medio |
| Backend propio (NestJS + PostgreSQL + Redis) | Control total | Operación alta: respaldos, parches, caídas | Alto |
| Firebase | Muy simple | NoSQL, sin seguridad por fila nativa, mal ajuste a contratos y cobros | Bajo |
| Low-code | Sin programar | No logra multi-tenant real ni widget embebible | Bajo |

## Decisión
Supabase para base de datos, autenticación, roles, RLS por `tenant_id`, archivos y colas simples (outbox en PostgreSQL). Un esquema por módulo. El frontend conserva React/Vite como PWA. `src/core/storage/localStore.ts` es el único punto de persistencia a reemplazar.

## Consecuencias
Al implementarlo se reemplaza la persistencia local y el panel admin pasa a tener autenticación real, lo que retira el "Modo Master" y el flag `VITE_ENABLE_ADMIN` (H-006, H-008). El usuario crea la cuenta y administra las claves; nunca se comparten en el chat. Revisar el costo real al elegir plan.
