import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { sessionStore } from '../services/sessionStore';
import { templateStore } from '../services/templateStore';
import { Session, SESSION_SCHEMA_VERSION, SessionSummary } from '../types/session';
import { SessionTemplate } from '../types/template';

type StartPayload = {
  title: string;
  prompt?: string;
  durationSec: number;
};

type TemplatePayload = {
  name: string;
  titleDefault: string;
  promptDefault?: string;
  durationSecDefault: number;
};

type AppStateValue = {
  sessions: Session[];
  templates: SessionTemplate[];
  latestSession: Session | null;
  loading: boolean;
  startSession: (payload: StartPayload) => Promise<Session>;
  saveSession: (session: Session) => Promise<void>;
  getSession: (id: string) => Promise<Session | null>;
  refreshSessions: () => Promise<void>;
  saveTemplate: (payload: TemplatePayload) => Promise<void>;
  updateTemplate: (id: string, payload: TemplatePayload) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  refreshTemplates: () => Promise<void>;
};

const AppStateContext = createContext<AppStateValue | null>(null);

const computeSortTs = (session: Session) => session.endedAtMs ?? session.startedAtMs;

export const computeSummary = (session: Session): SessionSummary => {
  const totalNotes = session.notes.length;
  const totalWords = session.notes.reduce((sum, note) => sum + note.text.split(/\s+/).filter(Boolean).length, 0);
  return {
    totalNotes,
    totalWords,
    notesPerMinute: Number((totalNotes / (session.durationSec / 60)).toFixed(2))
  };
};

export const formatRemaining = (session: Session) => {
  if (session.endedAtMs) {
    return 'Finished';
  }
  const elapsedSec = Math.floor((Date.now() - session.startedAtMs) / 1000);
  const remaining = Math.max(0, session.durationSec - elapsedSec);
  const min = Math.floor(remaining / 60)
    .toString()
    .padStart(2, '0');
  const sec = (remaining % 60).toString().padStart(2, '0');
  return `${min}:${sec} left`;
};

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSessions = useCallback(async () => {
    try {
      const next = await sessionStore.list();
      setSessions(next);
    } catch {
      // Browser/dev contexts without Tauri FS should still work using in-memory state.
    }
  }, []);

  const refreshTemplates = useCallback(async () => {
    try {
      const next = await templateStore.list();
      setTemplates(next);
    } catch {
      // Browser/dev contexts without Tauri FS should still work using in-memory state.
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      await Promise.all([refreshSessions(), refreshTemplates()]);
      if (mounted) {
        setLoading(false);
      }
    };
    void init();
    return () => {
      mounted = false;
    };
  }, [refreshSessions, refreshTemplates]);

  const startSession = useCallback(async (payload: StartPayload) => {
    const session: Session = {
      id: crypto.randomUUID(),
      schemaVersion: SESSION_SCHEMA_VERSION,
      title: payload.title,
      prompt: payload.prompt,
      durationSec: payload.durationSec,
      startedAtMs: Date.now(),
      notes: []
    };
    setSessions((prev) => [session, ...prev].sort((a, b) => computeSortTs(b) - computeSortTs(a)));
    try {
      await sessionStore.save(session);
      await refreshSessions();
    } catch {
      // Keep optimistic in-memory state when FS persistence is unavailable.
    }
    return session;
  }, [refreshSessions]);

  const saveSession = useCallback(async (session: Session) => {
    setSessions((prev) =>
      [session, ...prev.filter((item) => item.id !== session.id)].sort((a, b) => computeSortTs(b) - computeSortTs(a))
    );
    try {
      await sessionStore.save(session);
      await refreshSessions();
    } catch {
      // Keep optimistic in-memory state when FS persistence is unavailable.
    }
  }, [refreshSessions]);

  const getSession = useCallback(async (id: string) => {
    const existing = sessions.find((session) => session.id === id);
    if (existing) {
      return existing;
    }
    try {
      return await sessionStore.get(id);
    } catch {
      return null;
    }
  }, [sessions]);

  const saveTemplate = useCallback(async (payload: TemplatePayload) => {
    const nextTemplate: SessionTemplate = {
      id: crypto.randomUUID(),
      name: payload.name,
      titleDefault: payload.titleDefault,
      promptDefault: payload.promptDefault,
      durationSecDefault: payload.durationSecDefault,
      updatedAtMs: Date.now()
    };
    setTemplates((prev) => [nextTemplate, ...prev.filter((item) => item.id !== nextTemplate.id)]);
    try {
      await templateStore.save(nextTemplate);
      await refreshTemplates();
    } catch {
      // Keep optimistic in-memory state when FS persistence is unavailable.
    }
  }, [refreshTemplates]);

  const updateTemplate = useCallback(async (id: string, payload: TemplatePayload) => {
    const nextTemplate: SessionTemplate = {
      id,
      name: payload.name,
      titleDefault: payload.titleDefault,
      promptDefault: payload.promptDefault,
      durationSecDefault: payload.durationSecDefault,
      updatedAtMs: Date.now()
    };
    setTemplates((prev) =>
      [nextTemplate, ...prev.filter((item) => item.id !== id)].sort((a, b) => b.updatedAtMs - a.updatedAtMs)
    );
    try {
      await templateStore.save(nextTemplate);
      await refreshTemplates();
    } catch {
      // Keep optimistic in-memory state when FS persistence is unavailable.
    }
  }, [refreshTemplates]);

  const deleteTemplate = useCallback(async (id: string) => {
    setTemplates((prev) => prev.filter((item) => item.id !== id));
    try {
      await templateStore.remove(id);
      await refreshTemplates();
    } catch {
      // Keep optimistic in-memory state when FS persistence is unavailable.
    }
  }, [refreshTemplates]);

  const latestSession = useMemo(() => {
    if (sessions.length === 0) {
      return null;
    }
    return [...sessions].sort((a, b) => computeSortTs(b) - computeSortTs(a))[0];
  }, [sessions]);

  const value = useMemo<AppStateValue>(
    () => ({
      sessions,
      templates,
      latestSession,
      loading,
      startSession,
      saveSession,
      getSession,
      refreshSessions,
      saveTemplate,
      updateTemplate,
      deleteTemplate,
      refreshTemplates
    }),
    [
      sessions,
      templates,
      latestSession,
      loading,
      startSession,
      saveSession,
      getSession,
      refreshSessions,
      saveTemplate,
      updateTemplate,
      deleteTemplate,
      refreshTemplates
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};
