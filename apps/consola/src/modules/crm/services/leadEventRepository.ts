import type { SupabaseClient } from '@supabase/supabase-js';
import type { LeadEvent } from '../types/leadEvent';
import { throwIfError } from '../../../core/data/repository';
import { remoteContext } from '../../../core/data/dataSource';
import { createLocalStore } from '../../../core/storage/localStore';
import { newId, newUuid } from '../../../core/utils/newId';

export interface LeadEventRepository {
  mode: 'local' | 'remote';
  newId: () => string;
  // Eventos de un lead, o null si no hace falta pedirlos (el almacenamiento local ya los tiene todos).
  listForLead: (leadId: string) => Promise<LeadEvent[] | null>;
  // `snapshot` es la lista completa para el modo local; el remoto la ignora.
  create: (event: LeadEvent, snapshot?: LeadEvent[]) => Promise<void>;
}

type Row = Record<string, unknown>;

const fromRow = (r: Row): LeadEvent => ({
  id: String(r.id),
  leadId: String(r.lead_id),
  kind: r.kind as LeadEvent['kind'],
  text: String(r.text ?? ''),
  occurredAt: String(r.occurred_at),
  author: String(r.author_email ?? ''),
});

export const eventStorage = createLocalStore<LeadEvent[]>('urbe_lead_events');

export function createLocalLeadEventRepository(): LeadEventRepository {
  return {
    mode: 'local',
    newId: () => newId('evt'),
    listForLead: async () => null,
    create: async (_event, snapshot) => {
      if (snapshot) eventStorage.save(snapshot);
    },
  };
}

export function createRemoteLeadEventRepository(client: SupabaseClient, tenantId: string): LeadEventRepository {
  return {
    mode: 'remote',
    newId: newUuid,
    listForLead: async (leadId) => {
      const { data, error } = await client
        .from('lead_events')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('lead_id', leadId)
        .order('occurred_at', { ascending: false })
        .limit(200);
      throwIfError(error);
      return ((data ?? []) as Row[]).map(fromRow);
    },
    // El autor lo pone la base con el correo de la sesión; el navegador no puede firmar por otro.
    create: async (e) => {
      const { error } = await client
        .from('lead_events')
        .insert({ id: e.id, tenant_id: tenantId, lead_id: e.leadId, kind: e.kind, text: e.text, occurred_at: e.occurredAt });
      throwIfError(error);
    },
  };
}

let current: LeadEventRepository | null = null;

export function getLeadEventRepository(): LeadEventRepository {
  if (!current) {
    const ctx = remoteContext();
    current = ctx ? createRemoteLeadEventRepository(ctx.client, ctx.tenantId) : createLocalLeadEventRepository();
  }
  return current;
}

// Solo para pruebas.
export function setLeadEventRepository(repo: LeadEventRepository | null): void {
  current = repo;
}
