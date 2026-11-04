# ADR-013: Las tasas del día salen de una fuente pública, declarada por el paquete de mercado

- Estado: aceptada (2026-11-04)
- Relacionada con: ADR-008 (paquetes de mercado), H-051

## Contexto
El sitio mostraba y comparaba precios en UF usando un valor escrito a mano en el código (38.650 pesos), cuando el valor real de ese día era 41.268,88: un filtro por precio con ese dato habría dado resultados equivocados. La UF solo existe en Chile; al abrir otros mercados no debe ser necesaria.

## Opciones
1. **Que cada corredora escriba la UF.** Simple, pero se desactualiza a diario y depende de que alguien se acuerde.
2. **Leerla de una fuente pública, declarada por el paquete de mercado.** Automática; fuera de Chile el paquete no declara fuente y la UF no aparece.
3. **Calcularla en el sitio.** La UF es un dato oficial del Banco Central; no se puede calcular.

## Decisión
Opción 2. El paquete de mercado puede declarar `rateFeeds`: de dónde leer la tasa de cada moneda que no es la base, y cómo interpretar la respuesta. Chile declara la UF desde mindicador.cl (datos del Banco Central de Chile). El sitio la lee en el servidor, la guarda una hora y solo usa el valor de hoy o, si aún no está publicado, el último día anterior. Un valor fuera de rango (menos de 1.000 o más de 1.000.000 pesos) se descarta.

Si la fuente no responde, **no se inventa una tasa**: el sitio solo ofrece las monedas que puede comparar sin convertir (por ejemplo, solo UF si todo el catálogo está en UF) y deja de mostrar la nota de la UF.

## Consecuencias
- Un mercado sin unidades de cuenta no declara fuentes y no muestra nada de esto.
- Cambiar de fuente es cambiar una entrada del paquete de Chile, sin tocar el sitio.
- mindicador.cl es un servicio comunitario sin garantía de disponibilidad; en las pruebas del 2026-11-04 respondió a `curl` pero no a Node, ni en el computador de desarrollo ni en los servidores de Vercel (el sitio agotó la espera de 5 segundos y siguió sin tasa, como está previsto). La alternativa oficial y gratuita es la API de la CMF (requiere registrar una clave) o la del Banco Central (usuario y contraseña); se agregaría como segunda fuente de la UF sin cambiar el resto.
- La UF que usa la consola (Integraciones) sigue siendo manual por ahora.
