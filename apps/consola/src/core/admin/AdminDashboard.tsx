import React, { useEffect, useState } from 'react';
import {
  X,
  LayoutDashboard,
  Building,
  Users,
  BarChart3,
  Zap,
  LogOut,
  Palette,
  Building2,
  Globe
} from 'lucide-react';
import { useLeadStore } from '../../modules/crm/stores/useLeadStore';
import { getLeadRepository } from '../../modules/crm/services/leadRepository';
import { usePropertyStore } from '../../modules/catalogo/stores/usePropertyStore';
import { agencyConfig } from '../config/agencyConfig';
import { LeadsTab } from '../../modules/crm/components/LeadsTab';
import { NewLeadNotice } from '../../modules/crm/components/NewLeadNotice';
import { PropertiesTab } from '../../modules/catalogo/components/PropertiesTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { IntegrationsTab } from './tabs/IntegrationsTab';
import { BrandingTab } from './tabs/BrandingTab';
import { TenantTab } from './tabs/TenantTab';
import { PlatformTab } from './tabs/PlatformTab';
import { isPlatformOwner } from '../auth/platformService';
import { useAuthStore } from '../auth/useAuthStore';
import { LoginScreen, NewPasswordScreen, NoMembershipScreen } from '../auth/AuthScreens';
import { allowedTabs, safeTab, type AdminTab } from '../auth/permissions';
import { useT, type MessageKey } from '../i18n/i18n';
import { useEntitlementsStore, useAccessMode, useCan } from '../platform/useEntitlementsStore';
import { AccessBanner } from './AccessBanner';
import { LanguageToggle } from '../ui/LanguageToggle';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  // En la consola de producción el panel es la aplicación entera: no hay a dónde volver, así que no se muestra "cerrar".
  canClose?: boolean;
}

const ROLE_LABEL: Record<'admin' | 'agente', MessageKey> = { admin: 'admin.role.admin', agente: 'admin.role.agente' };

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose, canClose = true }) => {
  const { leads } = useLeadStore();
  const { properties } = usePropertyStore();
  const { status, email, membership, signOut } = useAuthStore();
  const { t } = useT();

  // Con sesión y corredora, los leads se leen de la base (privados: sin sesión no se piden)
  useEffect(() => {
    if (status === 'con_sesion') void useLeadStore.getState().load();
    if (status === 'con_sesion') void useEntitlementsStore.getState().load();
  }, [status]);

  // El servidor confirma si quien entró es el dueño del producto; solo entonces aparece la pestaña Plataforma.
  const [owner, setOwner] = useState(false);
  useEffect(() => {
    if (status !== 'con_sesion') {
      setOwner(false);
      return;
    }
    let cancelled = false;
    isPlatformOwner().then((v) => {
      if (!cancelled) setOwner(v);
    });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const [requestedTab, setRequestedTab] = useState<AdminTab>('crm');
  const role = membership?.role ?? null;
  // Lo que ventas dispuso (ADR-009): el estado de la suscripción y las funciones del plan
  const mode = useAccessMode();
  const canBrand = useCan('branding.edit');
  const visibleTabs = allowedTabs(role, owner).filter((tab) => {
    if (tab === 'branding' && !canBrand) return false;
    // Cuenta cancelada: solo queda la descarga de datos (en Mi corredora) y, para el dueño, Plataforma
    if (mode === 'export_only') return tab === 'tenant' || tab === 'platform';
    return true;
  });
  // Una pestaña sin permiso (por rol, plan o estado) vuelve a la primera permitida.
  const activeTab: AdminTab = visibleTabs.includes(requestedTab) ? requestedTab : (visibleTabs[0] ?? safeTab(role, 'crm', owner));

  if (!isOpen) return null;

  const handleSignOut = async () => {
    await signOut();
    // Con Supabase los leads son privados: no deben quedar en memoria al cerrar sesión
    if (getLeadRepository().mode === 'remote') useLeadStore.setState({ leads: [] });
    setRequestedTab('crm');
    onClose();
  };

  const tabClass = (tab: AdminTab) =>
    `px-3 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
      activeTab === tab ? 'bg-urbe-primary text-white shadow font-bold' : 'text-slate-400 hover:text-white'
    }`;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-200">

      <div className="bg-white w-full h-full flex flex-col overflow-hidden">

        {/* Admin Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-urbe-accent/20 text-urbe-accent flex items-center justify-center font-bold select-none">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2">
                {t('admin.title')}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400">
                {status === 'con_sesion' && membership
                  ? `${membership.tenantName} • ${t(ROLE_LABEL[membership.role])} • ${email}`
                  : `${agencyConfig.brandName} • ${agencyConfig.brokerName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle tone="dark" />
            {(status === 'con_sesion' || status === 'sin_membresia') && (
              <button
                onClick={handleSignOut}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                title={t('admin.signOut.title')}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('admin.signOut')}</span>
              </button>
            )}

            {canClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                aria-label={t('admin.close')}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>

        {status === 'cargando' && (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500">{t('admin.loading')}</div>
        )}
        {status === 'sin_sesion' && <LoginScreen />}
        {status === 'recuperando' && <NewPasswordScreen />}
        {status === 'sin_membresia' && <NoMembershipScreen email={email} />}

        {status === 'con_sesion' && (
          <>
            {/* Cada lead nuevo se avisa al instante mientras el panel está abierto (H-054) */}
            <NewLeadNotice active={visibleTabs.includes('crm')} onOpenCrm={() => setRequestedTab('crm')} />
            {/* Global Navigation Tabs (según el rol) */}
            <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex items-center gap-1.5 overflow-x-auto shrink-0 text-xs font-semibold">
              {visibleTabs.includes('crm') && (
                <button onClick={() => setRequestedTab('crm')} className={tabClass('crm')}>
                  <Users className="w-3.5 h-3.5" />
                  <span>{t('admin.tab.crm', { count: leads.length })}</span>
                </button>
              )}
              {visibleTabs.includes('properties') && (
                <button onClick={() => setRequestedTab('properties')} className={tabClass('properties')}>
                  <Building className="w-3.5 h-3.5" />
                  <span>{t('admin.tab.properties', { count: properties.length })}</span>
                </button>
              )}
              {visibleTabs.includes('analytics') && (
                <button onClick={() => setRequestedTab('analytics')} className={tabClass('analytics')}>
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>{t('admin.tab.analytics')}</span>
                </button>
              )}
              {visibleTabs.includes('tenant') && (
                <button onClick={() => setRequestedTab('tenant')} className={tabClass('tenant')}>
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{t('admin.tab.tenant')}</span>
                </button>
              )}
              {visibleTabs.includes('settings') && (
                <button onClick={() => setRequestedTab('settings')} className={tabClass('settings')}>
                  <Zap className="w-3.5 h-3.5 text-urbe-accent" />
                  <span>{t('admin.tab.settings')}</span>
                </button>
              )}
              {visibleTabs.includes('branding') && (
                <button onClick={() => setRequestedTab('branding')} className={tabClass('branding')}>
                  <Palette className="w-3.5 h-3.5" />
                  <span>{t('admin.tab.branding')}</span>
                </button>
              )}
              {visibleTabs.includes('platform') && (
                <button onClick={() => setRequestedTab('platform')} className={tabClass('platform')}>
                  <Globe className="w-3.5 h-3.5" />
                  <span>{t('admin.tab.platform')}</span>
                </button>
              )}
            </div>

            <AccessBanner />

            {/* En solo lectura se ven los datos pero ningún botón ni campo cambia nada. "Mi corredora" lo resuelve por dentro
                para dejar activa la descarga de datos. */}
            {activeTab === 'tenant' && visibleTabs.includes('tenant') && <TenantTab />}
            {activeTab !== 'tenant' && visibleTabs.length > 0 && (
              <fieldset disabled={mode === 'read_only'} className="flex-1 flex flex-col min-h-0 min-w-0 border-0 p-0 m-0">
                {activeTab === 'crm' && <LeadsTab />}
                {activeTab === 'properties' && <PropertiesTab />}
                {activeTab === 'analytics' && <AnalyticsTab />}
                {activeTab === 'settings' && <IntegrationsTab />}
                {activeTab === 'branding' && <BrandingTab />}
                {activeTab === 'platform' && <PlatformTab />}
              </fieldset>
            )}
          </>
        )}

      </div>
    </div>
  );
};
