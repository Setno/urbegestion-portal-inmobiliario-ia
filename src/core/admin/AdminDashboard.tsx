import React, { useState } from 'react';
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
import { usePropertyStore } from '../../modules/catalogo/stores/usePropertyStore';
import { agencyConfig } from '../config/agencyConfig';
import { LeadsTab } from '../../modules/crm/components/LeadsTab';
import { PropertiesTab } from '../../modules/catalogo/components/PropertiesTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { IntegrationsTab } from './tabs/IntegrationsTab';
import { BrandingTab } from './tabs/BrandingTab';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const { leads } = useLeadStore();
  const { properties } = usePropertyStore();

  const [activeTab, setActiveTab] = useState<'crm' | 'properties' | 'analytics' | 'settings' | 'branding'>('crm');

  // Secret SuperAdmin / Agency Master Mode (Hidden from client/broker by default)
  const [isMasterAgencyMode, setIsMasterAgencyMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('agency') === 'true' || sessionStorage.getItem('urbe_agency_master') === 'true';
  });

  const [secretClicks, setSecretClicks] = useState(0);

  const handleSecretIconClick = () => {
    const next = secretClicks + 1;
    setSecretClicks(next);
    if (next >= 3) {
      const pin = window.prompt('🔒 Ingrese Código Maestro de Agencia / Desarrollador:');
      if (pin === 'master' || pin === 'agency2026' || pin === 'admin' || pin === '1234') {
        setIsMasterAgencyMode(true);
        sessionStorage.setItem('urbe_agency_master', 'true');
        setActiveTab('branding');
        alert('✨ Modo Master de Agencia Activado. Pestaña de Marca desbloqueada.');
      } else if (pin !== null) {
        alert('Código incorrecto.');
      }
      setSecretClicks(0);
    }
  };

  const handleExitMasterMode = () => {
    setIsMasterAgencyMode(false);
    sessionStorage.removeItem('urbe_agency_master');
    if (activeTab === 'branding') setActiveTab('crm');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      
      <div className="bg-white w-full max-w-7xl h-full sm:h-[92vh] sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Admin Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div 
              onClick={handleSecretIconClick}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-urbe-accent/20 text-urbe-accent flex items-center justify-center font-bold cursor-pointer select-none hover:bg-urbe-accent/30 transition-colors"
              title="Panel Inmobiliario (Triple clic para herramientas avanzadas)"
            >
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2">
                Panel Auto-Gestión & CRM
                <span className="text-[10px] sm:text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  En Vivo
                </span>
                {isMasterAgencyMode && (
                  <span className="text-[9px] sm:text-[10px] bg-amber-500/25 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                    Modo Consultor / Agencia
                  </span>
                )}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400">
                {agencyConfig.brandName} • {agencyConfig.brokerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMasterAgencyMode && (
              <button
                type="button"
                onClick={handleExitMasterMode}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1.5 transition-colors"
                title="Ocultar herramientas de agencia antes de mostrar al cliente"
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ocultar Modo Agencia</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
              title="Cerrar sesión de Administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              aria-label="Cerrar CRM"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex items-center gap-1.5 overflow-x-auto shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('crm')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'crm' ? 'bg-urbe-primary text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Leads CRM ({leads.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'properties' ? 'bg-urbe-primary text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Propiedades ({properties.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'analytics' ? 'bg-urbe-primary text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Métricas</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'settings' ? 'bg-urbe-primary text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-urbe-accent" />
            <span>Integraciones & IA</span>
          </button>
          {isMasterAgencyMode && (
            <button
              onClick={() => setActiveTab('branding')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'branding' ? 'bg-urbe-accent text-slate-950 shadow font-black' : 'text-amber-400 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Identidad & Marca (Agencia)</span>
            </button>
          )}
        </div>

        {activeTab === 'crm' && <LeadsTab />}
        {activeTab === 'properties' && <PropertiesTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'settings' && <IntegrationsTab />}
        {activeTab === 'branding' && <BrandingTab />}

      </div>
    </div>
  );
};
