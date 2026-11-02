// Base de datos de mentira para probar los endpoints de plataforma sin tocar Supabase.
// Solo implementa lo que usan tenant-sync y metrics. Vive fuera de api/ porque Vercel publica como función todo lo que hay ahí.
type Row = Record<string, unknown>;

export function createFakeDb(initial: { tenants?: Row[]; tenant_entitlements?: Row[]; rpc?: Record<string, unknown> } = {}) {
  const tables: Record<string, Row[]> = {
    tenants: initial.tenants ?? [],
    tenant_entitlements: initial.tenant_entitlements ?? [],
  };
  const rpcResults: Record<string, unknown> = initial.rpc ?? {};
  let failNext: { code?: string; message: string } | null = null;

  const builder = (table: string, mode: 'select' | 'update' | 'insert', payload?: Row) => {
    const filters: Array<(r: Row) => boolean> = [];
    const run = () => {
      if (failNext) {
        const error = failNext;
        failNext = null;
        return { data: null, error };
      }
      const rows = tables[table];
      if (mode === 'insert' && payload) {
        const clash = rows.some(
          (r) => r.tenant_id === payload.tenant_id || (payload.tenant_ref && r.tenant_ref === payload.tenant_ref),
        );
        if (clash) return { data: null, error: { code: '23505', message: 'duplicate key' } };
        rows.push({ ...payload });
        return { data: null, error: null };
      }
      const matched = rows.filter((r) => filters.every((f) => f(r)));
      if (mode === 'update' && payload) {
        const taken = matched.length > 0 && payload.tenant_ref && rows.some((r) => r.tenant_ref === payload.tenant_ref && !matched.includes(r));
        if (taken) return { data: null, error: { code: '23505', message: 'duplicate key' } };
        matched.forEach((r) => Object.assign(r, payload));
      }
      return { data: matched, error: null };
    };
    const b = {
      eq(column: string, value: unknown) {
        filters.push((r) => r[column] === value);
        return b;
      },
      lte(column: string, value: string) {
        filters.push((r) => Date.parse(String(r[column])) <= Date.parse(value));
        return b;
      },
      select() {
        return b;
      },
      maybeSingle() {
        const result = run();
        return Promise.resolve({ data: (result.data as Row[] | null)?.[0] ?? null, error: result.error });
      },
      then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
        return Promise.resolve(run()).then(resolve, reject);
      },
    };
    return b;
  };

  const client = {
    from: (table: string) => ({
      select: () => builder(table, 'select'),
      update: (payload: Row) => builder(table, 'update', payload),
      insert: (payload: Row) => builder(table, 'insert', payload),
    }),
    rpc: (name: string) => {
      if (failNext) {
        const error = failNext;
        failNext = null;
        return Promise.resolve({ data: null, error });
      }
      return Promise.resolve({ data: rpcResults[name] ?? null, error: null });
    },
  };

  return { client, tables, failNext: (error: { code?: string; message: string }) => (failNext = error) };
}
