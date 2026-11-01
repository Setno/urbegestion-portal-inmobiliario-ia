# Estructura del código (vigente desde el Paso 1)

Todo el código vive en `src/`. Cada carpeta corresponde a una pieza del Blueprint.

| Carpeta | Qué contiene | Equivale en el Blueprint |
|---|---|---|
| `src/core/` | Configuración y marca (`config/`, `brand/`), persistencia (`storage/`) y la consola de administración (`admin/`) con sus pestañas de Métricas, Integraciones y Marca | Core (identidad, planes, ajustes) |
| `src/modules/captacion/` | Chat con IA, valorizador de propietarios, agenda de visitas, servicios de IA y de envío de leads (webhook) | Módulo 1 – Captación |
| `src/modules/crm/` | Pestaña de Leads (Kanban y tabla), tienda y tipos de leads | Módulo 2 – CRM |
| `src/modules/catalogo/` | Propiedades: fichas, grilla, filtros, calculadora hipotecaria, pestaña de Propiedades, tienda, tipos y datos de ejemplo | Catálogo de propiedades (Core) |
| `src/markets/` | Interfaz `MarketPack`, registro de paquetes y ayudas de zonas (ADR-008) | Paquetes de mercado |
| `src/core/platform/` | Contrato con el proyecto de ventas: catálogo de funciones y cupos, `can()`/`limitOf()`, estado de la suscripción (ADR-009) | Plataforma |
| `src/markets/cl/` | Datos específicos de Chile (16 regiones, 346 comunas, alias y sectores) | Paquete de mercado Chile |
| `src/core/market/` | Mercado y zonas de trabajo de la corredora (tienda y servicio) | Core |
| `src/core/money/` | Dinero con su moneda: formato, conversión y comparación según el paquete de mercado | Core |
| `src/core/i18n/` | Textos de la interfaz por idioma (`messages.es.ts`, `messages.en.ts`), `t()` y plural | Core |
| `src/site/` | Landing de la corredora: portada, menú, secciones (la sección de Instagram está archivada, H-014). Será la semilla de la plantilla 1 del sitio con plantillas (ADR-005); el sitio público pasará a Next.js (ADR-006) | Sitio propio con plantillas (producto base) |
| `src/App.tsx`, `src/main.tsx` | Arranque de la aplicación | — |

Dentro de cada módulo: `components/`, `stores/`, `types/`, `services/`, `data/`.

## Persistencia
Las tiendas de leads, propiedades y marca guardan a través de `src/core/storage/localStore.ts`. Hoy usa el navegador; al incorporar Supabase se reemplaza ese único punto.

## Acoplamientos conocidos (a resolver con Supabase)
Hoy los módulos se importan entre sí por simplicidad del prototipo, contra la regla del Blueprint (§0: comunicarse solo por eventos e identificadores):

- Captación usa la tienda y los tipos de CRM (crea leads) y el catálogo (para recomendar).
- CRM usa el servicio de envío de leads de Captación y el catálogo.
- Catálogo abre el modal de agenda y el chat de Captación, y crea leads vía CRM.

Se separan al implementar el evento `lead.created` y la API por módulo.

## Pendientes de seguridad heredados
- El "Modo Master / Agencia" (PIN fijo y `?agency=true`) se retiró (H-006): el acceso al panel es por login de Supabase con roles `admin` y `agente` (`src/core/auth/`). La pestaña de Identidad y Marca es solo del administrador.
- **Acceso a datos (H-009):** `src/core/data/` define el contrato `Repository` (`repository.ts`), la elección entre navegador y Supabase (`dataSource.ts`, según `VITE_TENANT_ID`) y un cliente de Supabase simulado para pruebas (`fakeSupabase.ts`). Cada módulo tiene su repositorio: `src/modules/catalogo/services/propertyRepository.ts` y `src/modules/crm/services/leadRepository.ts`; las tiendas Zustand llaman al repositorio y no saben dónde se guarda. Las tablas `properties` y `leads` (con `tenant_id` y RLS) están en `supabase/migrations/`; datos de ejemplo en `supabase/seed-dev-catalogo.sql`; prueba de seguridad en `supabase/tests/rls_catalogo_crm.sql`.
