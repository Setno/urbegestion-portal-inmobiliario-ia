import React from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import { useT } from '../i18n/i18n';
import { useAuthStore } from '../auth/useAuthStore';
import { accessMode } from '@portal/plataforma/contract';
import { useEntitlementsStore } from '../platform/useEntitlementsStore';

// Avisa en el panel cuando la suscripción de la corredora no está al día (el estado lo informa ventas, ADR-009).
export const AccessBanner: React.FC = () => {
  const { t, locale } = useT();
  const entitlements = useEntitlementsStore((s) => s.entitlements);
  const role = useAuthStore((s) => s.membership?.role ?? null);
  const mode = accessMode(entitlements);
  if (mode === 'full') return null;

  const grace = entitlements.graceEndsAt ? new Date(entitlements.graceEndsAt) : null;
  const text =
    mode === 'notice'
      ? grace
        ? t('access.notice.until', { date: grace.toLocaleDateString(locale) })
        : t('access.notice')
      : mode === 'read_only'
        ? t('access.read_only')
        : role === 'admin'
          ? t('access.export_only')
          : t('access.export_only.agent');
  const Icon = mode === 'notice' ? AlertTriangle : Lock;
  const tone = mode === 'notice' ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-rose-50 text-rose-900 border-rose-200';

  return (
    <div role="status" className={`shrink-0 px-4 py-2.5 border-b text-xs font-semibold flex items-center gap-2 ${tone}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
};
