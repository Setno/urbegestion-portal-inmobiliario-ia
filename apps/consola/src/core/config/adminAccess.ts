import { isSupabaseConfigured } from '../auth/supabaseClient';

// El acceso al panel exige iniciar sesión (Supabase Auth). Los botones de acceso solo
// aparecen si Supabase está configurado en este entorno (VITE_SUPABASE_URL y clave publicable).
export const ADMIN_ENABLED: boolean = isSupabaseConfigured;

// Consola de producción: con VITE_MODO_PANEL=1 la dirección abre directo el inicio de sesión del panel, sin la
// portada de demostración. Sin la variable (desarrollo y previews) la aplicación es la de siempre.
// Lo que ven los clientes finales de cada corredora es el sitio público (apps/sitio), no esta aplicación.
export const PANEL_ONLY: boolean = ADMIN_ENABLED && import.meta.env.VITE_MODO_PANEL === '1';
