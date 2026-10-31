/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_ADMIN?: string;
  readonly VITE_AI_PROVIDER?: string;
  readonly VITE_CAL_COM_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
