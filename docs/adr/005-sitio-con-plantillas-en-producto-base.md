# ADR-005: El sitio web con plantillas intercambiables forma parte del producto base

- Estado: aceptada
- Fecha: 2026-10-30

## Contexto
El Blueprint ponía el "sitio propio con plantillas" en la v2 y vendía primero Captación y CRM conectados al sitio existente de cada corredora. El responsable del producto decidió que el producto debe incluir la página web desde el inicio, con posibilidad de cambiar de plantilla, y ofrecer además un plan de solo herramientas para quien ya tiene sitio.

## Opciones consideradas
| Opción | A favor | En contra | Costo |
| --- | --- | --- | --- |
| Dos planes: Completo (sitio + herramientas) y Solo herramientas (widget/API + CRM) (elegida) | Producto más completo y diferenciado; atiende a quien tiene y a quien no tiene sitio | Más alcance en el primer lanzamiento | Alto |
| Solo herramientas conectadas al sitio existente (propuesta original del Blueprint) | Más rápido de lanzar | Deja fuera a corredoras sin sitio y a quienes quieren renovarlo | Medio |
| Sitio fijo sin plantillas | Más simple | Sin diferenciación ni intercambio | Medio |

## Decisión
1. Dos formas de contratar: **Plan Completo** (sitio con plantillas + Captación + CRM, y Gestión más adelante) y **Plan Solo herramientas** (widget y API de Captación + CRM, conectados al sitio actual de la corredora). Los precios se definen tras validar con corredores piloto.
2. **MVP de plantillas:** la corredora elige una plantilla y modifica únicamente **datos** (logo, colores, textos, fotos y propiedades). **No** modifica la estructura del sitio; eso queda para una versión posterior.
3. Lanzar con **2 plantillas** (la landing actual adaptada y una distinta) para validar que el intercambio funciona sin perder datos.
4. Contenido y diseño separados: los datos viven en la base de datos (Core) y la plantilla solo decide cómo se muestran.
5. Cada corredora tiene su sitio en **dominio propio o subdominio**, conectado por registros DNS que ella agrega; el certificado de seguridad es automático.

## Consecuencias
El alcance del primer lanzamiento crece (historias H-026 a H-034 del backlog). El Blueprint (§1, §5, §12, §14) queda desactualizado en este punto; se deja una propuesta de cambios en `docs/propuesta-cambios-blueprint.md`. Se requiere una exportación completa de datos para cada corredora (H-025), pues "tus datos son tuyos y los puedes exportar" es parte de la oferta.
