# ADR-003: SaaS multi-tenant con monolito modular

- Estado: aceptada
- Fecha: 2026-10-30

## Contexto
El blueprint plantea vender módulos (Captación, CRM, Gestión) a varias corredoras. Hay que elegir entre una plataforma compartida, instalaciones por cliente o servicios separados, con un equipo pequeño y un responsable sin experiencia en infraestructura.

## Opciones consideradas
| Opción | A favor | En contra | Costo |
| --- | --- | --- | --- |
| SaaS multi-tenant, monolito modular (elegida) | Una versión que mantener, integraciones resueltas una vez, ingreso recurrente | Exige aislamiento por tenant bien probado | Medio |
| Instalable por cliente | Datos en infraestructura del cliente | Soporte caro, versiones dispersas | Alto |
| Microservicios desde el día 1 | Aislamiento total | Costo de operación desproporcionado | Alto |

## Decisión
SaaS multi-tenant con `tenant_id` en cada tabla y evento, módulos con esquema propio que se comunican por eventos (`lead.created`, `deal.won`) e identificadores, y un monolito modular extraíble a servicios más adelante. Instancia dedicada solo como plan premium futuro.

## Consecuencias
El código se organiza por módulos (ESTRUCTURA.md). Hoy los módulos aún se importan entre sí; se separan al introducir eventos con Supabase (H-009). Requiere pruebas automáticas de fuga entre tenants y revisión externa de seguridad antes de producción.
