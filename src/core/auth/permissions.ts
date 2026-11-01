export type Role = 'admin' | 'agente';
export type AdminTab = 'crm' | 'properties' | 'analytics' | 'settings' | 'branding';

const ALL_TABS: AdminTab[] = ['crm', 'properties', 'analytics', 'settings', 'branding'];
const TABS_BY_ROLE: Record<Role, AdminTab[]> = {
  admin: ALL_TABS,
  agente: ['crm', 'properties', 'analytics'],
};

export const allowedTabs = (role: Role | null): AdminTab[] => (role ? TABS_BY_ROLE[role] : []);

export const canOpenTab = (role: Role | null, tab: AdminTab): boolean => allowedTabs(role).includes(tab);

// Si la pestaña pedida no está permitida para el rol, devuelve la primera permitida.
export const safeTab = (role: Role | null, tab: AdminTab): AdminTab =>
  canOpenTab(role, tab) ? tab : (allowedTabs(role)[0] ?? 'crm');

// Solo el administrador invita agentes a su corredora.
export const canInviteAgents = (role: Role | null): boolean => role === 'admin';

// Solo el administrador se lleva una copia de los datos de su corredora.
export const canExportData = (role: Role | null): boolean => role === 'admin';
