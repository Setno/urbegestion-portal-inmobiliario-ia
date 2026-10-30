// Único punto de persistencia local. Hoy guarda en el navegador (localStorage);
// al incorporar Supabase se reemplaza este módulo y las tiendas no cambian de contrato.
export interface LocalStore<T> {
  load: () => T | null;
  save: (value: T) => void;
  clear: () => void;
}

export function createLocalStore<T>(key: string): LocalStore<T> {
  return {
    load: () => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch (e) {
        console.warn(`[localStore] No se pudo leer "${key}":`, e);
        return null;
      }
    },
    save: (value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn(`[localStore] No se pudo guardar "${key}":`, e);
      }
    },
    clear: () => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`[localStore] No se pudo borrar "${key}":`, e);
      }
    },
  };
}
