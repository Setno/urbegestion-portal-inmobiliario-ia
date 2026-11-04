import type { SupabaseClient } from '@supabase/supabase-js';
import type { Lead } from '../types/lead';
import { remoteContext } from '../../../core/data/dataSource';
import { fromRow } from './leadRepository';

// Aviso en vivo (H-054): con el panel abierto, cada lead nuevo de la corredora llega al instante, venga del sitio,
// de la landing o del chat. La base solo entrega los leads que la persona con sesión puede ver (RLS).
// Devuelve la función para dejar de escuchar. Sin base de datos no hace nada.
export function subscribeNewLeads(
  onLead: (lead: Lead) => void,
  ctx: { client: SupabaseClient; tenantId: string } | null = remoteContext(),
): () => void {
  if (!ctx) return () => undefined;
  const channel = ctx.client
    .channel(`leads-nuevos-${ctx.tenantId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'leads', filter: `tenant_id=eq.${ctx.tenantId}` },
      (payload: { new: Record<string, unknown> }) => {
        try {
          onLead(fromRow(payload.new));
        } catch (err) {
          console.warn('[leads] No se pudo leer un lead nuevo recibido en vivo:', err);
        }
      },
    )
    .subscribe();
  return () => {
    void ctx.client.removeChannel(channel);
  };
}
