import React, { useState } from 'react';
import { NOTICE_TEXT, NOTICE_DETAILS } from './privacy';

// Aviso de privacidad breve bajo el botón de envío. No pide marcar nada: informa al enviar (Ley 21.719, deber de información).
export const PrivacyNotice: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-[11px] leading-snug text-slate-500">
      <p>
        {NOTICE_TEXT}{' '}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="underline font-semibold text-slate-600"
          aria-expanded={open}
        >
          {open ? 'Ocultar detalle' : 'Ver detalle'}
        </button>
      </p>
      {open && (
        <ul className="mt-2 ml-4 list-disc space-y-1">
          {NOTICE_DETAILS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
