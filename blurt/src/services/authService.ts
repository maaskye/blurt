import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseClient';

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
};

const toAuthUser = (user: User | null): AuthUser | null => {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null
  };
};

export const authService = {
  async signInWithPassword(email: string, password: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      throw error;
    }
  },

  async signUpWithPassword(email: string, password: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) {
      throw error;
    }
    if (!data.session) {
      throw new Error('Account created. Confirm email in Supabase flow, then sign in.');
    }
  },

  async sendMagicLink(email: string): Promise<void> {
    const supabase = getSupabaseClient();
    const redirectTo = import.meta.env.VITE_SUPABASE_REDIRECT_URL ?? 'blurt://auth/callback';
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo
      }
    });
    if (error) {
      throw error;
    }
  },

  async verifyEmailCode(email: string, token: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    if (error) {
      throw error;
    }
  },

  async sendPhoneCode(phone: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: true
      }
    });
    if (error) {
      throw error;
    }
  },

  async verifyPhoneCode(phone: string, token: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
    if (error) {
      throw error;
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      throw error;
    }
    return toAuthUser(data.user);
  },

  async signOut(): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  },

  onAuthStateChange(
    handler: (event: AuthChangeEvent, user: AuthUser | null, session: Session | null) => void
  ): () => void {
    const supabase = getSupabaseClient();
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      handler(event, toAuthUser(session?.user ?? null), session);
    });
    return () => subscription.unsubscribe();
  }
};
