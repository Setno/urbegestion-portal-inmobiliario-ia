# ADR-008: Todo lo específico de un país vive en un paquete de mercado que se asigna a cada corredora

- Estado: aceptada (aprobada por el responsable el 2026-11-01, incluidas las migraciones de H-040 y H-041)
- Fecha: 2026-11-01

## Contexto
El Blueprint (secciones 6 y 7) define que ningún módulo contiene nada específico de un país y que lo local vive en "paquetes de mercado" activados por corredora. El código de hoy no lo cumple. Medido el 2026-11-01 en `src/` y `api/` (sin pruebas):

| Qué está fijo a Chile | Dónde |
| --- | --- |
| Solo comunas de la Región Metropolitana: el buscador, el formulario de propiedades y el valorizador usan `REGION_METROPOLITANA_ZONES` | 8 archivos |
| El precio se guarda en UF (`priceUf`, columna `price_uf`) y solo existen las monedas UF y CLP | 16 archivos (UF) y 7 (CLP); base de datos incluida |
| Formato de números `es-CL` escrito en el código | 5 archivos |
| Textos con "Santiago", "Región Metropolitana", teléfono +56 y aviso de la Ley 21.719 | 12 y 8 archivos |
| Textos de interfaz escritos en el código, solo en español (H-010) | todo el producto |

Consecuencia concreta: una corredora de Valparaíso, Concepción o Temuco no puede publicar ni buscar propiedades fuera de Santiago, y una corredora de otro país no puede usar el producto.

## Opciones consideradas
| Opción | A favor | En contra | Costo |
| --- | --- | --- | --- |
| A. Dejar Chile fijo en el código y adaptar cuando llegue otro país | Cero trabajo hoy | Cada país nuevo toca Captación, CRM y Catálogo; el trabajo crece con cada mercado; hoy ya falla para otras regiones de Chile | Bajo hoy, alto después |
| B. Paquete de mercado como dato y funciones detrás de una interfaz, asignado a cada corredora (recomendada) | Un país nuevo es un paquete nuevo; cumple el Blueprint; arregla de inmediato las otras regiones de Chile | Requiere cambiar el modelo de precio (una migración) y ordenar textos | Medio, repartido en historias pequeñas |
| C. Una copia del producto por país | Aislamiento total | Mantenimiento multiplicado; contradice el SaaS multi-tenant (ADR-003) | Alto y creciente |

## Decisión (propuesta)
Se elige la opción B, con estas reglas:

1. **Interfaz `MarketPack`** en `src/markets/<país>/`: idioma por defecto, monedas y unidad de reajuste (en Chile, UF), esquema de ubicaciones, validador del documento de identidad, prefijo telefónico, marco de privacidad (texto y versión) y unidades de superficie. Ningún módulo importa un país: pide al paquete a través de la interfaz.
2. **La corredora elige su mercado** (`tenants.market`, por defecto `cl`) y **sus zonas de trabajo** (`tenants.service_areas`). El buscador, el formulario de propiedades, el valorizador y el chat ofrecen solo esas zonas; el sitio deja de decir "Santiago" y usa la zona de la corredora.
3. **Ubicaciones como dato jerárquico** (país, región, comuna o ciudad, sector). Chile se carga completo (las 16 regiones y sus comunas). Si un mercado no tiene lista, se acepta texto libre.
4. **Precio con su moneda**: la propiedad guarda monto y moneda (`price_amount`, `price_currency`) en vez de `price_uf`. La UF pasa a ser una moneda del paquete Chile, con su conversión a pesos. Los datos actuales se migran como monto en UF.
5. **Textos y formatos** salen del código (H-010) y se formatean con `Intl` según el idioma de la corredora; base es-419, luego inglés.

Orden propuesto (de más a menos urgente):
1. Ubicaciones y zonas de la corredora (H-040): desbloquea a cualquier corredor de otra región de Chile.
2. Textos e idioma (H-010).
3. Precio con moneda (H-041): lleva la migración.
4. Paquete Chile formal y segundo mercado para probar la abstracción (H-011; el candidato se elige con el Blueprint, sección 6).

## Consecuencias
- Más fácil: sumar una región o un país es agregar datos, sin tocar los módulos; las pruebas de pantalla (H-020, H-021) protegen el cambio.
- Más difícil: el modelo de precio cambia una vez (migración nueva, que requiere aprobación explícita y se aplica primero en desarrollo); el chat local y los textos que mencionan Santiago deben leer la zona de la corredora.
- A revisar: elegir el segundo mercado antes de H-041, para no diseñar la moneda solo con Chile en mente; validar con un abogado local el tratamiento de datos de cada país nuevo.
