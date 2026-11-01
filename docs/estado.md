# Estado del proyecto

- Modo: adoptado
- Fase actual: A6 Adopción (documentos listos; faltan tests de caracterización y CI real)
- Última actualización: 2026-11-01

## Puertas

| Puerta | Estado | Fecha | Evidencia |
| --- | --- | --- | --- |
| G0 Problema y alcance MVP | cumplida (por el Blueprint) | 2026-10-30 | BLUEPRINT Inmobiliario.md, docs/brief.md |
| G1 Historias verificables | en curso: H-001 a H-003 detalladas, el resto por dividir | | docs/backlog.md |
| G2 Esqueleto en staging, CI verde | pendiente (no hay staging: sin despliegues hasta nuevo aviso) | | .github/workflows/ci.yml |
| G3 Historias del incremento cerradas | pendiente | | |
| G4 Verificación sin críticos/altos | parcial: `npm audit` en 0 (H-003); faltan pruebas dinámicas en staging, que dependen del despliegue final | 2026-10-30 | `npm audit`, CI |
| G5 Presupuestos de rendimiento y costo | pendiente | | |
| G6 Producción con smoke OK y alertas | pendiente (despliegue final) | | |

## Trabajo hecho antes de adoptar la metodología
- Fase 0 (commit d6c847a): auditoría, decisiones, higiene de seguridad.
- Paso 1 (commit 3344273): panel por pestañas, capa de datos y estructura por módulos.

## Siguiente paso
Hechas y unidas a main: H-001, H-002, H-003, H-008.1, H-014, H-016, H-017 y H-018; el Blueprint está versionado. Unidas a main tras probarlas a mano: login real (H-008.2), corredora y rol (H-008.3), permisos por rol (H-008.4), recuperar clave (H-008.6) y retiro del Modo Master (H-006). La migración core (tenants y memberships) está aplicada en el Supabase de desarrollo, con la prueba de aislamiento (RLS) en verde. Unidas a main (migración correctiva `20261031140000` aplicada y verificada en desarrollo): propiedades y leads en Supabase mediante repositorios (H-009.1 a .3), con migración aplicada en desarrollo, datos de ejemplo cargados y prueba RLS en verde; H-009.4 (evento `lead.created`, probada a mano el 2026-11-01) quedó hecha; H-009.5 (imágenes en Storage) y notas atómicas hechas el 2026-11-01. Hechas el 2026-11-01 y probadas a mano en el preview: H-037 (flujo de aprobación de publicaciones, con modo por corredora; migración `20261101150000` aplicada en desarrollo y prueba RLS en verde), H-038 (de lead de propietario a propiedad en borrador) y H-025 (exportación de datos de la corredora). Propuesto el 2026-11-01 (ADR-009, pendiente de aprobación): el control comercial (suscripciones, cobros, métricas del negocio) vive en el proyecto de ventas y ambos proyectos se hablan por un contrato de variables versionado y ampliable (H-043). Pendiente de diseño: ordenar los ajustes del panel por rol (agente, administrador, dueño del SaaS). ADR-008 (paquetes de mercado) aprobado el 2026-11-01: H-040 hecha en código (todas las regiones de Chile y zonas de trabajo por corredora; migración aplicada en desarrollo); H-041 (precio con moneda) hecha en código, con su migración aplicada en desarrollo; H-040, H-041 y H-011 (paquete Chile) hechas y probadas; el segundo mercado se elegirá cuando se decida desarrollarlo; H-010 (textos traducibles) dividida: la infraestructura y la primera tajada están hechas (H-010.1) y siguen el sitio público, Captación y el panel (H-010.2 a H-010.4). Hay un despliegue de prueba (preview) en Vercel de `main` con las variables de desarrollo; producción no se ha tocado. Decisión del 2026-10-31: el foco es la funcionalidad; lo estacionado (H-004, H-005, H-007, H-019, H-023, H-024) se revisa antes del despliegue (H-013). Después: H-008.5 (invitar agentes), H-008.7 (alta de corredoras), H-009 (leads y CRM en Supabase) y las historias del sitio con plantillas (H-025 a H-035).

Nota sobre las puertas: G2, G4 (pruebas dinámicas en staging) y G6 suponen desplegar. Como el despliegue será único y al final, quedan pendientes hasta entonces; mientras tanto se usan equivalentes locales (`npm run build` + `npm run preview`, y `vercel dev` para `/api`).

## Supuestos abiertos
- El proyecto de Vercel puede estar enlazado a GitHub: `vercel.json` desactiva los despliegues automáticos, pero conviene confirmarlo en el panel de Vercel.
- Costos de Supabase por verificar al elegir plan.
- Corredores piloto, portales con API y revisión legal siguen abiertos (Blueprint §16).
