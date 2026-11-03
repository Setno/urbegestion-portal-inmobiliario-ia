'use client';

import { useState } from 'react';
import { Building } from 'lucide-react';

export function Galeria({ imagenes, titulo }: { imagenes: string[]; titulo: string }) {
  const [activa, setActiva] = useState(0);

  if (imagenes.length === 0) {
    return (
      <div className="aspect-[16/10] sm:aspect-[21/9] rounded-2xl bg-slate-100 flex items-center justify-center">
        <Building className="w-12 h-12 text-slate-300" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="bg-slate-950 aspect-[16/10] sm:aspect-[21/9] rounded-2xl overflow-hidden">
        <img src={imagenes[activa]} alt={titulo} className="w-full h-full object-cover" />
      </div>
      {imagenes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto py-1">
          {imagenes.map((imagen, i) => (
            <button
              key={imagen}
              type="button"
              onClick={() => setActiva(i)}
              aria-label={`Ver foto ${i + 1} de ${imagenes.length}`}
              aria-current={i === activa}
              className={`w-16 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${i === activa ? 'border-urbe-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <img src={imagen} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
