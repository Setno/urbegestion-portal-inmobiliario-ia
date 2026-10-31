import { createLocalStore } from '../storage/localStore';

// Contrato común de acceso a datos. Las tiendas llaman a esto sin saber si los datos van al navegador o a Supabase.
// `snapshot` es la lista completa ya actualizada: el repositorio local la guarda tal cual; el remoto la ignora.
export interface Repository<T extends { id: string }> {
  mode: 'local' | 'remote';
  newId: () => string;
  list: () => Promise<T[] | null>;
  create: (item: T, snapshot: T[]) => Promise<void>;
  update: (id: string, patch: Partial<T>, snapshot: T[]) => Promise<void>;
  remove: (id: string, snapshot: T[]) => Promise<void>;
}

export function createLocalRepository<T extends { id: string }>(storageKey: string, idPrefix: string, makeId: (prefix: string) => string): Repository<T> {
  const storage = createLocalStore<T[]>(storageKey);
  return {
    mode: 'local',
    newId: () => makeId(idPrefix),
    list: async () => null,
    create: async (_item, snapshot) => storage.save(snapshot),
    update: async (_id, _patch, snapshot) => storage.save(snapshot),
    remove: async (_id, snapshot) => storage.save(snapshot),
  };
}

// Lanza un Error legible si Supabase respondió con error.
export function throwIfError(error: { message: string } | null | undefined): void {
  if (error) throw new Error(error.message);
}

// RLS no da error cuando filtra: update/delete sobre una fila ajena o sin permiso "funciona" con 0 filas.
// Se pide `.select('id')` y se trata la respuesta vacía como error.
export function throwIfNoRows(data: unknown, action: string): void {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No se pudo ${action}: la fila no existe o no tienes permiso`);
  }
}
