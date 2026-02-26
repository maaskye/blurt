import { readTextFile, remove, writeTextFile } from '@tauri-apps/plugin-fs';
import { BaseDirectory } from '@tauri-apps/api/path';
import { SessionTemplate } from '../types/template';

const TEMPLATE_FILE = 'templates.json';
const TEMPLATE_TMP_FILE = 'templates.json.tmp';

type TemplateFileSchema = {
  templates: SessionTemplate[];
};

const writeTemplatesAtomically = async (templates: SessionTemplate[]) => {
  const payload = JSON.stringify({ templates }, null, 2);
  await writeTextFile(TEMPLATE_TMP_FILE, payload, { baseDir: BaseDirectory.AppData });
  await writeTextFile(TEMPLATE_FILE, payload, { baseDir: BaseDirectory.AppData });
  try {
    await remove(TEMPLATE_TMP_FILE, { baseDir: BaseDirectory.AppData });
  } catch {
    // tmp cleanup is best-effort
  }
};

const readTemplatesSchema = async (): Promise<TemplateFileSchema> => {
  try {
    const content = await readTextFile(TEMPLATE_FILE, { baseDir: BaseDirectory.AppData });
    const parsed = JSON.parse(content) as Partial<TemplateFileSchema>;
    return {
      templates: (parsed.templates ?? [])
        .filter((template) => Boolean(template?.id))
        .map((template) => ({
          id: template.id!,
          name: template.name ?? 'Template',
          titleDefault: template.titleDefault ?? '',
          promptDefault: template.promptDefault ?? undefined,
          durationSecDefault: template.durationSecDefault ?? 300,
          updatedAtMs: template.updatedAtMs ?? Date.now()
        }))
    };
  } catch {
    return { templates: [] };
  }
};

export const templateStore = {
  async list(): Promise<SessionTemplate[]> {
    const data = await readTemplatesSchema();
    return [...data.templates].sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  },

  async save(template: SessionTemplate): Promise<void> {
    const data = await readTemplatesSchema();
    const next = data.templates.filter((item) => item.id !== template.id);
    next.push(template);
    await writeTemplatesAtomically(next);
  },

  async remove(id: string): Promise<void> {
    const data = await readTemplatesSchema();
    const next = data.templates.filter((item) => item.id !== id);
    await writeTemplatesAtomically(next);
  }
};
