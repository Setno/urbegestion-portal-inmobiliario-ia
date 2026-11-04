/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_PROVIDER?: string;
  readonly VITE_CAL_COM_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_TENANT_ID?: string;
  // Dominio de la plataforma bajo el que viven los subdominios de las corredoras (H-030)
  readonly VITE_SITIO_DOMINIO_BASE?: string;
  // Nombre del bot de Telegram que avisa los leads nuevos, sin @ (H-054)
  readonly VITE_TELEGRAM_BOT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
