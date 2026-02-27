/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STORAGE_MODE?: 'local' | 'cloud' | 'hybrid';
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_REDIRECT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
