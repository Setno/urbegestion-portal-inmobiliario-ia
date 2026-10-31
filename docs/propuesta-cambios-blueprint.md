# Propuesta de cambios al BLUEPRINT (para tu aprobación)

El `BLUEPRINT Inmobiliario.md` es tu documento y no lo he modificado. Estos son los cambios que propongo a partir de las decisiones del 2026-10-30 (ADR-005 y ADR-006). Dime si los apruebas y los aplico, o aplícalos tú.

## §1 Resumen ejecutivo
**Antes:** "Una plataforma SaaS multi-tenant, modular por producto, con una capa de conexión (widget, API y dominio propio) para que cada corredora la enlace a su sitio web actual."
**Propuesta:** "Una plataforma SaaS multi-tenant que incluye el sitio web de la corredora con plantillas intercambiables y herramientas de gestión modulares (Captación, CRM, Gestión). Para quien ya tiene sitio, un plan de solo herramientas se conecta mediante widget y API."
**Antes:** "Primer producto a lanzar: Core + Captación + CRM."
**Propuesta:** "Primer producto a lanzar: Core + Captación + CRM + Sitio con plantillas."

## §5 Módulo 1 – Captación
La fila "Sitio propio con plantillas" pasa de **v2** a **MVP**, con esta aclaración: "En el MVP la corredora elige plantilla y modifica solo datos (logo, colores, textos, fotos y propiedades); la edición de estructura queda para una versión posterior. Se lanza con 2 plantillas."

## §12 Monetización y empaquetado
Agregar dos planes como forma de contratar:
| Plan | Incluye | Cliente ideal |
| --- | --- | --- |
| Completo | Sitio con plantillas + Captación + CRM (+ Gestión después) | Corredoras sin sitio o que quieren renovarlo |
| Solo herramientas | Widget y API de Captación + CRM | Corredoras que ya tienen sitio |
Mantener "Instancia dedicada" como plan posterior, con tres niveles de control de datos (estándar, base dedicada, en infraestructura propia). Los precios se definen tras los pilotos.

## §13 Principios técnicos y stack
Agregar: "El sitio público se construye con Next.js; la consola y el widget con React + Vite; el repositorio es un monorepo (ver ADR-006)."

## §14 Roadmap
En la **Fase 1** agregar: "Sitio con plantillas (2 plantillas), dominio propio por corredora, SEO y editor de datos del sitio".

## §16 Decisiones abiertas
Marcar como cerradas: "Elegir entre monolito modular y servicios separados" (monolito modular), "Decidir si el catálogo vive en el Core" (sí) y "Decidir entre PWA y apps nativas" (PWA primero). Agregar abiertas: "Costos de Vercel por dominios y tráfico" y "Precio de cada plan tras los pilotos".
