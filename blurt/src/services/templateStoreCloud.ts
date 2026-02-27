import { SessionTemplate } from '../types/template';
import { authService } from './authService';
import { getSupabaseClient } from './supabaseClient';

type TemplateRow = {
  id: string;
  user_id: string;
  name: string;
  title_default: string;
  prompt_default: string | null;
  duration_sec_default: number;
  updated_at_ms: number;
};

const toTemplate = (row: TemplateRow): SessionTemplate => ({
  id: row.id,
  name: row.name,
  titleDefault: row.title_default,
  promptDefault: row.prompt_default ?? undefined,
  durationSecDefault: row.duration_sec_default,
  updatedAtMs: row.updated_at_ms
});

const toRow = (template: SessionTemplate, userId: string): TemplateRow => ({
  id: template.id,
  user_id: userId,
  name: template.name,
  title_default: template.titleDefault,
  prompt_default: template.promptDefault ?? null,
  duration_sec_default: template.durationSecDefault,
  updated_at_ms: Date.now()
});

const requireUserId = async (): Promise<string> => {
  const user = await authService.getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated.');
  }
  return user.id;
};

export const templateStoreCloud = {
  async list(): Promise<SessionTemplate[]> {
    const supabase = getSupabaseClient();
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at_ms', { ascending: false });

    if (error) {
      throw error;
    }
    return (data ?? []).map((row) => toTemplate(row as TemplateRow));
  },

  async save(template: SessionTemplate): Promise<void> {
    const supabase = getSupabaseClient();
    const userId = await requireUserId();
    const { error } = await supabase.from('templates').upsert(toRow(template, userId), { onConflict: 'id' });
    if (error) {
      throw error;
    }
  },

  async remove(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const userId = await requireUserId();
    const { error } = await supabase.from('templates').delete().eq('user_id', userId).eq('id', id);
    if (error) {
      throw error;
    }
  }
};
