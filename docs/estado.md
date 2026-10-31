# Estado del proyecto

- Modo: adoptado
- Fase actual: A6 Adopción (documentos listos; faltan tests de caracterización y CI real)
- Última actualización: 2026-10-30

## Puertas

| Puerta | Estado | Fecha | Evidencia |
| --- | --- | --- | --- |
| G0 Problema y alcance MVP | cumplida (por el Blueprint) | 2026-10-30 | BLUEPRINT Inmobiliario.md, docs/brief.md |
| G1 Historias verificables | en curso: H-001 a H-003 detalladas, el resto por dividir | | docs/backlog.md |
| G2 Esqueleto en staging, CI verde | pendiente (no hay staging: sin despliegues hasta nuevo aviso) | | .github/workflows/ci.yml |
| G3 Historias del incremento cerradas | pendiente | | |
| G4 Verificación sin críticos/altos | pendiente (3 vulnerabilidades de desarrollo abiertas, H-003) | | `npm audit` |
| G5 Presupuestos de rendimiento y costo | pendiente | | |
| G6 Producción con smoke OK y alertas | pendiente (despliegue final) | | |

## Trabajo hecho antes de adoptar la metodología
- Fase 0 (commit d6c847a): auditoría, decisiones, higiene de seguridad.
- Paso 1 (commit 3344273): panel por pestañas, capa de datos y estructura por módulos.

## Siguiente paso
H-001 (lint) hecha y unida a main. H-002 (tests de caracterización) en revisión en la rama `feat/h-002-tests`. Siguiente: H-003 (dependencias vulnerables) y después dividir H-008 (Supabase).

Nota sobre las puertas: G2, G4 (pruebas dinámicas en staging) y G6 suponen desplegar. Como el despliegue será único y al final, quedan pendientes hasta entonces; mientras tanto se usan equivalentes locales (`npm run build` + `npm run preview`, y `vercel dev` para `/api`).

## Supuestos abiertos
- El proyecto de Vercel puede estar enlazado a GitHub: `vercel.json` desactiva los despliegues automáticos, pero conviene confirmarlo en el panel de Vercel.
- Costos de Supabase por verificar al elegir plan.
- Corredores piloto, portales con API y revisión legal siguen abiertos (Blueprint §16).
