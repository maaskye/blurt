import { mkdir, readDir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { BaseDirectory, join } from '@tauri-apps/api/path';
import { Session } from '../types/session';

const SESSION_DIR = 'sessions';

const ensureSessionDir = async () => {
  await mkdir(SESSION_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
};

const getSessionPath = async (id: string) => {
  return join(SESSION_DIR, `${id}.json`);
};

export const sessionStore = {
  async save(session: Session) {
    await ensureSessionDir();
    const path = await getSessionPath(session.id);
    await writeTextFile(path, JSON.stringify(session, null, 2), { baseDir: BaseDirectory.AppData });
  },

  async list(): Promise<Session[]> {
    await ensureSessionDir();
    const entries = await readDir(SESSION_DIR, { baseDir: BaseDirectory.AppData });
    const sessions = await Promise.all(
      entries
        .filter((entry) => entry.name?.endsWith('.json'))
        .map(async (entry) => {
          const path = await join(SESSION_DIR, entry.name ?? '');
          const content = await readTextFile(path, { baseDir: BaseDirectory.AppData });
          return JSON.parse(content) as Session;
        })
    );

    return sessions.sort((a, b) => b.startedAtMs - a.startedAtMs);
  },

  async get(id: string): Promise<Session | null> {
    try {
      const path = await getSessionPath(id);
      const content = await readTextFile(path, { baseDir: BaseDirectory.AppData });
      return JSON.parse(content) as Session;
    } catch {
      return null;
    }
  }
};
