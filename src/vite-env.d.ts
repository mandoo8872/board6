/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: string;
  readonly VITE_ADMIN_PASSWORD: string;
  readonly VITE_VIEW_PASSWORD: string;
}
 
interface ImportMeta {
  readonly env: ImportMetaEnv;
} 