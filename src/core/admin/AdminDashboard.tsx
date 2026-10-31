import React, { useEffect, useState } from 'react';
import {
  X,
  LayoutDashboard,
  Building,
  Users,
  BarChart3,
  Zap,
  LogOut,
  Palette
} from 'lucide-react';
import { useLeadStore } from '../../modules/crm/stores/useLeadStore';
import { getLeadRepository } from '../../modules/crm/services/leadRepository';
import { usePropertyStore } from '../../modules/catalogo/stores/usePropertyStore';
import { agencyConfig } from '../config/agencyConfig';
import { LeadsTab } from '../../modules/crm/components/LeadsTab';
import { PropertiesTab } from '../../modules/catalogo/components/PropertiesTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { IntegrationsTab } from './tabs/IntegrationsTab';
import { BrandingTab } from './tabs/BrandingTab';
import { useAuthStore } from '../auth/useAuthStore';
import { LoginScreen, NewPasswordScreen, NoMembershipScreen } from '../auth/AuthScreens';
import { allowedTabs, safeTab, type AdminTab } from '../auth/permissions';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_LABEL = { admin: 'Administrador', agente: 'Agente' } as const;

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const { leads } = useLeadStore();
  const { properties } = usePropertyStore();
  const { status, email, membership, signOut } = useAuthStore();

  // Con sesión y corredora, los leads se leen de la base (privados: sin sesión no se piden)
  useEffect(() => {
    if (status === 'con_sesion') void useLeadStore.getState().load();
  }, [status]);

  const [requestedTab, setRequestedTab] = useState<AdminTab>('crm');
  const role = membership?.role ?? null;
  // Un rol sin permiso para la pestaña pedida vuelve a una pestaña permitida.
  const activeTab = safeTab(role, requestedTab);
  const visibleTabs = allowedTabs(role);

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">

      <div className="bg-white w-full max-w-7xl h-full sm:h-[92vh] sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">

        {/* Admin Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-urbe-accent/20 text-urbe-accent flex items-center justify-center font-bold select-none">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2">
                Panel Auto-Gestión & CRM
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400">
                {status === 'con_sesion' && membership
                  ? `${membership.tenantName} • ${ROLE_LABEL[membership.role]} • ${email}`
                  : `${agencyConfig.brandName} • ${agencyConfig.brokerName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(status === 'con_sesion' || status === 'sin_membresia') && (
              <button
                onClick={handleSignOut}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              aria-label="Cerrar panel"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {status === 'cargando' && (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500">Cargando…</div>
        )}
        {status === 'sin_sesion' && <LoginScreen />}
        {status === 'recuperando' && <NewPasswordScreen />}
        {status === 'sin_membresia' && <NoMembershipScreen email={email} />}

        {status === 'con_sesion' && (
          <>
            {/* Global Navigation Tabs (según el rol) */}
            <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex items-center gap-1.5 overflow-x-auto shrink-0 text-xs font-semibold">
              {visibleTabs.includes('crm') && (
                <button onClick={() => setRequestedTab('crm')} className={tabClass('crm')}>
                  <Users className="w-3.5 h-3.5" />
                  <span>Leads CRM ({leads.length})</span>
                </button>
              )}
              {visibleTabs.includes('properties') && (
                <button onClick={() => setRequestedTab('properties')} className={tabClass('properties')}>
                  <Building className="w-3.5 h-3.5" />
                  <span>Propiedades ({properties.length})</span>
                </button>
              )}
              {visibleTabs.includes('analytics') && (
                <button onClick={() => setRequestedTab('analytics')} className={tabClass('analytics')}>
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Métricas</span>
                </button>
              )}
              {visibleTabs.includes('settings') && (
                <button onClick={() => setRequestedTab('settings')} className={tabClass('settings')}>
                  <Zap className="w-3.5 h-3.5 text-urbe-accent" />
                  <span>Integraciones & IA</span>
                </button>
              )}
              {visibleTabs.includes('branding') && (
                <button onClick={() => setRequestedTab('branding')} className={tabClass('branding')}>
                  <Palette className="w-3.5 h-3.5" />
                  <span>Identidad & Marca</span>
                </button>
              )}
            </div>

            {activeTab === 'crm' && <LeadsTab />}
            {activeTab === 'properties' && <PropertiesTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'settings' && <IntegrationsTab />}
            {activeTab === 'branding' && <BrandingTab />}
          </>
        )}

      </div>
    </div>
  );
};
