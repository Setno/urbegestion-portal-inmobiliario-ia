import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { subscribeNewLeads } from './leadRealtime';

// Canal falso de Supabase Realtime: guarda el filtro y la función que recibe los cambios.
function clienteFalso() {
  const registro: { nombre?: string; filtro?: Record<string, string>; recibir?: (p: { new: Record<string, unknown> }) => void } = {};
  const canal = {
    on: vi.fn((_tipo: string, filtro: Record<string, string>, recibir: (p: { new: Record<string, unknown> }) => void) => {
      registro.filtro = filtro;
      registro.recibir = recibir;
      return canal;
    }),
    subscribe: vi.fn(() => canal),
  };
  const client = {
    channel: vi.fn((nombre: string) => {
      registro.nombre = nombre;
      return canal;
    }),
    removeChannel: vi.fn(async () => 'ok'),
  };
  return { client: client as unknown as SupabaseClient, raw: client, canal, registro };
}

describe('subscribeNewLeads (H-054)', () => {
  it('escucha solo los leads nuevos de la corredora y los entrega como Lead', () => {
    const { client, registro } = clienteFalso();
    const onLead = vi.fn();
    subscribeNewLeads(onLead, { client, tenantId: 't1' });
    expect(registro.filtro).toEqual({ event: 'INSERT', schema: 'public', table: 'leads', filter: 'tenant_id=eq.t1' });
    registro.recibir?.({ new: { id: 'l1', full_name: 'Ana', operation_interest: 'compra', status: 'nuevo', source: 'ficha_propiedad', notes: [], created_at: '2026-11-03T10:00:00Z', property_title: 'Casa' } });
    expect(onLead).toHaveBeenCalledWith(expect.objectContaining({ id: 'l1', fullName: 'Ana', propertyTitle: 'Casa', createdAt: '2026-11-03' }));
  });

  it('dejar de escuchar cierra el canal', () => {
    const { client, raw, canal } = clienteFalso();
    const cerrar = subscribeNewLeads(vi.fn(), { client, tenantId: 't1' });
    cerrar();
    expect(raw.removeChannel).toHaveBeenCalledWith(canal);
  });

  it('sin base de datos no hace nada', () => {
    expect(() => subscribeNewLeads(vi.fn(), null)()).not.toThrow();
  });
});
