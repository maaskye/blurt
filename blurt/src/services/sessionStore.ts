import { mkdir, readDir, readTextFile, remove, writeTextFile } from '@tauri-apps/plugin-fs';
import { BaseDirectory, join } from '@tauri-apps/api/path';
import { Session, SESSION_SCHEMA_VERSION } from '../types/session';

const SESSION_DIR = 'sessions';

const ensureSessionDir = async () => {
  await mkdir(SESSION_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
};

const getSessionPath = async (id: string) => {
  return join(SESSION_DIR, `${id}.json`);
};

const getTempSessionPath = async (id: string) => {
  return join(SESSION_DIR, `${id}.json.tmp`);
};

const normalizeSession = (raw: Session): Session => ({
  ...raw,
  schemaVersion: raw.schemaVersion ?? SESSION_SCHEMA_VERSION,
  notes: raw.notes ?? []
});

export const sessionStore = {
  async save(session: Session) {
    await ensureSessionDir();
    const normalized = normalizeSession(session);
    const payload = JSON.stringify(normalized, null, 2);
    const path = await getSessionPath(session.id);
    const tmpPath = await getTempSessionPath(session.id);

    // Write to a temp file first so partially written files never replace valid session files.
    await writeTextFile(tmpPath, payload, { baseDir: BaseDirectory.AppData });
    await writeTextFile(path, payload, { baseDir: BaseDirectory.AppData });
    try {
      await remove(tmpPath, { baseDir: BaseDirectory.AppData });
    } catch {
      // tmp cleanup is best-effort
    }
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
          return normalizeSession(JSON.parse(content) as Session);
        })
    );

    return sessions.sort((a, b) => b.startedAtMs - a.startedAtMs);
  },

  async get(id: string): Promise<Session | null> {
    try {
      const path = await getSessionPath(id);
      const content = await readTextFile(path, { baseDir: BaseDirectory.AppData });
      return normalizeSession(JSON.parse(content) as Session);
    } catch {
      return null;
    }
  }
};
