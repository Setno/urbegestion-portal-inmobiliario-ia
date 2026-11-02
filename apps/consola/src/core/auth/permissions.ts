export type Role = 'admin' | 'agente';
export type AdminTab = 'crm' | 'properties' | 'analytics' | 'tenant' | 'settings' | 'branding' | 'platform';

// Agente: su trabajo diario. Administrador: además lo de su corredora (equipo, zonas, publicación, datos), integraciones y marca.
// Dueño del producto (lo confirma el servidor, no depende del rol): además la pestaña Plataforma.
const TABS_BY_ROLE: Record<Role, AdminTab[]> = {
  admin: ['crm', 'properties', 'analytics', 'tenant', 'settings', 'branding'],
  agente: ['crm', 'properties', 'analytics'],
};

export const allowedTabs = (role: Role | null, isPlatformOwner = false): AdminTab[] =>
  role ? [...TABS_BY_ROLE[role], ...(isPlatformOwner ? (['platform'] as AdminTab[]) : [])] : [];

export const canOpenTab = (role: Role | null, tab: AdminTab, isPlatformOwner = false): boolean =>
  allowedTabs(role, isPlatformOwner).includes(tab);

// Si la pestaña pedida no está permitida para el rol, devuelve la primera permitida.
export const safeTab = (role: Role | null, tab: AdminTab, isPlatformOwner = false): AdminTab =>
  canOpenTab(role, tab, isPlatformOwner) ? tab : (allowedTabs(role, isPlatformOwner)[0] ?? 'crm');

// Solo el administrador invita agentes a su corredora.
export const canInviteAgents = (role: Role | null): boolean => role === 'admin';

// Solo el administrador se lleva una copia de los datos de su corredora.
export const canExportData = (role: Role | null): boolean => role === 'admin';

// Solo el administrador decide en qué zonas trabaja su corredora.
export const canEditServiceAreas = (role: Role | null): boolean => role === 'admin';
