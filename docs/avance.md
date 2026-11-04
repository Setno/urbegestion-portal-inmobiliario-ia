# Avance hacia el MVP

Actualizado: 2026-11-04 (tras la prueba a mano de H-056 a H-059). Se actualiza al cerrar cada historia.

## Indicador: 72 %

`███████░░░` 112.8 de 156 puntos. Faltan 43.2 puntos, unos 28 días de trabajo como estimación gruesa.

| Bloque | Avance | Puntos |
| --- | --- | --- |
| Base técnica: calidad, monorepo y datos en la nube | `██████████` 100 % | 29.0 de 29 |
| Cuentas, corredoras, roles y planes | `█████████░` 92 % | 22.0 de 24 |
| Catálogo, publicación y mercado Chile | `██████████` 100 % | 23.0 de 23 |
| Sitio propio de cada corredora | `████████░░` 81 % | 27.4 de 34 |
| Captación y CRM que pide el Blueprint | `████░░░░░░` 36 % | 11.4 de 32 |
| Seguridad y salida a producción | `░░░░░░░░░░` 0 % | 0.0 de 14 |

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

**Captación y CRM que pide el Blueprint:** al 80 %: H-053 y H-054 (de H-054 faltan las claves de correo y Telegram). Pendientes: H-034, WhatsApp: la conversación entrante queda como lead (M+, sin historia aún), Consultas de portales por correo (M+, sin historia aún), Pipelines por tipo de cliente (M+, sin historia aún), Asignación de leads (M, sin historia aún), Reportes básicos (H-060, M).

**Seguridad y salida a producción:** H-004, H-005, H-013, H-019, H-023, H-024, H-047, H-052, Producción: base propia, proyecto del sitio y variables (M, sin historia aún).

## Decisión pendiente

El 2026-11-04 el responsable eligió para el primer piloto tareas, línea de tiempo, atribución, agenda y reportes (H-056 a H-060); asignación de leads, pipelines por tipo, WhatsApp y portales quedan sin historia y sin descartar. Las funciones marcadas "sin historia aún" vienen de las tablas MVP del Blueprint (§5 y §8) y sus tamaños son estimados. El responsable debe confirmar cuáles son indispensables para el primer piloto; cada una que salga del MVP sube el porcentaje.
