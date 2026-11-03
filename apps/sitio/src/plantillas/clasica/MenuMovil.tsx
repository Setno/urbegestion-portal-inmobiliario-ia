'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export interface EnlaceMenu {
  href: string;
  texto: string;
}

export function MenuMovil({ enlaces }: { enlaces: EnlaceMenu[] }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden"
        aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={abierto}
      >
        {abierto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      {abierto && (
        <nav className="lg:hidden absolute top-full left-0 right-0 !ml-0 bg-white border-b border-slate-200 px-4 py-3 shadow-2xl flex flex-col text-sm font-semibold">
          {enlaces.map((enlace) => (
            <a key={enlace.href} href={enlace.href} onClick={() => setAbierto(false)} className="py-2.5 text-slate-800 hover:text-urbe-primary">
              {enlace.texto}
            </a>
          ))}
        </nav>
      )}
    </>
  );
}
