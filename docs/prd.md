# PRD: Portal Inmobiliario IA (reconstruido desde el código)

Versión: 0.1 · Reconstruido desde el código el 2026-10-30 · Visión objetivo: `BLUEPRINT Inmobiliario.md` · Brief: docs/brief.md

> Describe lo que la aplicación **hace hoy**. Lo que falta para llegar al blueprint está en docs/backlog.md.

## Objetivos y no-objetivos
**Objetivos hoy:** que una corredora retenga el tráfico de sus propiedades en un sitio propio, capte contactos con ayuda de un asistente de IA y gestione esos contactos en un CRM sencillo.
**No-objetivos hoy:** multi-corredora (tenants), cuentas y roles reales, cobros, contratos y gestión de arriendos, portales y WhatsApp.

## Usuarios y roles
| Rol | Puede | No puede |
| --- | --- | --- |
| Visitante (comprador/arrendatario) | Ver catálogo y fichas, filtrar, simular dividendo, chatear con el asistente, dejar datos y agendar visita | Ver el panel interno |
| Propietario (visitante) | Pedir una tasación y dejar datos de su propiedad (captación de oferta) | — |
| Corredora / administrador | Gestionar leads, propiedades, UF, integraciones y marca desde el panel | Hoy **no hay autenticación**: el panel solo está disponible en desarrollo o con `VITE_ENABLE_ADMIN=true` |
| Agencia (modo demo) | Ver la pestaña de Identidad y Marca (`?agency=true`) | Es un acceso de demostración, no un rol real |

## Flujos principales
1. **Explorar catálogo:** filtros por operación, comuna, tipo, precio y dormitorios; ficha con mapa; alternancia UF/CLP.
2. **Consultar al asistente:** el chat responde con un motor local de reglas o con un LLM vía `/api/chat`; recomienda propiedades y propone agendar.
3. **Captar un lead:** el chat, la ficha, el formulario de contacto o el valorizador crean un lead que queda en el CRM y se reenvía al webhook (`/api/lead-webhook`).
4. **Tasar propiedad (oferta):** formulario de 4 pasos con adjuntos para propietarios.
5. **Agendar visita:** modal que lleva a Cal.com/Calendly.
6. **Gestionar leads:** tablero Kanban y tabla con filtros, notas, estados, adjuntos y exportación CSV.
7. **Gestionar propiedades:** alta, edición y borrado con carga de imágenes y video.
8. **Ver métricas:** leads por origen y propiedades por tipo.
9. **Configurar:** UF, enlace de agenda, motor de IA y marca (colores, textos, secciones visibles).

## Requisitos funcionales (estado actual)
| ID | Requisito | Prioridad (M/S/C/W) | Estado | Historias |
| --- | --- | --- | --- | --- |
| RF-01 | Catálogo con filtros y fichas | M | Existe | — |
| RF-02 | Asistente de IA con motor local y LLM por servidor | M | Existe | — |
| RF-03 | Captura de leads desde varios puntos con origen | M | Existe (sin UTM ni consentimiento) | H-012 |
| RF-04 | CRM de leads (Kanban, tabla, notas, estados) | M | Existe (sin tareas, visitas ni asignación) | H-009 |
| RF-05 | Gestión de propiedades | M | Existe (solo en el navegador) | H-008 |
| RF-06 | Envío de leads a un webhook externo | S | Existe (requiere variable de servidor) | — |
| RF-07 | Autenticación y roles | M | **No existe** | H-006, H-008 |
| RF-08 | Multi-tenancy | M | **No existe** | H-008 |
| RF-09 | Textos traducibles y paquete de mercado | S | **No existe** | H-010, H-011 |
| RF-10 | Widget embebible y API pública | M | **No existe** | por detallar |

## Requisitos no funcionales
| Atributo | Objetivo | Cómo se verifica |
| --- | --- | --- |
| Peso del bundle | medido hoy: 421 kB (125 kB gzip) JS; objetivo a definir en G5 | `npm run build` |
| Web LCP / INP / CLS | por medir (línea base pendiente) | Lighthouse |
| Disponibilidad, latencia API, concurrencia, costo mensual | por definir al acercarse al despliegue | — |
| Accesibilidad | WCAG 2.2 AA (objetivo, no medido) | axe-core |
| Móvil primero | pantallas diseñadas para móvil y expandidas a escritorio | Revisión manual |
| Retención de datos | por definir con la Ley 21.719 | Revisión legal |

## Modelo de datos (hoy, en el navegador)
- **Lead:** id, nombre, correo, teléfono, interés de operación, presupuesto y moneda, estado (nuevo → cerrado/descartado), origen, notas, adjuntos, cita, propiedad de interés, fecha.
- **Property:** id, título, operación (venta/arriendo), tipo, precio en UF, comuna, dirección, dormitorios, baños, superficies, estacionamientos, imágenes, video, descripción, características, estado.
- **Marca/Layout:** nombre, corredor, contacto, colores y secciones visibles.
- Sin `tenant_id`, sin relaciones persistentes ni usuarios.
