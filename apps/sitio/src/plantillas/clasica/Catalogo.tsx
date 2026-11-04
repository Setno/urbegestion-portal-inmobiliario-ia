'use client';

import { useMemo, useRef, useState } from 'react';
import { Building, RotateCcw, Search } from 'lucide-react';
import { formatMoney } from '@portal/dinero';
import type { LiveRates } from '@portal/dinero/tasas';
import { getMarketPack } from '@portal/mercados';
import { filtrarPropiedades, ordenarDestacadas, SIN_FILTROS, type FiltrosCatalogo, type PublicProperty } from '@portal/sitio-datos/propiedades';
import { filtrarPorPrecio, monedasPosibles, rangoDePrecios } from '../../lib/precios';
import { etiquetaTipo, TarjetaPropiedad, type ContactoTarjeta } from './TarjetaPropiedad';

interface CatalogoProps {
  propiedades: PublicProperty[];
  marketId: string;
  conBuscador: boolean;
  contacto: ContactoTarjeta;
  // Tasas del día del mercado (en Chile, la UF); sin ellas solo se ofrecen las monedas que se pueden comparar sin convertir.
  tasas?: LiveRates;
}

const SIN_TASAS: LiveRates = { rates: {}, readings: [] };
const diaMes = (fecha: string): string => fecha.split('-').reverse().join('-');

const campo = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-base sm:text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-urbe-primary';
const titulo = 'block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1';

// Filtra en el navegador sobre la lista que ya llegó pintada desde el servidor.
export function Catalogo({ propiedades, marketId, conBuscador, contacto, tasas = SIN_TASAS }: CatalogoProps) {
  const [filtros, setFiltros] = useState<FiltrosCatalogo>(SIN_FILTROS);
  const [monedaElegida, setMonedaElegida] = useState('');
  // null: la manilla está en su extremo, sin límite. Se guardan solo los valores que de verdad filtran.
  const [desde, setDesde] = useState<number | null>(null);
  const [hasta, setHasta] = useState<number | null>(null);
  const pack = getMarketPack(marketId);
  const posibles = useMemo(() => monedasPosibles(propiedades, pack, tasas.rates), [propiedades, pack, tasas.rates]);
  const moneda = posibles.includes(monedaElegida) ? monedaElegida : posibles.includes(pack.defaultCurrency) ? pack.defaultCurrency : (posibles[0] ?? '');
  const rango = useMemo(() => (moneda ? rangoDePrecios(propiedades, moneda, pack, tasas.rates) : null), [propiedades, moneda, pack, tasas.rates]);
  const valorMin = desde ?? rango?.min ?? 0;
  const valorMax = hasta ?? rango?.max ?? 0;
  const buscar = useRef<HTMLInputElement>(null);
  const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(SIN_FILTROS) || desde !== null || hasta !== null;
  const limpiar = () => {
    setFiltros(SIN_FILTROS);
    setDesde(null);
    setHasta(null);
    // El botón desaparece al limpiar: el foco del teclado vuelve al buscador.
    buscar.current?.focus();
  };
  const cambiar = (cambio: Partial<FiltrosCatalogo>) => setFiltros((actual) => ({ ...actual, ...cambio }));

  const ordenadas = useMemo(() => ordenarDestacadas(propiedades), [propiedades]);
  const visibles = useMemo(() => {
    const filtradas = filtrarPropiedades(ordenadas, filtros);
    if (!moneda) return filtradas;
    return filtrarPorPrecio(filtradas, { moneda, min: desde, max: hasta }, pack, tasas.rates);
  }, [ordenadas, filtros, moneda, desde, hasta, pack, tasas.rates]);
  // Solo se ofrece lo que existe: elegir una opción nunca deja el catálogo vacío por sí sola.
  const comunas = useMemo(() => [...new Set(propiedades.map((p) => p.commune))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'es')), [propiedades]);
  const tipos = useMemo(() => [...new Set(propiedades.map((p) => p.propertyType))].filter(Boolean), [propiedades]);

  return (
    <section id="propiedades" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-16 sm:scroll-mt-20">
      <div className="mb-8 pb-4 border-b border-slate-200">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Propiedades</h2>
        {propiedades.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <p className="text-sm text-slate-500" aria-live="polite">
              {visibles.length === 1 ? '1 propiedad' : `${visibles.length} propiedades`}
            </p>
            {hayFiltros && (
              <button type="button" onClick={limpiar} className="text-xs font-bold text-urbe-primary inline-flex items-center gap-1.5 hover:underline">
                <RotateCcw className="w-3.5 h-3.5" />
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {conBuscador && propiedades.length > 0 && (
        <div id="buscador" className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="col-span-2 lg:col-span-1">
            <label htmlFor="filtro-buscar" className={titulo}>Buscar</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input id="filtro-buscar" ref={buscar} type="search" value={filtros.query} onChange={(e) => cambiar({ query: e.target.value })} className={`${campo} pl-8`} />
            </div>
          </div>
          <div>
            <label htmlFor="filtro-operacion" className={titulo}>Operación</label>
            <select
              id="filtro-operacion"
              value={filtros.operation}
              onChange={(e) => cambiar({ operation: e.target.value as FiltrosCatalogo['operation'] })}
              className={campo}
            >
              <option value="todas">Todas</option>
              <option value="venta">En Venta</option>
              <option value="arriendo">En Arriendo</option>
            </select>
          </div>
          <div>
            <label htmlFor="filtro-tipo" className={titulo}>Tipo</label>
            <select id="filtro-tipo" value={filtros.propertyType} onChange={(e) => cambiar({ propertyType: e.target.value })} className={campo}>
              <option value="">Todos</option>
              {tipos.map((tipo) => (
                <option key={tipo} value={tipo}>{etiquetaTipo(tipo)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filtro-comuna" className={titulo}>Comuna</label>
            <select id="filtro-comuna" value={filtros.commune} onChange={(e) => cambiar({ commune: e.target.value })} className={campo}>
              <option value="">Todas</option>
              {comunas.map((comuna) => (
                <option key={comuna} value={comuna}>{comuna}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filtro-dormitorios" className={titulo}>Dormitorios</label>
            <select id="filtro-dormitorios" value={filtros.minBedrooms} onChange={(e) => cambiar({ minBedrooms: Number(e.target.value) })} className={campo}>
              <option value={0}>Cualquiera</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n} o más</option>
              ))}
            </select>
          </div>
          {moneda && (
            <div className="col-span-2 lg:col-span-5 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-6 gap-y-3 items-end">
              {posibles.length > 1 && (
                <div className="sm:w-40">
                  <label htmlFor="filtro-moneda" className={titulo}>Moneda</label>
                  <select
                    id="filtro-moneda"
                    value={moneda}
                    onChange={(e) => {
                      // La banda se rehace en la moneda nueva: los valores de la anterior no significan lo mismo.
                      setMonedaElegida(e.target.value);
                      setDesde(null);
                      setHasta(null);
                    }}
                    className={campo}
                  >
                    {posibles.map((code) => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
              )}
              {rango && (
                <div className="sm:col-start-2">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span className={`${titulo} mb-0`}>Precio</span>
                    <span className="text-xs font-bold text-slate-800" aria-live="polite">
                      {`${formatMoney({ amount: valorMin, currency: moneda }, pack)} – ${formatMoney({ amount: valorMax, currency: moneda }, pack)}`}
                    </span>
                  </div>
                  <div className="rango-doble relative h-8">
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-slate-200" />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-urbe-primary"
                      style={{ left: `${((valorMin - rango.min) / (rango.max - rango.min)) * 100}%`, right: `${100 - ((valorMax - rango.min) / (rango.max - rango.min)) * 100}%` }}
                    />
                    <input
                      type="range"
                      aria-label="Precio mínimo"
                      aria-valuetext={formatMoney({ amount: valorMin, currency: moneda }, pack)}
                      min={rango.min}
                      max={rango.max}
                      step={rango.paso}
                      value={valorMin}
                      // Si las dos manillas quedan juntas al final, la de abajo debe poder tomarse y moverse hacia la izquierda.
                      style={{ zIndex: valorMin > rango.max - rango.paso * 5 ? 5 : 3 }}
                      onChange={(e) => {
                        const v = Math.min(Number(e.target.value), valorMax);
                        setDesde(v <= rango.min ? null : v);
                      }}
                    />
                    <input
                      type="range"
                      aria-label="Precio máximo"
                      aria-valuetext={formatMoney({ amount: valorMax, currency: moneda }, pack)}
                      min={rango.min}
                      max={rango.max}
                      step={rango.paso}
                      value={valorMax}
                      style={{ zIndex: 4 }}
                      onChange={(e) => {
                        const v = Math.max(Number(e.target.value), valorMin);
                        setHasta(v >= rango.max ? null : v);
                      }}
                    />
                  </div>
                </div>
              )}
              {tasas.readings.length > 0 && (
                <p className="sm:col-span-2 text-[11px] text-slate-500">
                  {tasas.readings
                    .map((r) => `${r.currency} de hoy: ${formatMoney({ amount: r.value, currency: pack.baseCurrency }, pack)} · ${r.source} (${diaMes(r.date)})`)
                    .join(' — ')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {visibles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibles.map((propiedad) => (
            <TarjetaPropiedad key={propiedad.id} propiedad={propiedad} marketId={marketId} contacto={contacto} moneda={moneda || undefined} tasas={tasas.rates} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          {propiedades.length === 0 ? (
            <p className="text-lg font-bold text-slate-800">Aún no hay propiedades publicadas.</p>
          ) : (
            <p className="text-lg font-bold text-slate-800">Ninguna propiedad coincide con tu búsqueda.</p>
          )}
        </div>
      )}
    </section>
  );
}
