import React from 'react';
import { useT } from '../../i18n/i18n';
import { TeamSection } from './TeamSection';
import { ServiceAreasSection } from './ServiceAreasSection';
import { PublicationModeSection } from './PublicationModeSection';
import { DataExportSection } from './DataExportSection';

// Lo que el administrador decide sobre su corredora. Cada sección decide por sí misma si se muestra según el rol.
export const TenantTab: React.FC = () => {
  const { t } = useT();
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
      <div>
        <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">{t('tenant.title')}</h3>
        <p className="text-[11px] sm:text-xs text-slate-500">{t('tenant.help')}</p>
      </div>
      <TeamSection />
      <ServiceAreasSection />
      <PublicationModeSection />
      <DataExportSection />
    </div>
  );
};
