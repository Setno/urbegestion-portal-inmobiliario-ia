import { isSupabaseConfigured } from '../auth/supabaseClient';

// El acceso al panel exige iniciar sesión (Supabase Auth). Los botones de acceso solo
// aparecen si Supabase está configurado en este entorno (VITE_SUPABASE_URL y clave publicable).
export const ADMIN_ENABLED: boolean = isSupabaseConfigured;
