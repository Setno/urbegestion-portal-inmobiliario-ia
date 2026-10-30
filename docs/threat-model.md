# Modelo de amenazas

Fecha: AAAA-MM-DD · Método: STRIDE sobre el diagrama de arquitectura

## Activos y clasificación de datos
| Activo | Clasificación (público/interno/personal/sensible) | Dónde vive |
| --- | --- | --- |

## Límites de confianza
Navegador ↔ API, API ↔ BD, API ↔ terceros, usuario ↔ LLM (si aplica).

## Amenazas
| ID | Componente | STRIDE | Amenaza | Prob. | Impacto | Mitigación | Test que lo verifica |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T-01 | API | Elevación | Usuario accede a recursos de otro | | | Verificación de dueño en cada consulta | tests/integration/authz |

## Riesgos aceptados
| Riesgo | Por qué se acepta | Quién lo aprobó | Revisar en |
| --- | --- | --- | --- |
