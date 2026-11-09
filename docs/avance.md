# Avance hacia el MVP

Actualizado: 2026-11-04 (tras cerrar H-063, abuso de `create_site_lead`). Se actualiza al cerrar cada historia.

## Indicador: 79 %

`████████░░` 122.8 de 156 puntos. Faltan 33.2 puntos, unos 28 días de trabajo como estimación gruesa.

| Bloque | Avance | Puntos |
| --- | --- | --- |
| Base técnica: calidad, monorepo y datos en la nube | `██████████` 100 % | 29.0 de 29 |
| Cuentas, corredoras, roles y planes | `█████████░` 92 % | 22.0 de 24 |
| Catálogo, publicación y mercado Chile | `██████████` 100 % | 23.0 de 23 |
| Sitio propio de cada corredora | `████████░░` 81 % | 27.4 de 34 |
| Captación y CRM que pide el Blueprint | `████░░░░░░` 41 % | 13.0 de 32 |
| Seguridad y salida a producción | `██████░░░░` 60 % | 8.4 de 14 |

Si se cuenta solo lo que hoy está anotado en el backlog, el avance sería 76 %. Ese número es engañoso: deja fuera las funciones de CRM del Blueprint que aún no tienen historia.

## Cómo se calcula

- **Qué es el MVP:** Core, Captación y CRM en Chile (`docs/brief.md`), más el sitio propio de cada corredora (ADR-005) y lo necesario para salir a producción. Es una propuesta y el responsable puede cambiarla.
- **Puntos por tamaño:** S = 1, M = 2, M+ = 4. Un punto equivale aproximadamente a medio día de trabajo (según los tamaños del método).
- **Crédito:** hecha = 100 %; en revisión (código listo, sin unir a `main` o sin prueba final) = 80 %; pendiente o estacionada = 0 %.
- **Fuera del MVP:** H-007 (Instagram archivado), H-010.4 (traducciones), H-035 (editor de estructura), H-036 (panel del dueño) y todo lo marcado v2 en el Blueprint, además de los módulos de arriendos y ventas.
- **No se cuenta aquí:** revisión legal con abogado, pilotos con corredoras y definición de precios. Son necesarios para vender, pero no son desarrollo.

## Qué falta

**Cuentas, corredoras, roles y planes:** H-043.3.

**Sitio propio de cada corredora:** H-029, H-050. Al 80 % (hechas en código, falta unirlas a `main` o la prueba a mano desde el panel): H-027.1, H-028.4a, H-028.4b, H-028.4c, H-030, H-049, H-051, H-031, H-032 y H-048.

**Captación y CRM que pide el Blueprint:** al 80 %: H-053, H-054 y H-060 (de H-054 faltan las claves de correo y Telegram). Pendientes: H-034, WhatsApp: la conversación entrante queda como lead (M+, sin historia aún), Consultas de portales por correo (M+, sin historia aún), Pipelines por tipo de cliente (M+, sin historia aún), Asignación de leads (M, sin historia aún).

**Seguridad y salida a producción:** al 80 % (hechas en código y aplicadas en desarrollo, falta unirlas a `main` y mirarlas en un preview): H-004, H-005, H-047, H-052, H-063 (falta cargar la clave de servicio en el proyecto del sitio en Vercel) y la parte de leads de H-055; H-019 hecha; H-024 a medias (falta Lighthouse). Pendientes: H-013 (preparada, espera tu orden), H-062 (base de producción y variables: pasos tuyos, en `docs/guia-produccion.md`), H-023 (prueba de punta a punta: falta decidir la cuenta de prueba).

**Publicación en portales (pedido 2026-11-09):** H-068 en curso. H-068.1 (traductor del aviso) hecha en código; faltan H-068.2 a H-068.5 y que el responsable registre la app en Mercado Libre. No estaba en el MVP: no cambia el porcentaje hacia el MVP.

## Decisión pendiente

El 2026-11-04 el responsable eligió para el primer piloto tareas, línea de tiempo, atribución, agenda y reportes (H-056 a H-060); asignación de leads, pipelines por tipo, WhatsApp y portales quedan sin historia y sin descartar. Las funciones marcadas "sin historia aún" vienen de las tablas MVP del Blueprint (§5 y §8) y sus tamaños son estimados. El responsable debe confirmar cuáles son indispensables para el primer piloto; cada una que salga del MVP sube el porcentaje.
