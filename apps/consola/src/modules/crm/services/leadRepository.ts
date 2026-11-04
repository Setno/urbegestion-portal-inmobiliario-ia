import type { SupabaseClient } from '@supabase/supabase-js';
import type { Lead } from '../types/lead';
import { createLocalRepository, throwIfError, throwIfNoRows, type Repository } from '../../../core/data/repository';
import { remoteContext } from '../../../core/data/dataSource';
import { limpiarAtribucion } from '@portal/sitio-datos/atribucion';
import { isUuid, newId, newUuid } from '../../../core/utils/newId';

// `appendNote` solo existe en el repositorio remoto: agrega la nota dentro de la base en un solo paso,
// para que dos agentes que escriben a la vez no se pisen.
export type LeadRepository = Repository<Lead> & {
  appendNote?: (id: string, note: string) => Promise<void>;
};

type Row = Record<string, unknown>;

// Lead (app) → columna (base). Al crear, los campos ausentes se omiten. Al editar (`clear`), un campo presente
// con valor undefined significa "borrar": se envía null para que el valor viejo no reaparezca.
function toRow(l: Partial<Lead>, clear = false): Row {
  const row: Row = {};
  const put = (column: string, key: keyof Lead, value: unknown) => {
    if (value !== undefined) row[column] = value;
    else if (clear && key in l) row[column] = null;
  };
  put('full_name', 'fullName', l.fullName);
  put('email', 'email', l.email);
  put('phone', 'phone', l.phone);
  if ('propertyInterestId' in l) row.property_id = isUuid(l.propertyInterestId) ? l.propertyInterestId : null;
  put('property_title', 'propertyTitle', l.propertyTitle);
  put('operation_interest', 'operationInterest', l.operationInterest);
  put('budget_amount', 'budgetAmount', l.budgetAmount);
  put('budget_currency', 'budgetCurrency', l.budgetCurrency);
  put('mortgage_status', 'mortgageStatus', l.mortgageStatus);
  put('target_move_date', 'targetMoveDate', l.targetMoveDate);
  put('status', 'status', l.status);
  if ('appointmentDate' in l) row.appointment_date = l.appointmentDate ? l.appointmentDate : null;
  put('appointment_time', 'appointmentTime', l.appointmentTime);
  put('notes', 'notes', l.notes);
  put('next_action_text', 'nextActionText', l.nextActionText);
  put('next_action_due', 'nextActionDue', l.nextActionDue);
  put('source', 'source', l.source);
  put('attachments', 'attachments', l.attachments);
  put('property_specs', 'propertySpecs', l.propertySpecs);
  put('privacy_notice', 'privacyNotice', l.privacyNotice);
  put('attribution', 'attribution', l.attribution);
  if ('convertedPropertyId' in l) row.converted_property_id = isUuid(l.convertedPropertyId) ? l.convertedPropertyId : null;
  return row;
}

const opt = <T>(value: unknown): T | undefined => (value === null || value === undefined ? undefined : (value as T));

// También la usa el aviso en vivo de leads nuevos (leadRealtime.ts).
export function fromRow(r: Row): Lead {
  const lead: Lead = {
    id: String(r.id),
    fullName: String(r.full_name),
    email: String(r.email ?? ''),
    phone: String(r.phone ?? ''),
    operationInterest: r.operation_interest as Lead['operationInterest'],
    status: r.status as Lead['status'],
    notes: (r.notes as string[]) ?? [],
    source: r.source as Lead['source'],
    createdAt: String(r.created_at ?? '').slice(0, 10),
  };
  if (r.created_at) lead.createdAtIso = String(r.created_at);
  const set = <K extends keyof Lead>(key: K, value: Lead[K] | undefined) => {
    if (value !== undefined) lead[key] = value as Lead[K];
  };
  set('propertyInterestId', opt<string>(r.property_id));
  set('propertyTitle', opt<string>(r.property_title));
  const budget = opt<number>(r.budget_amount);
  set('budgetAmount', budget === undefined ? undefined : Number(budget));
  set('budgetCurrency', opt(r.budget_currency));
  set('mortgageStatus', opt(r.mortgage_status));
  set('targetMoveDate', opt(r.target_move_date));
  set('appointmentDate', opt<string>(r.appointment_date));
  set('appointmentTime', opt<string>(r.appointment_time));
  set('nextActionText', opt<string>(r.next_action_text));
  const due = opt<string>(r.next_action_due);
  set('nextActionDue', due ? due.slice(0, 10) : undefined);
  const attachments = opt<string[]>(r.attachments);
  set('attachments', attachments && attachments.length > 0 ? attachments : undefined);
  set('propertySpecs', opt(r.property_specs));
  set('privacyNotice', opt(r.privacy_notice));
  // Lo guarda quien llame a la base con la clave pública: se limpia al leer, no se confía en su forma.
  set('attribution', limpiarAtribucion(r.attribution) ?? undefined);
  set('convertedPropertyId', opt<string>(r.converted_property_id));
  return lead;
}

export function createLocalLeadRepository(): LeadRepository {
  return createLocalRepository<Lead>('urbe_leads', 'lead', newId);
}

export function createRemoteLeadRepository(client: SupabaseClient, tenantId: string): LeadRepository {
  return {
    mode: 'remote',
    newId: newUuid,
    list: async () => {
      const { data, error } = await client
        .from('leads')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      throwIfError(error);
      return ((data ?? []) as Row[]).map(fromRow);
    },
    // Sin .select(): el visitante del sitio puede crear leads pero no leerlos, así que no se pide la fila de vuelta.
    create: async (item) => {
      const { error } = await client.from('leads').insert({ id: item.id, tenant_id: tenantId, ...toRow(item) });
      throwIfError(error);
    },
    update: async (id, patch) => {
      const { data, error } = await client.from('leads').update(toRow(patch, true)).eq('id', id).select('id');
      throwIfError(error);
      throwIfNoRows(data, 'actualizar el lead');
    },
    appendNote: async (id, note) => {
      const { error } = await client.rpc('append_lead_note', { p_lead_id: id, p_note: note });
      throwIfError(error);
    },
    remove: async (id) => {
      const { data, error } = await client.from('leads').delete().eq('id', id).select('id');
      throwIfError(error);
      throwIfNoRows(data, 'borrar el lead');
    },
  };
}

let current: LeadRepository | null = null;

export function getLeadRepository(): LeadRepository {
  if (!current) {
    const ctx = remoteContext();
    current = ctx ? createRemoteLeadRepository(ctx.client, ctx.tenantId) : createLocalLeadRepository();
  }
  return current;
}

// Solo para pruebas: cambia el repositorio que usa la tienda.
export function setLeadRepository(repo: LeadRepository | null): void {
  current = repo;
}
