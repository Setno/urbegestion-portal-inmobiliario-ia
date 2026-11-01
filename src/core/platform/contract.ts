// Contrato entre el SaaS y el proyecto de ventas (ADR-009). Este archivo es el catálogo único de variables.
// Para agregar una variable: escribirla aquí con su valor por defecto, agregarla a docs/adr/009 y usarla con can()/limitOf().
// Nunca se renombra ni se reutiliza una clave; una clave que ya no sirve se marca `obsolete` y se sigue aceptando.

export const CONTRACT_VERSION = 1;

interface FeatureDef {
  default: boolean;
  description: string;
  obsolete?: boolean;
}

interface LimitDef {
  // null = sin límite
  default: number | null;
  description: string;
  obsolete?: boolean;
}

// Mientras no haya ventas conectadas, el producto funciona completo: por eso todo parte prendido y sin límites.
export const FEATURES = {
  'site.enabled': { default: true, description: 'Sitio web propio de la corredora (plan Completo)' },
  'site.custom_domain': { default: true, description: 'Dominio propio para el sitio' },
  'ai.chat': { default: true, description: 'Asistente de chat en el sitio' },
  'ai.llm_server': { default: true, description: 'Respuestas del asistente con un modelo de lenguaje en el servidor' },
  'crm.export': { default: true, description: 'Descarga de propiedades, contactos y notas' },
  'valuation.owner_form': { default: true, description: 'Formulario de tasación para propietarios' },
  'publication.approval_flow': { default: true, description: 'Flujo de borrador, revisión y aprobación de publicaciones' },
  'branding.edit': { default: true, description: 'Edición de la identidad y la marca' },
  'widget.embed': { default: true, description: 'Widget embebible para el sitio actual de la corredora (plan Solo herramientas)' },
} as const satisfies Record<string, FeatureDef>;

export const LIMITS = {
  'limit.agents': { default: null, description: 'Agentes de la corredora' },
  'limit.properties_published': { default: null, description: 'Propiedades publicadas a la vez' },
  'limit.leads_per_month': { default: null, description: 'Leads nuevos por mes' },
  'limit.ai_messages_per_month': { default: null, description: 'Mensajes del asistente de IA por mes' },
  'limit.storage_mb': { default: null, description: 'Archivos e imágenes guardados, en MB' },
} as const satisfies Record<string, LimitDef>;

export type FeatureKey = keyof typeof FEATURES;
export type LimitKey = keyof typeof LIMITS;

export const SUBSCRIPTION_STATUSES = ['trial', 'active', 'past_due', 'suspended', 'cancelled'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export interface TenantEntitlements {
  contractVersion: number;
  planCode: string | null;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  graceEndsAt: string | null;
  // Solo las claves que ventas envió; las demás valen su valor por defecto
  features: Record<string, boolean>;
  limits: Record<string, number | null>;
  updatedAt: string | null;
}

export const DEFAULT_ENTITLEMENTS: TenantEntitlements = {
  contractVersion: CONTRACT_VERSION,
  planCode: null,
  status: 'active',
  trialEndsAt: null,
  graceEndsAt: null,
  features: {},
  limits: {},
  updatedAt: null,
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const asDate = (v: unknown): string | null => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : null);

// Lee lo que envía ventas con tolerancia: ignora claves desconocidas y valores de tipo incorrecto, y ante un dato ilegible
// deja el valor por defecto en vez de bloquear a la corredora (un error de ventas no debe dejar a nadie sin servicio).
export function parseEntitlements(raw: unknown): TenantEntitlements {
  if (!isRecord(raw)) return { ...DEFAULT_ENTITLEMENTS };

  const features: Record<string, boolean> = {};
  if (isRecord(raw.features)) {
    for (const [key, value] of Object.entries(raw.features)) if (typeof value === 'boolean') features[key] = value;
  }

  const limits: Record<string, number | null> = {};
  if (isRecord(raw.limits)) {
    for (const [key, value] of Object.entries(raw.limits)) {
      if (value === null) limits[key] = null;
      else if (typeof value === 'number' && Number.isFinite(value) && value >= 0) limits[key] = Math.floor(value);
    }
  }

  const status = SUBSCRIPTION_STATUSES.find((s) => s === raw.status) ?? DEFAULT_ENTITLEMENTS.status;

  return {
    contractVersion: typeof raw.contractVersion === 'number' ? raw.contractVersion : CONTRACT_VERSION,
    planCode: typeof raw.planCode === 'string' && raw.planCode ? raw.planCode : null,
    status,
    trialEndsAt: asDate(raw.trialEndsAt),
    graceEndsAt: asDate(raw.graceEndsAt),
    features,
    limits,
    updatedAt: asDate(raw.updatedAt),
  };
}

// ¿Tiene la corredora esta función? Si ventas no la mencionó, vale el valor por defecto del catálogo.
export function can(entitlements: TenantEntitlements, key: FeatureKey): boolean {
  return entitlements.features[key] ?? FEATURES[key].default;
}

// Cupo de la corredora para este recurso; null = sin límite.
export function limitOf(entitlements: TenantEntitlements, key: LimitKey): number | null {
  return key in entitlements.limits ? entitlements.limits[key] : LIMITS[key].default;
}

// ¿Se puede agregar uno más con el uso actual?
export function hasRoom(entitlements: TenantEntitlements, key: LimitKey, used: number): boolean {
  const max = limitOf(entitlements, key);
  return max === null || used < max;
}

// Qué puede hacer la corredora según el estado de su suscripción (ADR-009):
// full: todo · notice: todo, con aviso en el panel · read_only: ve pero no cambia · export_only: solo descarga sus datos.
export type AccessMode = 'full' | 'notice' | 'read_only' | 'export_only';

export function accessMode(entitlements: TenantEntitlements, now: Date = new Date()): AccessMode {
  switch (entitlements.status) {
    case 'trial':
    case 'active':
      return 'full';
    case 'past_due': {
      // Pasado el plazo de gracia se trata como suspendida
      const grace = entitlements.graceEndsAt ? Date.parse(entitlements.graceEndsAt) : NaN;
      return Number.isNaN(grace) || now.getTime() <= grace ? 'notice' : 'read_only';
    }
    case 'suspended':
      return 'read_only';
    case 'cancelled':
      return 'export_only';
  }
}
