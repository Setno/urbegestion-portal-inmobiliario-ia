# Estado del proyecto

- Modo: adoptado
- Fase actual: A6 Adopción (documentos listos; faltan tests de caracterización y CI real)
- Última actualización: 2026-10-31

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
Hechas y unidas a main: H-001, H-002, H-003, H-008.1, H-014, H-016, H-017 y H-018; el Blueprint está versionado. Unidas a main tras probarlas a mano: login real (H-008.2), corredora y rol (H-008.3), permisos por rol (H-008.4), recuperar clave (H-008.6) y retiro del Modo Master (H-006). La migración core (tenants y memberships) está aplicada en el Supabase de desarrollo, con la prueba de aislamiento (RLS) en verde. Unidas a main (migración correctiva `20261031140000` aún sin aplicar, pendiente de aprobación): propiedades y leads en Supabase mediante repositorios (H-009.1 a .3), con migración aplicada en desarrollo, datos de ejemplo cargados y prueba RLS en verde; falta H-009.4 (evento `lead.created`) y H-009.5 (imágenes en Storage). Hay un despliegue de prueba (preview) en Vercel de `main` con las variables de desarrollo; producción no se ha tocado. Decisión del 2026-10-31: el foco es la funcionalidad; lo estacionado (H-004, H-005, H-007, H-019, H-023, H-024) se revisa antes del despliegue (H-013). Después: H-008.5 (invitar agentes), H-008.7 (alta de corredoras), H-009 (leads y CRM en Supabase) y las historias del sitio con plantillas (H-025 a H-035).

Nota sobre las puertas: G2, G4 (pruebas dinámicas en staging) y G6 suponen desplegar. Como el despliegue será único y al final, quedan pendientes hasta entonces; mientras tanto se usan equivalentes locales (`npm run build` + `npm run preview`, y `vercel dev` para `/api`).

## Supuestos abiertos
- El proyecto de Vercel puede estar enlazado a GitHub: `vercel.json` desactiva los despliegues automáticos, pero conviene confirmarlo en el panel de Vercel.
- Costos de Supabase por verificar al elegir plan.
- Corredores piloto, portales con API y revisión legal siguen abiertos (Blueprint §16).
