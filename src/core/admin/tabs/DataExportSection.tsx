import React from 'react';
import { Download } from 'lucide-react';
import { useAuthStore } from '../../auth/useAuthStore';
import { canExportData } from '../../auth/permissions';
import { useLeadStore } from '../../../modules/crm/stores/useLeadStore';
import { usePropertyStore } from '../../../modules/catalogo/stores/usePropertyStore';
import {
  buildFullExportJson, downloadFile, exportFileName, leadsToCsv, notesToCsv, propertiesToCsv,
} from '../../export/dataExport';
import { useT } from '../../i18n/i18n';

const CSV = 'text/csv';

// Solo el administrador la ve. Los datos son siempre de su corredora (las tiendas ya vienen filtradas por ella).
export const DataExportSection: React.FC = () => {
  const role = useAuthStore((s) => s.membership?.role ?? null);
  const leads = useLeadStore((s) => s.leads);
  const properties = usePropertyStore((s) => s.properties);
  const { t } = useT();

  if (!canExportData(role)) return null;

  const buttons: Array<{ label: string; run: () => void }> = [
    { label: t('export.properties'), run: () => downloadFile(exportFileName('propiedades', 'csv'), propertiesToCsv(properties), CSV) },
    { label: t('export.contacts'), run: () => downloadFile(exportFileName('contactos', 'csv'), leadsToCsv(leads), CSV) },
    { label: t('export.notes'), run: () => downloadFile(exportFileName('notas', 'csv'), notesToCsv(leads), CSV) },
    {
      label: t('export.full'),
      run: () => downloadFile(exportFileName('copia_completa', 'json'), buildFullExportJson({ leads, properties }), 'application/json'),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
      <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
        <Download className="w-4 h-4 text-urbe-primary" /> {t('export.title')}
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        {t('export.help')}
      </p>
      <div className="flex flex-wrap gap-2">
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={b.run}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
};
