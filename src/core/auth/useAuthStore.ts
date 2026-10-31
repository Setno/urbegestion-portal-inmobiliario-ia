import { create } from 'zustand';
import * as auth from './authService';
import type { AuthError, Membership, SimpleResult } from './authService';

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
}

let unsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthStore>((set, get) => {
  // Resuelve el estado según haya o no corredora asociada a la sesión actual.
  const loadMembership = async (email: string) => {
    try {
      const membership = await auth.getMembership();
      set({
        status: membership ? 'con_sesion' : 'sin_membresia',
        email,
        membership,
        error: null,
      });
    } catch {
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
          set({ status: 'sin_sesion', email: null, membership: null });
        }
      });
      const email = await auth.getSessionEmail();
      if (get().status === 'recuperando') return;
      if (!email) set({ status: 'sin_sesion', email: null, membership: null });
      else await loadMembership(email);
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
      await auth.signOut();
      set({ status: 'sin_sesion', email: null, membership: null, error: null });
    },

    resetPassword: async (email) => auth.requestPasswordReset(email),

    setNewPassword: async (password) => {
      const result = await auth.updatePassword(password);
      if (result.ok) {
        await auth.signOut();
        set({ status: 'sin_sesion', email: null, membership: null, error: null });
      }
      return result;
    },
  };
});
