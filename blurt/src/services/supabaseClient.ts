import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

// Public anon credentials for the default hosted Blurt project.
const DEFAULT_SUPABASE_URL = 'https://zhqgonxcrlbnubhmidth.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_tNl8ZRWSgl1yFZXFlolKQQ_Z6CmEWa1';

const resolveSupabaseConfig = (): { url: string; anonKey: string } => {
  const url = import.meta.env.VITE_SUPABASE_URL ?? DEFAULT_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? DEFAULT_SUPABASE_ANON_KEY;
  return { url, anonKey };
};

export const isSupabaseConfigured = (): boolean =>
  Boolean(resolveSupabaseConfig().url && resolveSupabaseConfig().anonKey);

export const getSupabaseClient = (): SupabaseClient => {
  const { url, anonKey } = resolveSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error('Supabase config values are missing.');
  }

  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  return client;
};
