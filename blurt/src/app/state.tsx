import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService, AuthUser } from '../services/authService';
import { offlineCache } from '../services/offlineCache';
import { sessionStore } from '../services/sessionStore';
import { sessionStoreCloud } from '../services/sessionStoreCloud';
import { getStorageMode, isCloudBackedMode, StorageMode } from '../services/storageMode';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { templateStore } from '../services/templateStore';
import { templateStoreCloud } from '../services/templateStoreCloud';
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
  authRequired: boolean;
  authEnabled: boolean;
  authLoading: boolean;
  authUser: AuthUser | null;
  isOnline: boolean;
  offlineReadOnly: boolean;
  storageMode: StorageMode;
  authStatusMessage: string | null;
  clearStatusMessage: () => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  verifyEmailCode: (email: string, token: string) => Promise<void>;
  sendPhoneCode: (phone: string) => Promise<void>;
  verifyPhoneCode: (phone: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AppStateContext = createContext<AppStateValue | null>(null);

const computeSortTs = (session: Session) => session.endedAtMs ?? session.startedAtMs;
const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return fallback;
};

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
  const storageMode = getStorageMode();
  const authRequired = isCloudBackedMode(storageMode);
  const authEnabled = authRequired ? isSupabaseConfigured() : false;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(authRequired && authEnabled);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [authStatusMessage, setAuthStatusMessage] = useState<string | null>(null);

  const cloudActive = authRequired && authEnabled;
  const cloudWritable = cloudActive && Boolean(authUser) && isOnline;
  const offlineReadOnly = cloudActive && !cloudWritable;

  const clearStatusMessage = useCallback(() => {
    setAuthStatusMessage(null);
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (!cloudActive) {
      setAuthLoading(false);
      return;
    }

    let active = true;

    void authService
      .getCurrentUser()
      .then((user) => {
        if (!active) {
          return;
        }
        setAuthUser(user);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setAuthStatusMessage(`Auth check failed: ${extractErrorMessage(error, 'Unable to verify account session.')}`);
      })
      .finally(() => {
        if (active) {
          setAuthLoading(false);
        }
      });

    const unsubscribe = authService.onAuthStateChange((_event, user) => {
      if (!active) {
        return;
      }
      setAuthUser(user);
      setAuthLoading(false);
      if (user) {
        setAuthStatusMessage(null);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [cloudActive]);

  const refreshSessions = useCallback(async () => {
    try {
      if (!cloudActive) {
        const next = await sessionStore.list();
        setSessions(next);
        return;
      }

      if (!cloudWritable) {
        const cacheUserId = authUser?.id ?? offlineCache.getLastUserId();
        setSessions(offlineCache.readSessions(cacheUserId));
        return;
      }

      const next = await sessionStoreCloud.list();
      setSessions(next);
      if (authUser) {
        offlineCache.cacheSessions(authUser.id, next);
      }
    } catch (error) {
      const cacheUserId = authUser?.id ?? offlineCache.getLastUserId();
      setSessions(offlineCache.readSessions(cacheUserId));
      if (cloudActive) {
        setAuthStatusMessage(`Session sync failed: ${extractErrorMessage(error, 'Unable to load cloud sessions.')}`);
      } else {
        setAuthStatusMessage(`Local session load failed: ${extractErrorMessage(error, 'Unable to load local sessions.')}`);
      }
    }
  }, [authUser, cloudActive, cloudWritable]);

  const refreshTemplates = useCallback(async () => {
    try {
      if (!cloudActive) {
        const next = await templateStore.list();
        setTemplates(next);
        return;
      }

      if (!cloudWritable) {
        const cacheUserId = authUser?.id ?? offlineCache.getLastUserId();
        setTemplates(offlineCache.readTemplates(cacheUserId));
        return;
      }

      const next = await templateStoreCloud.list();
      setTemplates(next);
      if (authUser) {
        offlineCache.cacheTemplates(authUser.id, next);
      }
    } catch (error) {
      const cacheUserId = authUser?.id ?? offlineCache.getLastUserId();
      setTemplates(offlineCache.readTemplates(cacheUserId));
      if (cloudActive) {
        setAuthStatusMessage(`Template sync failed: ${extractErrorMessage(error, 'Unable to load cloud templates.')}`);
      } else {
        setAuthStatusMessage(`Local template load failed: ${extractErrorMessage(error, 'Unable to load local templates.')}`);
      }
    }
  }, [authUser, cloudActive, cloudWritable]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (cloudActive && authLoading) {
        return;
      }
      await Promise.all([refreshSessions(), refreshTemplates()]);
      if (mounted) {
        setLoading(false);
      }
    };
    void init();
    return () => {
      mounted = false;
    };
  }, [authLoading, cloudActive, refreshSessions, refreshTemplates]);

  const persistSession = useCallback(
    async (session: Session): Promise<void> => {
      if (!cloudActive) {
        await sessionStore.save(session);
        return;
      }

      if (!cloudWritable) {
        setAuthStatusMessage('Cloud is read-only right now. Reconnect and sign in to save changes.');
        return;
      }

      await sessionStoreCloud.save(session);
      if (storageMode === 'hybrid') {
        try {
          await sessionStore.save(session);
        } catch {
          // Mirror save is best-effort only.
        }
      }
    },
    [cloudActive, cloudWritable, storageMode]
  );

  const startSession = useCallback(
    async (payload: StartPayload) => {
      if (cloudActive && !cloudWritable) {
        const message = 'Cloud sync is unavailable while offline or signed out.';
        setAuthStatusMessage(message);
        throw new Error(message);
      }

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
        await persistSession(session);
        if (cloudActive && authUser) {
          offlineCache.cacheSessions(authUser.id, [session, ...sessions.filter((item) => item.id !== session.id)]);
        }
        await refreshSessions();
      } catch (error) {
        setAuthStatusMessage(`Session save failed: ${extractErrorMessage(error, 'Unknown error.')}`);
      }

      return session;
    },
    [authUser, cloudActive, cloudWritable, persistSession, refreshSessions, sessions]
  );

  const saveSession = useCallback(
    async (session: Session) => {
      setSessions((prev) =>
        [session, ...prev.filter((item) => item.id !== session.id)].sort((a, b) => computeSortTs(b) - computeSortTs(a))
      );
      try {
        await persistSession(session);
        await refreshSessions();
      } catch (error) {
        setAuthStatusMessage(`Session sync failed: ${extractErrorMessage(error, 'Unknown error.')}`);
      }
    },
    [persistSession, refreshSessions]
  );

  const getSession = useCallback(
    async (id: string) => {
      const existing = sessions.find((session) => session.id === id);
      if (existing) {
        return existing;
      }

      if (cloudActive && !cloudWritable) {
        const cacheUserId = authUser?.id ?? offlineCache.getLastUserId();
        return offlineCache.readSessions(cacheUserId).find((session) => session.id === id) ?? null;
      }

      try {
        if (cloudActive) {
          return await sessionStoreCloud.get(id);
        }
        return await sessionStore.get(id);
      } catch {
        return null;
      }
    },
    [authUser, cloudActive, cloudWritable, sessions]
  );

  const persistTemplate = useCallback(
    async (template: SessionTemplate): Promise<void> => {
      if (!cloudActive) {
        await templateStore.save(template);
        return;
      }

      if (!cloudWritable) {
        setAuthStatusMessage('Cloud is read-only right now. Reconnect and sign in to save templates.');
        return;
      }

      await templateStoreCloud.save(template);
      if (storageMode === 'hybrid') {
        try {
          await templateStore.save(template);
        } catch {
          // Mirror save is best-effort only.
        }
      }
    },
    [cloudActive, cloudWritable, storageMode]
  );

  const saveTemplate = useCallback(
    async (payload: TemplatePayload) => {
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
        await persistTemplate(nextTemplate);
        await refreshTemplates();
      } catch (error) {
        setAuthStatusMessage(`Template save failed: ${extractErrorMessage(error, 'Unknown error.')}`);
      }
    },
    [persistTemplate, refreshTemplates]
  );

  const updateTemplate = useCallback(
    async (id: string, payload: TemplatePayload) => {
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
        await persistTemplate(nextTemplate);
        await refreshTemplates();
      } catch (error) {
        setAuthStatusMessage(`Template update failed: ${extractErrorMessage(error, 'Unknown error.')}`);
      }
    },
    [persistTemplate, refreshTemplates]
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      setTemplates((prev) => prev.filter((item) => item.id !== id));

      try {
        if (!cloudActive) {
          await templateStore.remove(id);
        } else if (!cloudWritable) {
          setAuthStatusMessage('Cloud is read-only right now. Reconnect and sign in to delete templates.');
          return;
        } else {
          await templateStoreCloud.remove(id);
          if (storageMode === 'hybrid') {
            try {
              await templateStore.remove(id);
            } catch {
              // Mirror delete is best-effort only.
            }
          }
        }

        await refreshTemplates();
      } catch (error) {
        setAuthStatusMessage(`Template delete failed: ${extractErrorMessage(error, 'Unknown error.')}`);
      }
    },
    [cloudActive, cloudWritable, refreshTemplates, storageMode]
  );

  const sendMagicLink = useCallback(async (email: string): Promise<void> => {
    if (!cloudActive) {
      throw new Error('Auth is disabled in local storage mode.');
    }
    await authService.sendMagicLink(email);
  }, [cloudActive]);

  const verifyEmailCode = useCallback(async (email: string, token: string): Promise<void> => {
    if (!cloudActive) {
      throw new Error('Auth is disabled in local storage mode.');
    }
    await authService.verifyEmailCode(email, token);
  }, [cloudActive]);

  const sendPhoneCode = useCallback(async (phone: string): Promise<void> => {
    if (!cloudActive) {
      throw new Error('Auth is disabled in local storage mode.');
    }
    await authService.sendPhoneCode(phone);
  }, [cloudActive]);

  const verifyPhoneCode = useCallback(async (phone: string, token: string): Promise<void> => {
    if (!cloudActive) {
      throw new Error('Auth is disabled in local storage mode.');
    }
    await authService.verifyPhoneCode(phone, token);
  }, [cloudActive]);

  const signInWithPassword = useCallback(async (email: string, password: string): Promise<void> => {
    if (!cloudActive) {
      throw new Error('Auth is disabled in local storage mode.');
    }
    await authService.signInWithPassword(email, password);
  }, [cloudActive]);

  const signUpWithPassword = useCallback(async (email: string, password: string): Promise<void> => {
    if (!cloudActive) {
      throw new Error('Auth is disabled in local storage mode.');
    }
    await authService.signUpWithPassword(email, password);
  }, [cloudActive]);

  const signOut = useCallback(async (): Promise<void> => {
    if (!cloudActive) {
      return;
    }
    await authService.signOut();
  }, [cloudActive]);

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
      refreshTemplates,
      authRequired,
      authEnabled,
      authLoading,
      authUser,
      isOnline,
      offlineReadOnly,
      storageMode,
      authStatusMessage,
      clearStatusMessage,
      signInWithPassword,
      signUpWithPassword,
      sendMagicLink,
      verifyEmailCode,
      sendPhoneCode,
      verifyPhoneCode,
      signOut
    }),
    [
      authEnabled,
      authLoading,
      authRequired,
      authStatusMessage,
      authUser,
      clearStatusMessage,
      deleteTemplate,
      getSession,
      isOnline,
      latestSession,
      loading,
      offlineReadOnly,
      refreshSessions,
      refreshTemplates,
      saveSession,
      saveTemplate,
      signInWithPassword,
      signUpWithPassword,
      sendMagicLink,
      verifyEmailCode,
      sendPhoneCode,
      verifyPhoneCode,
      sessions,
      signOut,
      startSession,
      storageMode,
      templates,
      updateTemplate
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
