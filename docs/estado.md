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
Hechas y unidas a main: H-001, H-002, H-003, H-014 (Instagram archivado), H-016, H-017 y H-018; el Blueprint está versionado. Decisión del 2026-10-31: el foco es la funcionalidad; seguridad y comprobaciones amplias (H-004, H-005, H-006, H-007, H-019, H-023, H-024) están **estacionadas** y se revisan antes del despliegue final (H-013). H-008 (Supabase) quedó dividida el 2026-10-31 en H-008.1 a H-008.7 (pendiente de visto bueno). H-008.1 (spike del entorno de Supabase) lista en la rama `feat/h-008-1-spike-supabase`, pendiente de visto bueno. Siguiente: H-008.2 (login real) y después las historias del sitio con plantillas (H-025 a H-035).

Nota sobre las puertas: G2, G4 (pruebas dinámicas en staging) y G6 suponen desplegar. Como el despliegue será único y al final, quedan pendientes hasta entonces; mientras tanto se usan equivalentes locales (`npm run build` + `npm run preview`, y `vercel dev` para `/api`).

## Supuestos abiertos
- El proyecto de Vercel puede estar enlazado a GitHub: `vercel.json` desactiva los despliegues automáticos, pero conviene confirmarlo en el panel de Vercel.
- Costos de Supabase por verificar al elegir plan.
- Corredores piloto, portales con API y revisión legal siguen abiertos (Blueprint §16).
