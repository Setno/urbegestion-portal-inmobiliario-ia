import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useLeadStore } from '../../../modules/crm/stores/useLeadStore';
import { usePropertyStore } from '../../../modules/catalogo/stores/usePropertyStore';
import { useT } from '../../i18n/i18n';

export const AnalyticsTab: React.FC = () => {
  const { leads } = useLeadStore();
  const { properties } = usePropertyStore();
  const { t } = useT();

  // Analytics Data
  const leadSourceData = [
    { name: t('analytics.src.ai'), value: leads.filter(l => l.source === 'asistente_ia').length, color: '#164e63' },
    { name: t('analytics.src.listing'), value: leads.filter(l => l.source === 'ficha_propiedad').length, color: '#c59b27' },
    { name: t('analytics.src.owners'), value: leads.filter(l => l.source === 'captacion_propietarios').length, color: '#059669' },
  ];

  const propertyTypeStats = [
    { name: t('analytics.type.apartment'), count: properties.filter(p => p.propertyType === 'departamento').length },
    { name: t('analytics.type.house'), count: properties.filter(p => p.propertyType === 'casa').length },
    { name: t('analytics.type.farm'), count: properties.filter(p => p.propertyType === 'parcela_agricola').length },
    { name: t('analytics.type.office'), count: properties.filter(p => p.propertyType === 'oficina_comercial').length },
  ];

  return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">{t('analytics.title')}</h3>
        <p className="text-[11px] sm:text-xs text-slate-500 mb-4">{t('analytics.subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-4">{t('analytics.sources')}</h4>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leadSourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {leadSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-4">{t('analytics.distribution')}</h4>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={propertyTypeStats}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#164e63" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
  );
};
