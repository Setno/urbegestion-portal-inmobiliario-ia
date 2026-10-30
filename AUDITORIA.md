# AUDITORÍA – `landing-ventas` frente al Blueprint (30-oct-2026)

Auditoría de solo lectura. No se modificó código ni se instalaron dependencias. No existe `.env` en la carpeta; solo `.env.example` (versionado, sin secretos reales, solo claves vacías de Instagram).

## 1. Qué es hoy el proyecto

Una **SPA de demostración para una sola corredora (UrbeGestión / Pilar Osorio)**: landing + catálogo + asistente de IA + panel admin con CRM Kanban. Es un prototipo de venta ("pitch de agencia"), **no una plataforma SaaS**.

- **Stack:** React 18 + TypeScript + Vite 6 + Tailwind 3 + Zustand + Framer Motion + Recharts. Despliegue en Vercel (`vercel.json` con cabeceras básicas y rewrite SPA).
- **Sin backend, sin base de datos, sin API propia.** Todo vive en el navegador (`localStorage`/`sessionStorage`).
- ~10.000 líneas. Sin pruebas automáticas, sin CI, sin i18n.
- Dos puntos de entrada: `main.tsx` → `App.tsx` (sitio completo) y `main-02.tsx`/`index-02.html` → `ZenithApp.tsx` (variante de demo alternativa).
- `maestro.md` es un blueprint anterior (white-label para replicar el sitio por cliente); queda **superado** por el nuevo Blueprint (multi-tenant).

## 2. Mapa de componentes y decisión

| Pieza | Qué hace | Decisión | Módulo destino |
|---|---|---|---|
| `AdminDashboard.tsx` (2.284 líneas, 5 pestañas) | CRM Kanban/tabla, propiedades, analítica, ajustes, branding | **Adaptar** (partir en piezas; es un archivo monolítico) | CRM + consola admin |
| `types/lead.ts`, `useLeadStore` | Modelo de lead, estados, fuentes | **Adaptar** (sin `tenant_id`, sin demanda/oferta formal, sin consentimiento, `source` limitado) | Captación → CRM |
| `types/property.ts`, `usePropertyStore`, `PropertyCard/Grid/Modal` | Catálogo y fichas | **Adaptar** (UI reutilizable; datos a API/BD con `tenant_id`) | Catálogo + widget |
| `SearchFilterBar`, `chileanLocations.ts` | Filtros y comunas RM | **Adaptar** (comunas → paquete de mercado Chile) | Widget / mercado CL |
| `AiChatWidget`, `aiService.ts`, `useChatStore` | Chat con motor de reglas local + LLM opcional | **Adaptar** (llamada al LLM debe pasar por backend) | Captación |
| `OwnerValuation.tsx` (614 l.) | "¿Cuánto vale mi propiedad?" para captar propietarios | **Reutilizar la idea / adaptar** | Captación v2 (lead de oferta) |
| `MortgageCalc.tsx` | Simulador hipotecario UF/CLP | **Adaptar** (tasas y UF a paquete de mercado) | Widget |
| `CalBookingModal`, `webhookService.ts` | Agenda Cal.com y webhook GoHighLevel | **Adaptar** (webhook configurable por tenant, firmado) | Captación / CRM (visitas) |
| `Instagram*`, `instagramService.ts` | Feed de Instagram | **Descartar del core** (marketing de sitio) | Sitio propio v2 |
| `HeroSection`, `Navbar`, `Footer`, `About`, `Testimonials`, `MobileQuickBar`, `AgencyPitchBanner` | Landing de una corredora | **Descartar / mover a plantilla de sitio** | Sitio con plantillas (v2) |
| `Zenith*` + `ZenithApp` + `main-02` | Demo alternativa | **Descartar** (duplicado) | — |
| `agencyConfig.ts`, `useBrandStore` | Marca, contacto, mercado, IA hardcodeados | **Adaptar**: pasa a configuración por tenant en BD | Core |
| `AdminLoginModal.tsx` | Login del admin | **Descartar** (ver riesgos) | Core (auth real) |
| `index.css`, Tailwind, tokens de color | Sistema visual | **Reutilizar** como base de design system (renombrar `urbe-*`) | Transversal |

## 3. Riesgos de seguridad (críticos primero)

1. **Autenticación falsa (crítico).** El login acepta cualquier usuario que *contenga* "admin" o "urbe" con contraseñas fijas (`admin`, `1234`, `urbe2026`…) y está hardcodeado en el bundle; el "login" es un flag en `sessionStorage` (`urbe_admin_authenticated`) que cualquiera activa desde la consola. Además hay un "atajo secreto" en el candado que entra sin credenciales. Hoy **el panel admin no está protegido en absoluto**.
2. **Todos los datos de clientes en `localStorage`** (leads con nombre, correo, teléfono, presupuesto): sin cifrado, sin aislamiento, sin auditoría, se pierden al limpiar el navegador. Incumple el Blueprint §10 y la Ley 21.719.
3. **API key de LLM en el navegador** (`urbe_ai_apikey` en `localStorage` o `VITE_OPENAI_API_KEY` en el bundle) y llamada directa desde el cliente: cualquier `VITE_*` queda público. Debe moverse a un backend.
4. **Webhook de GoHighLevel** guardado y disparado desde el navegador (URL expuesta, sin firma, sin reintentos).
5. **Sin consentimiento** de datos personales en formularios, ni registro de finalidad.
6. Cabeceras de `vercel.json` mínimas (falta CSP y HSTS); los commits recientes ya endurecieron `.gitignore` y límites de subida. Valores de adjuntos en Base64 dentro de `localStorage` (riesgo de cuota y de contenido).
7. No se detectaron secretos versionados: `.env` ausente y `.gitignore` lo excluye. (No se ejecutó `npm audit` para no instalar nada; queda pendiente.)

## 4. Brecha contra las reglas del Blueprint

| Regla / requisito | Estado actual |
|---|---|
| Sin lógica específica de país en módulos | ❌ UF, comunas RM, SII/Chile y nombres "urbe" mezclados en el código |
| Sin texto visible en el código (i18n) | ❌ Todo en español dentro de los componentes; 0 archivos de traducción |
| `tenant_id` en cada registro + RLS | ❌ No existe concepto de tenant |
| BD y esquema por módulo, eventos (`lead.created`) | ❌ No hay BD ni eventos |
| Montos con moneda explícita | ⚠️ Parcial (`budgetCurrency`, `defaultCurrency`); propiedades no verificadas a fondo |
| Móvil primero | ✅ Buen punto de partida (Tailwind responsivo, `MobileQuickBar`); falta PWA |
| API documentada, UI sin acceso directo a BD | ❌ UI lee/escribe directo en `localStorage` |
| Roles (admin, jefe, agente, subagente) | ❌ Un único rol "admin" simulado |
| Widget embebible / API pública / WhatsApp / portales | ❌ Solo botón de WhatsApp y webhook GHL; no hay widget |
| Atribución (UTM, fuente, propiedad) | ⚠️ Existe `source` y propiedad de interés; sin UTM |
| Pruebas / CI / entornos | ❌ Ninguno |

## 5. Qué ya sirve y qué falta

**Ya tenemos (valor reutilizable):** UX del catálogo y fichas, CRM Kanban (como prototipo de interfaz), modelo de lead inicial, asistente conversacional con calificación, calculadora hipotecaria, valorizador de propietarios (captación de oferta), sistema visual y base responsiva, textos comerciales (propuesta y guía de ventas).

**Falta por construir (resumen):** backend y BD (PostgreSQL), autenticación real con roles, multi-tenancy con RLS, Core (planes, módulos, auditoría, consentimientos), capa de eventos/outbox, API OpenAPI, i18n, paquetes de mercado, widget embebible, WhatsApp Business, ingesta de portales, agenda y tareas del CRM, reportes, PWA con push.

## 6. Qué se modifica y cómo empezar (propuesta)

**Decisión previa necesaria** (Blueprint §16): confirmar SaaS multi-tenant, monolito modular y stack TypeScript + PostgreSQL. Con eso:

**Paso 0 – Higiene inmediata (sin esperar decisiones, bajo riesgo)**
1. Eliminar el login falso y el atajo secreto; mientras no exista backend, ocultar el panel admin en producción.
2. Mover la API key del LLM y el webhook fuera del cliente (aunque sea un endpoint serverless de Vercel provisorio).
3. Borrar o archivar `Zenith*`/`main-02`/`index-02.html` y `maestro.md` (queda en git).

**Paso 1 – Reestructurar el repositorio**
- Convertir en monorepo: `apps/web` (consola + widget), `apps/api` (monolito modular), `packages/ui`, `packages/i18n`, `packages/markets/cl`.
- Partir `AdminDashboard.tsx` por pestañas/features y desacoplarlo de `localStorage` detrás de una capa de acceso a API.

**Paso 2 – Core**
- Esquemas `core` (tenants, usuarios, roles, planes, auditoría, consentimientos), auth OIDC, RLS por `tenant_id`.

**Paso 3 – i18n y paquete Chile**
- Extraer todos los textos a es-419/en; mover UF, comunas, RUT, Ley 21.719 al paquete `markets/cl`.

**Paso 4 – Captación + CRM (MVP del Blueprint)**
- Esquema `captacion` (leads demanda/oferta, UTM, consentimiento) → evento `lead.created` → esquema `crm` (contactos, pipelines, tareas, visitas, asignación).
- Widget embebible a partir de buscador + ficha + formulario + WhatsApp.

## 7. Pendientes de la auditoría

- Ejecutar `npm audit`/`tsc` (requiere instalar o confirmar que `node_modules` está al día).
- Revisar a fondo `PropertyModal`, `OwnerValuation` y `InstagramPostModal` (archivos grandes) línea por línea.
- Medir peso real del bundle y rendimiento móvil (Lighthouse) con la carpeta `dist` actual (1 MB).
- Decidir las 11 preguntas abiertas del Blueprint §16.
