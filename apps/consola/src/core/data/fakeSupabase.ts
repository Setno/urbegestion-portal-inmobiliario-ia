import type { SupabaseClient } from '@supabase/supabase-js';

// Cliente de Supabase simulado para pruebas: registra cada llamada encadenada
// (from → insert/update/delete/select/eq/order...) y responde con `result` al hacer await.
export interface FakeCall {
  table: string;
  ops: Array<[string, unknown[]]>;
}

export interface FakeResult {
  data: unknown;
  error: { message: string } | null;
}

export function createFakeSupabase(result: FakeResult = { data: null, error: null }) {
  const calls: FakeCall[] = [];
  const state = { result };

  const from = (table: string) => {
    const call: FakeCall = { table, ops: [] };
    calls.push(call);
    const builder: unknown = new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (prop === 'then') {
            return (resolve: (v: FakeResult) => unknown, reject: (e: unknown) => unknown) =>
              Promise.resolve(state.result).then(resolve, reject);
          }
          return (...args: unknown[]) => {
            call.ops.push([String(prop), args]);
            return builder;
          };
        },
      },
    );
    return builder;
  };

  return {
    client: { from } as unknown as SupabaseClient,
    calls,
    setResult: (next: FakeResult) => {
      state.result = next;
    },
    opsOf: (index: number) => calls[index].ops.map(([name]) => name),
    argsOf: (index: number, op: string) => calls[index].ops.find(([name]) => name === op)?.[1],
  };
}
