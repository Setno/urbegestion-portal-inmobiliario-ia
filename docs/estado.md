# Estado del proyecto

- Modo: adoptado
- Fase actual: A6 Adopción (documentos listos; faltan tests de caracterización y CI real)
- Última actualización: 2026-11-02

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
H-028 (la landing como plantilla clásica en Next.js): H-028.1 y H-028.2 hechas en código el 2026-11-02, en la rama `h-028-plantilla-clasica`, que parte de `h-027-datos-del-sitio`; ninguna de las dos está unida a `main`. Sigue H-028.3 (ficha y formulario que crea leads). Falta crear el proyecto de Vercel del sitio y confirmar con el responsable la prueba de guardar la marca desde el panel: la base muestra un cambio de marca y colores del 2026-11-02, posterior al preview de H-027.

H-026 (monorepo) quedó terminada: la consola, sus funciones y sus pruebas viven en `apps/consola`, el sitio en `apps/sitio`, hay cuatro paquetes en `packages/` (`plataforma`, `mercados`, `dinero` y `sitio-datos`), y la carpeta raíz del proyecto de la consola en Vercel es `apps/consola`. Abierto: Semgrep está en rojo en el CI, al parecer desde antes del monorepo (revisar antes de H-013), `npm audit` muestra 11 avisos moderados de `minimatch`, y `vercel dev` no se ha probado con la estructura nueva.

Hechas y unidas a main: H-001, H-002, H-003, H-008.1, H-014, H-016, H-017 y H-018; el Blueprint está versionado. Unidas a main tras probarlas a mano: login real (H-008.2), corredora y rol (H-008.3), permisos por rol (H-008.4), recuperar clave (H-008.6) y retiro del Modo Master (H-006). La migración core (tenants y memberships) está aplicada en el Supabase de desarrollo, con la prueba de aislamiento (RLS) en verde. Unidas a main (migración correctiva `20261031140000` aplicada y verificada en desarrollo): propiedades y leads en Supabase mediante repositorios (H-009.1 a .3), con migración aplicada en desarrollo, datos de ejemplo cargados y prueba RLS en verde; H-009.4 (evento `lead.created`, probada a mano el 2026-11-01) quedó hecha; H-009.5 (imágenes en Storage) y notas atómicas hechas el 2026-11-01. Hechas el 2026-11-01 y probadas a mano en el preview: H-037 (flujo de aprobación de publicaciones, con modo por corredora; migración `20261101150000` aplicada en desarrollo y prueba RLS en verde), H-038 (de lead de propietario a propiedad en borrador) y H-025 (exportación de datos de la corredora). Aprobado el 2026-11-01 (ADR-009): el control comercial (suscripciones, cobros, métricas del negocio) vive en el proyecto de ventas y ambos proyectos se hablan por un contrato de variables versionado y ampliable; H-043.1 (catálogo, lector y funciones can/limit) y H-043.2 (tabla de derechos con migración aplicada en desarrollo, endpoints firmados `api/platform/tenant-sync` y `metrics`) hechas en código; falta cargar las dos claves en Vercel para probar con una llamada real (guía en docs/integracion-ventas.md). H-033 (aplicar planes y estados en el panel y en la invitación de agentes) hecha el 2026-11-01; H-045 (aplicarlos en el sitio público y en la base, con migración aplicada en desarrollo) hecha el mismo día. Panel ordenado por rol el 2026-11-01 (H-044): agente, administrador (con "Mi corredora") y dueño del producto (con "Plataforma"). ADR-008 (paquetes de mercado) aprobado el 2026-11-01: H-040 hecha en código (todas las regiones de Chile y zonas de trabajo por corredora; migración aplicada en desarrollo); H-041 (precio con moneda) hecha en código, con su migración aplicada en desarrollo; H-040, H-041 y H-011 (paquete Chile) hechas y probadas; el segundo mercado se elegirá cuando se decida desarrollarlo; H-010 (textos traducibles) dividida: la infraestructura y la primera tajada están hechas (H-010.1) y siguen el sitio público, Captación y el panel (H-010.2 a H-010.4). Hay un despliegue de prueba (preview) en Vercel de `main` con las variables de desarrollo; producción no se ha tocado. Decisión del 2026-10-31: el foco es la funcionalidad; lo estacionado (H-004, H-005, H-007, H-019, H-023, H-024) se revisa antes del despliegue (H-013). Después: H-008.5 (invitar agentes), H-008.7 (alta de corredoras), H-009 (leads y CRM en Supabase) y las historias del sitio con plantillas (H-025 a H-035).

Nota sobre las puertas: G2, G4 (pruebas dinámicas en staging) y G6 suponen desplegar. Como el despliegue será único y al final, quedan pendientes hasta entonces; mientras tanto se usan equivalentes locales (`npm run build` + `npm run preview`, y `vercel dev` para `/api`).

## Supuestos abiertos
- El proyecto de Vercel puede estar enlazado a GitHub: `vercel.json` desactiva los despliegues automáticos, pero conviene confirmarlo en el panel de Vercel.
- Costos de Supabase por verificar al elegir plan.
- Corredores piloto, portales con API y revisión legal siguen abiertos (Blueprint §16).
