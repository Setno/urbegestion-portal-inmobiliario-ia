# ADR-011: Datos del sitio en una fila por corredora, separados de la plantilla

- Estado: aceptada (plan aprobado por el responsable el 2026-11-02)
- Fecha: 2026-11-02
- Precisa: ADR-005 y ADR-006

## Contexto
ADR-005 exige que el contenido viva en la base y que la plantilla solo decida cómo se muestra. Hasta H-027 la marca editada en el panel quedaba solo en el navegador de quien la editaba, y los textos de la landing estaban escritos en el código con datos de UrbeGestión: una corredora nueva habría mostrado el nombre, el teléfono y los testimonios de otra. La consola (React + Vite) y el sitio (Next.js) tienen que leer los mismos datos.

## Opciones consideradas
| Opción | A favor | En contra | Costo |
| --- | --- | --- | --- |
| Una fila por corredora con columnas JSON (`brand`, `theme`, `layout`, `content`) y un lector tolerante compartido (elegida) | Agregar un texto o una plantilla no requiere migración; mismo enfoque que los derechos de ADR-009; un solo lector para consola y sitio | La base no valida cada campo: la validación vive en el lector | Bajo |
| Una columna por dato | La base valida cada campo | Una migración por cada texto nuevo; las plantillas tienden a pedir textos distintos | Medio |
| Tablas por sección (testimonios, zonas de cobertura) | Permite editar cada elemento por separado | Exceso para un editor que aún no existe (H-032); se puede separar después | Medio |

## Decisión
- **Tabla `site_content`:** `tenant_id` como clave, más `template_id`, `brand`, `theme`, `layout` y `content`. Sin fila, la corredora se muestra neutra, solo con su nombre.
- **Lectura pública:** función `get_tenant_public_site`. Todo lo que hay en la tabla es público por diseño: nunca se guardan ahí claves ni ajustes internos.
- **Escritura:** función `set_site_brand`, solo para el administrador de esa corredora y si su plan incluye `branding.edit`. Los textos los editará H-032 con su propia función, y la plantilla, H-029.
- **Paquete `@portal/sitio-datos`:** define los tipos y el lector `parseSiteData`, que reemplaza cualquier dato raro por su valor neutro, descarta enlaces que no sean http o https y colores que no sean hexadecimales. La base no hace estas validaciones de contenido: limita el tamaño de cada columna, lo que además impide guardar fotos como texto.
- **Imágenes de marca:** van al almacenamiento de la corredora, sin reducir, para conservar la transparencia de los logos.
- **Consola:** con datos remotos nunca parte de la marca de ejemplo escrita en el código; parte de lo último leído (guardado por corredora en el navegador) o de un estado neutro. Sin Supabase conserva el comportamiento de siempre con los datos de ejemplo.
- **Sitio Next.js:** lee en el servidor por la API de la base, sin el cliente de Supabase, y regenera la página cada 60 segundos. La corredora se indica con la variable `SITIO_TENANT_ID` hasta H-030, que la resolverá por dominio.
- **Plantillas:** el sitio tiene un registro de plantillas; todas reciben los mismos datos y una desconocida cae en la predeterminada (`clasica`).
- **Next.js 16 con React 18:** se mantiene una sola versión de React en el monorepo. Next.js 16 avisa que dejará de admitir React 18 en su versión 17: hay que subir todo a React 19 antes de actualizar a esa versión.

## Consecuencias
- El sitio público tarda hasta un minuto en reflejar un cambio en `apps/sitio`; en la consola se ve al recargar.
- Los datos de UrbeGestión en la base de desarrollo salen de `supabase/seed-dev-sitio.sql`; producción necesitará su propia carga antes de H-013.
- Las afirmaciones comerciales ("25 años", "42 días") ya no están en los textos comunes de la interfaz: solo existen en los datos de cada corredora.
- Mientras no exista H-032, los textos de `content` se cargan directamente en la base.
- La consola solo deja editar la marca tras una lectura correcta: guardar reemplaza la marca completa y, de lo contrario, se borrarían los datos que el formulario no muestra (estadísticas, asistente, horario). H-032 debería guardar por partes.
- Si falla la lectura, el sitio Next.js lanza un error para conservar la última copia buena; si nunca hubo una, muestra "Sitio no disponible". Una compilación con la base caída falla en vez de publicar el aviso.
- **Decisión pendiente (H-030):** `get_tenant_public_site` y `apps/sitio` todavía no aplican `site.enabled` ni el estado de la suscripción, así que una corredora cancelada seguiría publicada.
