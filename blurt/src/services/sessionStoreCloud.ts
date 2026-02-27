import { Session, SessionNote, SESSION_SCHEMA_VERSION } from '../types/session';
import { authService } from './authService';
import { getSupabaseClient } from './supabaseClient';

type SessionRow = {
  id: string;
  user_id: string;
  schema_version: number | null;
  title: string;
  prompt: string | null;
  duration_sec: number;
  started_at_ms: number;
  ended_at_ms: number | null;
  notes: SessionNote[] | null;
  updated_at_ms: number;
};

const toSession = (row: SessionRow): Session => ({
  id: row.id,
  schemaVersion: row.schema_version ?? SESSION_SCHEMA_VERSION,
  title: row.title,
  prompt: row.prompt ?? undefined,
  durationSec: row.duration_sec,
  startedAtMs: row.started_at_ms,
  endedAtMs: row.ended_at_ms ?? undefined,
  notes: row.notes ?? []
});

const toRow = (session: Session, userId: string): SessionRow => ({
  id: session.id,
  user_id: userId,
  schema_version: session.schemaVersion ?? SESSION_SCHEMA_VERSION,
  title: session.title,
  prompt: session.prompt ?? null,
  duration_sec: session.durationSec,
  started_at_ms: session.startedAtMs,
  ended_at_ms: session.endedAtMs ?? null,
  notes: session.notes,
  updated_at_ms: Date.now()
});

const requireUserId = async (): Promise<string> => {
  const user = await authService.getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated.');
  }
  return user.id;
};

export const sessionStoreCloud = {
  async save(session: Session): Promise<void> {
    const supabase = getSupabaseClient();
    const userId = await requireUserId();
    const { error } = await supabase.from('sessions').upsert(toRow(session, userId), { onConflict: 'id' });
    if (error) {
      throw error;
    }
  },

  async list(): Promise<Session[]> {
    const supabase = getSupabaseClient();
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at_ms', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => toSession(row as SessionRow));
  },

  async get(id: string): Promise<Session | null> {
    const supabase = getSupabaseClient();
    const userId = await requireUserId();
    const { data, error } = await supabase.from('sessions').select('*').eq('user_id', userId).eq('id', id).maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return toSession(data as SessionRow);
  }
};
