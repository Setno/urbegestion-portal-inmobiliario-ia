'use client';

import { useState } from 'react';
import { NOTICE_DETAILS, NOTICE_TEXT } from '@portal/sitio-datos/privacidad';

// Informa al enviar; no pide marcar nada (Ley 21.719, deber de información; H-012).
export function AvisoPrivacidad() {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="text-[11px] leading-snug text-slate-500">
      <p>
        {NOTICE_TEXT}{' '}
        <button type="button" onClick={() => setAbierto(!abierto)} className="underline font-semibold text-slate-600" aria-expanded={abierto}>
          {abierto ? 'Ocultar detalle' : 'Ver detalle'}
        </button>
      </p>
      {abierto && (
        <ul className="mt-2 ml-4 list-disc space-y-1">
          {NOTICE_DETAILS.map((linea) => (
            <li key={linea}>{linea}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
