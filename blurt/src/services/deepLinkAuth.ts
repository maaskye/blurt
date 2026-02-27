import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

const isTauriRuntime = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const parseUrlParams = (rawUrl: string): URLSearchParams => {
  const parsed = new URL(rawUrl);
  const params = new URLSearchParams(parsed.search);
  if (parsed.hash.startsWith('#')) {
    const hashParams = new URLSearchParams(parsed.hash.slice(1));
    hashParams.forEach((value, key) => {
      if (!params.has(key)) {
        params.set(key, value);
      }
    });
  }
  return params;
};

export const completeAuthFromUrl = async (rawUrl: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  const params = parseUrlParams(rawUrl);
  const supabase = getSupabaseClient();

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    if (error) {
      throw error;
    }
    return;
  }

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }
    return;
  }

  const tokenHash = params.get('token_hash');
  if (tokenHash) {
    const type = params.get('type') ?? 'magiclink';
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'magiclink' | 'recovery' | 'invite' | 'email_change' | 'email'
    });
    if (error) {
      throw error;
    }
  }
};

export const initDeepLinkAuth = async (): Promise<(() => void) | undefined> => {
  if (!isTauriRuntime() || !isSupabaseConfigured()) {
    return undefined;
  }

  const { getCurrent, onOpenUrl } = await import('@tauri-apps/plugin-deep-link');

  try {
    const current = await getCurrent();
    if (current && current.length > 0) {
      for (const url of current) {
        await completeAuthFromUrl(url);
      }
    }
  } catch (error) {
    console.warn('[deepLinkAuth] failed to process current URLs', error);
  }

  const unlisten = await onOpenUrl((urls) => {
    void (async () => {
      for (const url of urls) {
        try {
          await completeAuthFromUrl(url);
        } catch (error) {
          console.warn('[deepLinkAuth] failed to process URL', { url, error });
        }
      }
    })();
  });

  return unlisten;
};
