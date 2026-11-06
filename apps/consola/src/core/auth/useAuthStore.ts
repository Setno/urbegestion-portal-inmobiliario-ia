import { create } from 'zustand';
import * as auth from './authService';
import { setSessionTenant } from '../data/dataSource';
import type { AuthError, Membership, PublicationMode, SimpleResult } from './authService';

export type AuthStatus = 'cargando' | 'sin_sesion' | 'sin_membresia' | 'con_sesion' | 'recuperando';

interface AuthStore {
  status: AuthStatus;
  email: string | null;
  membership: Membership | null;
  error: AuthError | null;
  busy: boolean;

  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<SimpleResult>;
  setNewPassword: (password: string) => Promise<SimpleResult>;
  changePublicationMode: (mode: PublicationMode) => Promise<SimpleResult>;
}

let unsubscribe: (() => void) | null = null;
// Cada vez que la sesión se cierra o cambia se sube este número: una respuesta tardía de la sesión anterior se descarta.
let sessionGeneration = 0;

export const useAuthStore = create<AuthStore>((set, get) => {
  // Resuelve el estado según haya o no corredora asociada a la sesión actual.
  const loadMembership = async (email: string) => {
    const generation = sessionGeneration;
    try {
      const membership = await auth.getMembership();
      // Si la sesión se cerró (o cambió) mientras se consultaba, esta respuesta ya no vale
      if (generation !== sessionGeneration) return;
      // La corredora de la sesión se fija ANTES de abrir el panel: así los datos que se piden al entrar ya son los suyos.
      setSessionTenant(membership?.tenantId ?? null);
      set({
        status: membership ? 'con_sesion' : 'sin_membresia',
        email,
        membership,
        error: null,
      });
    } catch {
      if (generation !== sessionGeneration) return;
      setSessionTenant(null);
      set({ status: 'sin_sesion', email: null, membership: null, error: 'conexion' });
    }
  };

  return {
    status: 'cargando',
    email: null,
    membership: null,
    error: null,
    busy: false,

    init: async () => {
      unsubscribe?.();
      unsubscribe = auth.onAuthStateChange((event, email) => {
        if (event === 'PASSWORD_RECOVERY') set({ status: 'recuperando', email, error: null });
        else if (event === 'SIGNED_OUT' && get().status !== 'recuperando') {
          sessionGeneration++;
          setSessionTenant(null);
          set({ status: 'sin_sesion', email: null, membership: null });
        }
      });
      const email = await auth.getSessionEmail();
      if (get().status === 'recuperando') return;
      if (!email) {
        sessionGeneration++;
        setSessionTenant(null);
        set({ status: 'sin_sesion', email: null, membership: null });
      } else await loadMembership(email);
    },

    signIn: async (email, password) => {
      set({ busy: true, error: null });
      const result = await auth.signInWithPassword(email, password);
      if ('error' in result) {
        set({ busy: false, error: result.error });
        return;
      }
      await loadMembership(result.email);
      set({ busy: false });
    },

    signOut: async () => {
      sessionGeneration++;
      await auth.signOut();
      setSessionTenant(null);
      set({ status: 'sin_sesion', email: null, membership: null, error: null });
    },

    resetPassword: async (email) => auth.requestPasswordReset(email),

    changePublicationMode: async (mode) => {
      const result = await auth.setPublicationMode(mode);
      const current = get().membership;
      if (result.ok && current) set({ membership: { ...current, publicationMode: mode } });
      return result;
    },

    setNewPassword: async (password) => {
      const result = await auth.updatePassword(password);
      if (result.ok) {
        sessionGeneration++;
        await auth.signOut();
        setSessionTenant(null);
        set({ status: 'sin_sesion', email: null, membership: null, error: null });
      }
      return result;
    },
  };
});
