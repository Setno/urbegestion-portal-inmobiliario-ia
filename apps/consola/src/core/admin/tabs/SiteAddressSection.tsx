import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { useAuthStore } from '../../auth/useAuthStore';
import { canInviteAgents } from '../../auth/permissions';
import { isRemoteData } from '../../data/dataSource';
import { can } from '@portal/plataforma/contract';
import { useEntitlementsStore } from '../../platform/useEntitlementsStore';
import {
  cleanDomain,
  fetchSiteAddress,
  platformDomain,
  saveSiteAddress,
  validDomain,
  validSubdomain,
  type SiteAddressError,
} from '../../brand/siteAddressService';

const ERROR_TEXT: Record<SiteAddressError | 'subdominio' | 'dominio', string> = {
  subdominio: 'El subdominio solo puede tener letras minúsculas sin tildes, números y guiones (no al inicio ni al final), y algunas palabras están reservadas (www, app, admin...).',
  dominio: 'Escribe solo tu dominio, por ejemplo micorredora.cl (sin https:// ni rutas). No sirven las direcciones de la plataforma ni las de Vercel.',
  repetida: 'Esa dirección ya la usa otra corredora. Prueba con otra.',
  invalida: 'La dirección no es válida. Revisa cómo está escrita.',
  permiso: 'Tu plan no permite este cambio o tu corredora está en solo lectura.',
  conexion: 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.',
  no_configurado: 'La dirección del sitio se configura cuando el panel está conectado a la base de datos.',
};

// Dónde se ve el sitio de la corredora (H-030): subdominio de la plataforma y, si el plan lo incluye, dominio propio.
// Solo la ve el administrador. Sin base de datos no hay sitio público que configurar.
export const SiteAddressSection: React.FC = () => {
  const role = useAuthStore((s) => s.membership?.role ?? null);
  const entitlements = useEntitlementsStore((s) => s.entitlements);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [subdomain, setSubdomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [saved, setSaved] = useState({ subdomain: '', customDomain: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const isAdmin = canInviteAgents(role);

  useEffect(() => {
    if (!isAdmin || !isRemoteData) return;
    let cancelled = false;
    fetchSiteAddress().then((address) => {
      if (cancelled) return;
      if (!address) {
        setStatus('error');
        return;
      }
      setSubdomain(address.subdomain);
      setCustomDomain(address.customDomain);
      setSaved(address);
      setStatus('ok');
    });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (!isAdmin) return null;

  const allowsCustomDomain = can(entitlements, 'site.custom_domain');
  const sub = subdomain.trim().toLowerCase();
  const domain = cleanDomain(customDomain);
  const changed = sub !== saved.subdomain || domain !== saved.customDomain;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !changed) return;
    if (!validSubdomain(sub)) return setMessage({ ok: false, text: ERROR_TEXT.subdominio });
    if (!validDomain(domain)) return setMessage({ ok: false, text: ERROR_TEXT.dominio });
    setBusy(true);
    setMessage(null);
    const result = await saveSiteAddress({ subdomain: sub, customDomain: allowsCustomDomain ? domain : saved.customDomain });
    setBusy(false);
    if ('error' in result) {
      setMessage({ ok: false, text: ERROR_TEXT[result.error] });
      return;
    }
    const next = { subdomain: sub, customDomain: allowsCustomDomain ? domain : saved.customDomain };
    setSaved(next);
    setSubdomain(next.subdomain);
    setCustomDomain(next.customDomain);
    setMessage({ ok: true, text: 'Dirección guardada. El sitio la reconoce en un par de minutos.' });
  };

  const inputClass = 'flex-1 min-w-0 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-urbe-primary';

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
      <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
        <Globe className="w-4 h-4 text-urbe-primary" /> Dirección de tu sitio
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Elige dónde verán tus clientes tu sitio: un subdominio gratuito de la plataforma y, si tu plan lo incluye, tu propio dominio.
      </p>

      {!isRemoteData && <p className="text-xs text-slate-600">{ERROR_TEXT.no_configurado}</p>}
      {isRemoteData && status === 'loading' && <p className="text-xs text-slate-500">Cargando la dirección actual…</p>}
      {isRemoteData && status === 'error' && (
        <p role="alert" className="text-xs font-semibold text-red-600">
          No se pudo leer la dirección actual. Recarga la página para intentarlo de nuevo.
        </p>
      )}

      {isRemoteData && status === 'ok' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="site-subdomain" className="block text-xs font-bold text-slate-700 mb-1">Subdominio</label>
            <div className="flex items-center gap-2">
              <input
                id="site-subdomain"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="micorredora"
                className={inputClass}
                autoCapitalize="none"
                spellCheck={false}
              />
              <span className="text-xs text-slate-500 shrink-0">.{platformDomain || '(dominio de la plataforma)'}</span>
            </div>
          </div>

          <div>
            <label htmlFor="site-domain" className="block text-xs font-bold text-slate-700 mb-1">Dominio propio (opcional)</label>
            <input
              id="site-domain"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="micorredora.cl"
              disabled={!allowsCustomDomain}
              className={`${inputClass} w-full disabled:opacity-60`}
              autoCapitalize="none"
              spellCheck={false}
            />
            {!allowsCustomDomain && <p className="text-[11px] text-slate-500 mt-1">Tu plan no incluye dominio propio.</p>}
          </div>

          {allowsCustomDomain && domain && validDomain(domain) && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <p className="font-bold text-slate-900">Cómo conectar {domain}</p>
              <p>En el sitio donde compraste el dominio (por ejemplo NIC Chile o tu proveedor de correo), busca la sección DNS y crea estos registros:</p>
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-slate-500">
                    <th className="py-1 pr-2">Tipo</th>
                    <th className="py-1 pr-2">Nombre</th>
                    <th className="py-1">Valor</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  <tr>
                    <td className="py-1 pr-2">A</td>
                    <td className="py-1 pr-2">@</td>
                    <td className="py-1">76.76.21.21</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-2">CNAME</td>
                    <td className="py-1 pr-2">www</td>
                    <td className="py-1">cname.vercel-dns.com</td>
                  </tr>
                </tbody>
              </table>
              <p>Después avísale al equipo de la plataforma para activar el dominio. Los cambios de DNS pueden tardar hasta un día en notarse.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !changed}
            className="px-5 py-2.5 bg-urbe-primary text-white rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {busy ? 'Guardando…' : 'Guardar dirección'}
          </button>
        </form>
      )}

      {message && (
        <p role="status" className={`text-xs mt-3 font-semibold ${message.ok ? 'text-emerald-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
};
