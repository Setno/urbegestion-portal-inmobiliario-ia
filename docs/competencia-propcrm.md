# Auditoría de competencia: PropCRM

Fecha: 2026-11-11 · Fuente: https://propcrm.com/features.php y https://propcrm.com/pricing.php (solo lo que dice su sitio público; no se probó el producto).

## Quiénes son

CRM inmobiliario para Dubái y Emiratos Árabes. Se vende por usuario: **Standard USD 55**, **Pro USD 85** al mes por usuario (20 % menos anual) y **Enterprise** a cotizar. Su fuerte es juntar en un solo lugar los leads de los portales de su país (Property Finder, Bayut, Dubizzle) y de los avisos de Facebook e Instagram, y contactarlos por WhatsApp y correo.

Las cifras que muestran ("45 % más conversión", "60 % respuesta más rápida") no tienen fuente: son publicidad.

## Comparación función por función

Leyenda: ✅ lo tenemos · 🟡 parcial · ❌ no lo tenemos · ⏸ decidido no hacerlo por ahora.

### Captación de leads

| Función de PropCRM | Nosotros | Detalle |
| --- | --- | --- |
| Leads de todos los canales en un solo lugar | 🟡 | Entran del sitio propio (ficha, chat, valorizador, formulario de visita) con origen. No entran las consultas de los portales ni de avisos de redes sociales. |
| Aviso inmediato de lead nuevo | ✅ | H-054: aviso en vivo en el panel y por correo (Resend). Telegram espera claves. |
| Consultas de portales que entran solas como lead | ❌ | Ellos: Property Finder, Bayut, Dubizzle. Nosotros ya conectamos la cuenta de Mercado Libre (H-068.2); falta traer sus **preguntas** como leads. Anotado en el Blueprint como "Consultas de portales" (sin historia). |
| Avisos de Facebook/Instagram (lead ads) y Zapier | ❌ / ⏸ | Tenemos webhook de **salida** (los leads se mandan a otro sistema). No hay puerta de **entrada** para leads de otros sistemas. Instagram está fuera por decisión del 2026-10-31. |
| Puntaje y etiquetas manuales | ❌ | Tenemos etapa, presupuesto y origen, pero no etiquetas libres ni prioridad (caliente/tibio/frío). |
| Asignación automática por zona o especialidad | ❌ | Pendiente "Asignación de leads" (sin historia). Ya existen las zonas de trabajo (H-040), que servirían de base. |
| Detección y unión de duplicados | ❌ | Si la misma persona escribe por el chat y luego pide visita, quedan dos leads. |
| Atribución por fuente y campaña | ✅ | H-058: UTM, campaña y propiedad consultada. |

### Seguimiento

| Función de PropCRM | Nosotros | Detalle |
| --- | --- | --- |
| Seguimientos programados | 🟡 | H-056: una próxima acción con fecha por lead y la lista "Para hoy". No hay varias tareas por lead. |
| Recordatorios según prioridad | 🟡 | Las vencidas se marcan en rojo en el panel; no hay aviso por correo ni celular. |
| Historial de conversaciones | ✅ | H-057: línea de tiempo con llamadas, WhatsApp, correos, visitas, notas y cambios de etapa. Se registra a mano. |
| Agenda de visitas | ✅ | H-059: calendario mensual, reagendar y aviso de choque de horario. |
| Secuencias automáticas de correo (goteo) | ❌ | — |

### WhatsApp y correo

| Función de PropCRM | Nosotros | Detalle |
| --- | --- | --- |
| Abrir WhatsApp desde el CRM | ✅ | Botón que abre la conversación (enlace `wa.me`). |
| Plantillas y respuestas rápidas | ❌ | Se podrían hacer sin la API oficial: el botón abre WhatsApp con el texto ya escrito. |
| Mensajes automáticos (al llegar el lead, recordatorio de visita) | ❌ | Requiere la API de WhatsApp Business (Meta), que tiene costo por conversación y aprobación de plantillas. |
| Conversación guardada sola en el historial | ❌ | Hoy se anota a mano. También requiere la API. |
| SMS | ⏸ | Poco usado en Chile; no vale la pena. |
| Enviar correos desde el CRM con plantillas | ❌ | Solo mandamos avisos internos a la corredora. |
| Saber si el cliente abrió el correo o hizo clic | ❌ | Depende de lo anterior. |

### Propiedades y portales

| Función de PropCRM | Nosotros | Detalle |
| --- | --- | --- |
| Crear una vez y publicar en varios portales | 🟡 | Sitio propio ✅ y Mercado Libre / Portal Inmobiliario (H-068.3, hecho en código). Faltan otros portales chilenos (Toctoc, Yapo, iCasas…). |
| Cambios de precio o estado que se reflejan en todos lados | 🟡 | En el sitio sí. En Mercado Libre falta H-068.4. |
| Fotos optimizadas al subirlas | 🟡 | Se guardan en la nube (H-009.5); el ajuste de tamaño y proporción es H-065 (pendiente). |
| Video | ✅ | — |
| Recorridos 360° | ❌ | Bastaría con un campo para pegar el enlace de Matterport u otro. |
| Cruzar propiedades con lo que busca cada lead | 🟡 | El chat recomienda propiedades al visitante, pero desde la ficha del lead el corredor no ve "propiedades que le calzan". |
| Rendimiento por aviso (vistas, consultas) | 🟡 | Sabemos qué propiedad consultó cada lead; no contamos vistas. |
| Base de proyectos en verde de Emiratos | ❌ | Propio de su mercado. El equivalente chileno serían proyectos de inmobiliarias en verde/blanco: alto costo de mantener los datos. |

### Reportes y equipo

| Función de PropCRM | Nosotros | Detalle |
| --- | --- | --- |
| Tablero de ventas y conversión | ✅ | H-060 y H-061: embudo, origen, campaña, tiempos de respuesta y tarjetas de números clave. |
| Rendimiento por agente | ❌ | Llega con la asignación de leads. |
| Retorno por portal o campaña (ROI) | 🟡 | Tenemos conversión por campaña; falta anotar cuánto se gastó en cada una. |
| Proyección de ingresos | ❌ | Fuera del MVP (comisiones y ofertas son Blueprint v2). |
| Reportes a medida y exportación | 🟡 | Exportación CSV ✅ (H-025, H-053); reportes a medida no. |
| Roles, permisos e invitar agentes | ✅ | H-008.3 a H-008.5. |
| Territorios por agente | ❌ | Ver asignación de leads. |

### Plan Pro y Enterprise

| Función | Nosotros | Detalle |
| --- | --- | --- |
| Agenda del fotógrafo | ❌ | Podría ser un tipo de evento más en la agenda. |
| Prevención de lavado de activos (AML) | ❌ | Revisar con abogado si en Chile aplica a corredoras (UAF, Ley 19.913) antes de considerarlo. |
| Contratos de arriendo y escrituración | ❌ | Módulo de arriendos: fuera del MVP. |
| RR. HH. y contabilidad | ⏸ | No es nuestro foco. |
| Marca blanca | ✅ | Es nuestra base: cada corredora con su marca, su sitio y su dirección. |
| Automatizaciones avanzadas e integraciones a medida | ❌ | Relacionado con H-034 (API pública). |

## Lo que nosotros tenemos y PropCRM no muestra

- **Sitio web propio de cada corredora** con plantilla, su dirección o dominio, SEO y editor de textos. PropCRM solo "incrusta listados" en una web que la corredora ya tiene.
- **Asistente de IA** en el sitio que responde, recomienda propiedades y deja el contacto como lead.
- **Valorizador para propietarios**: capta a quien quiere vender o arrendar, no solo a quien compra.
- **Hecho para Chile**: UF, regiones y comunas, Ley 21.719 de datos personales con consentimiento en los formularios.
- **Atribución por campaña** desde el primer clic.

Esa es la diferencia que conviene contar al vender: PropCRM ordena leads que ya llegan; nosotros además le damos a la corredora el sitio que los genera.

## Recomendación: qué tomar de PropCRM

Ordenado por valor para una corredora chilena y por esfuerzo. Tamaños: S ≈ medio día, M ≈ un día, M+ = varios días.

| # | Idea | Por qué | Tamaño |
| --- | --- | --- | --- |
| 1 | **Detección de duplicados** al entrar un lead (mismo correo o teléfono) y botón para unirlos | Con chat, ficha y valorizador, la misma persona entra varias veces y ensucia los reportes. | M |
| 2 | **Asignación de leads** (a mano y por zona) + **reporte por agente** | Ya estaba en el Blueprint; desbloquea territorios y rendimiento por agente. | M+ |
| 3 | **Etiquetas y prioridad** (caliente / tibio / frío) en el lead, con filtro | Barato y muy pedido en cualquier CRM. | S |
| 4 | **Preguntas de Mercado Libre como leads** | Ya tenemos la cuenta conectada; es el canal que más usa una corredora chilena. | M+ |
| 5 | **Terminar H-068.4 y H-068.5** (sincronizar precio y estado; ver en qué portal está cada propiedad) | Sin esto, una vendida sigue publicada en el portal. | M + S |
| 6 | **Propiedades que calzan** en la ficha del lead (por operación, comuna, presupuesto y dormitorios) | Aprovecha datos que ya tenemos; ayuda al corredor a ofrecer rápido. | M |
| 7 | **Plantillas de WhatsApp** sin API: el botón abre WhatsApp con el mensaje armado (saludo, ficha de la propiedad, confirmación de visita) | Casi todo el valor del WhatsApp de PropCRM, sin costo por mensaje. | S |
| 8 | **Puerta de entrada de leads** (webhook firmado) para Make/Zapier, formularios externos y Meta | Abre todos los canales de una vez; encaja con H-034. | M |
| 9 | **Enlace de recorrido 360°** en la propiedad | Trivial y se ve bien en la ficha. | S |
| 10 | **Correos desde el CRM con plantillas**; seguimiento de aperturas después | Útil, pero WhatsApp pesa más en Chile. | M+ |

**No recomendado por ahora:** SMS, base de proyectos en verde, RR. HH. y contabilidad, WhatsApp con API oficial (esperar a tener corredoras pagando; tiene costo por conversación), AML (primero consulta legal).

**Sobre precios:** PropCRM cobra por usuario (USD 55–85, unos $50.000–80.000 por usuario al mes). Sirve como referencia para la definición de planes, que se hace en el proyecto de ventas.
