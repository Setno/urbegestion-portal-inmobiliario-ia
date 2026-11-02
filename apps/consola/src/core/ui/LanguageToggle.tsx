import React from 'react';
import { LOCALES, useLocaleStore, useT, type Locale, type MessageKey } from '../i18n/i18n';

const NAME_KEY: Record<Locale, MessageKey> = { es: 'lang.es', en: 'lang.en' };

interface LanguageToggleProps {
  // 'dark' para las barras oscuras del panel; 'light' para el sitio público.
  tone?: 'light' | 'dark';
}

// Cambia el idioma de la pantalla; la elección queda guardada en el navegador de la persona.
export const LanguageToggle: React.FC<LanguageToggleProps> = ({ tone = 'light' }) => {
  const { locale, t } = useT();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const frame = tone === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200';
  const idle = tone === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800';
  const active = tone === 'dark' ? 'bg-slate-600 text-white' : 'bg-white text-urbe-primary shadow-sm';

  return (
    <div role="group" aria-label={t('lang.label')} className={`flex items-center p-0.5 rounded-lg border text-[11px] font-bold ${frame}`}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={locale === l}
          title={t(NAME_KEY[l])}
          onClick={() => setLocale(l)}
          className={`px-2 py-1 rounded-md transition-all ${locale === l ? `${active} font-black` : idle}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
