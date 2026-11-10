import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../../core/auth/useAuthStore';
import { canInviteAgents } from '../../../core/auth/permissions';
import { isRemoteData } from '../../../core/data/dataSource';
import { fetchPortalConnections, fetchPortalListings, type PortalListing } from '../../../core/portals/portalConnectionService';

// Avisos de la corredora en portales y si Mercado Libre está conectado (H-068.3). Una sola carga para todo el catálogo.
// Solo el administrador con la base conectada lo pide; para el resto no hace ninguna llamada.
export function usePortalListings() {
  const role = useAuthStore((s) => s.membership?.role ?? null);
  const enabled = canInviteAgents(role) && isRemoteData;
  const [listings, setListings] = useState<Record<string, PortalListing>>({});
  const [connected, setConnected] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) return;
    const [list, connections] = await Promise.all([fetchPortalListings(), fetchPortalConnections()]);
    if (list) setListings(list);
    if (connections) setConnected(connections.some((c) => c.portal === 'mercadolibre'));
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { listings, connected, reload };
}
