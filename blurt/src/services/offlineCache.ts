import { Session } from '../types/session';
import { SessionTemplate } from '../types/template';

const SESSION_CACHE_PREFIX = 'blurt:cache:sessions:';
const TEMPLATE_CACHE_PREFIX = 'blurt:cache:templates:';
const LAST_USER_ID_KEY = 'blurt:cache:last-user-id';

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const getSessionKey = (userId: string) => `${SESSION_CACHE_PREFIX}${userId}`;
const getTemplateKey = (userId: string) => `${TEMPLATE_CACHE_PREFIX}${userId}`;

const getLastUserId = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(LAST_USER_ID_KEY);
};

const setLastUserId = (userId: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(LAST_USER_ID_KEY, userId);
};

export const offlineCache = {
  getLastUserId,

  cacheSessions(userId: string, sessions: Session[]): void {
    if (typeof window === 'undefined') {
      return;
    }
    setLastUserId(userId);
    window.localStorage.setItem(getSessionKey(userId), JSON.stringify(sessions));
  },

  readSessions(userId: string | null): Session[] {
    if (typeof window === 'undefined' || !userId) {
      return [];
    }
    return safeParse<Session[]>(window.localStorage.getItem(getSessionKey(userId)), []);
  },

  cacheTemplates(userId: string, templates: SessionTemplate[]): void {
    if (typeof window === 'undefined') {
      return;
    }
    setLastUserId(userId);
    window.localStorage.setItem(getTemplateKey(userId), JSON.stringify(templates));
  },

  readTemplates(userId: string | null): SessionTemplate[] {
    if (typeof window === 'undefined' || !userId) {
      return [];
    }
    return safeParse<SessionTemplate[]>(window.localStorage.getItem(getTemplateKey(userId)), []);
  }
};
