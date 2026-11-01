import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useAuthStore } from '../../auth/useAuthStore';
import { canEditServiceAreas } from '../../auth/permissions';
import { useMarket, useMarketStore } from '../../market/useMarketStore';

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

// Solo el administrador la ve. Las zonas que marque son las que ofrecen el buscador, el formulario de propiedades
// y el valorizador; sin ninguna marcada se ofrece todo el mercado.
export const ServiceAreasSection: React.FC = () => {
  const role = useAuthStore((s) => s.membership?.role ?? null);
  const saved = useMarketStore((s) => s.serviceAreas);
  const save = useMarketStore((s) => s.setServiceAreas);
  const { pack } = useMarket();
  const [draft, setDraft] = useState<string[]>(saved);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Si las zonas guardadas cambian desde fuera (por ejemplo al terminar de cargar), el borrador las sigue.
  useEffect(() => setDraft(saved), [saved]);

  if (!canEditServiceAreas(role)) return null;

  const toggle = (id: string) => {
    setMessage(null);
    setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  };

  const handleSave = async () => {
    setBusy(true);
    const result = await save(draft);
    setBusy(false);
    setMessage(
      result.ok
        ? { ok: true, text: 'Zonas guardadas. El sitio y el panel ya usan estas regiones.' }
        : { ok: false, text: 'No se pudieron guardar las zonas. Inténtalo de nuevo.' },
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
      <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
        <MapPin className="w-4 h-4 text-urbe-primary" /> Dónde trabaja tu corredora
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Marca las {pack.areaLabel.toLowerCase()}s donde publicas propiedades. El buscador del sitio, el formulario de
        propiedades y la tasación ofrecerán solo las {pack.localityLabel.toLowerCase()}s de esas {pack.areaLabel.toLowerCase()}s.
        Sin ninguna {pack.areaLabel.toLowerCase()} marcada se ofrece todo {pack.name}.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {pack.areas.map((area) => (
          <label
            key={area.id}
            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer ${
              draft.includes(area.id) ? 'border-urbe-primary bg-urbe-primary/5 font-bold' : 'border-slate-200'
            }`}
          >
            <input type="checkbox" checked={draft.includes(area.id)} onChange={() => toggle(area.id)} />
            <span>{area.name}</span>
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={busy || sameSet(draft, saved)}
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-urbe-primary text-white text-xs font-bold disabled:opacity-50"
        >
          Guardar zonas
        </button>
        {message && (
          <p role="status" className={`text-xs font-semibold ${message.ok ? 'text-emerald-700' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
};
