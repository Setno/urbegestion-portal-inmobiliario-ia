/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_PROVIDER?: string;
  readonly VITE_CAL_COM_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_TENANT_ID?: string;
  // Dominio de la plataforma bajo el que viven los subdominios de las corredoras (H-030)
  readonly VITE_SITIO_DOMINIO_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
