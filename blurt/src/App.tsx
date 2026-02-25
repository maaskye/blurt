import { useEffect, useMemo, useState } from 'react';
import { BlurtView } from './components/BlurtView';
import { ReviewView } from './components/ReviewView';
import { SessionSetupView } from './components/SessionSetupView';
import { sessionStore } from './services/sessionStore';
import { Session, SessionSummary } from './types/session';

type View = 'setup' | 'blurt' | 'review';

const emptySummary: SessionSummary = { totalNotes: 0, totalWords: 0, notesPerMinute: 0 };

const formatRemaining = (session: Session) => {
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

function App() {
  const [view, setView] = useState<View>('setup');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [summary, setSummary] = useState<SessionSummary>(emptySummary);
  const [sidebarLogoErrored, setSidebarLogoErrored] = useState(false);

  const refreshSessions = async () => {
    const nextSessions = await sessionStore.list();
    setSessions(nextSessions);
  };

  useEffect(() => {
    void refreshSessions();
  }, []);

  const startSession = ({ title, prompt, durationSec }: { title: string; prompt?: string; durationSec: number }) => {
    const session: Session = {
      id: crypto.randomUUID(),
      title,
      prompt,
      durationSec,
      startedAtMs: Date.now(),
      notes: []
    };

    setActiveSession(session);
    setSummary(emptySummary);
    setView('blurt');
  };

  const onSessionChange = async (nextSession: Session) => {
    setActiveSession(nextSession);
    await sessionStore.save(nextSession);
    await refreshSessions();
  };

  const openSession = (session: Session) => {
    const totalWords = session.notes.reduce((sum, note) => sum + note.text.split(/\s+/).filter(Boolean).length, 0);
    setSummary({
      totalNotes: session.notes.length,
      totalWords,
      notesPerMinute: Number((session.notes.length / (session.durationSec / 60)).toFixed(2))
    });
    setActiveSession(session);
    setView('review');
  };

  const latestSession = useMemo(
    () =>
      [...sessions].sort((a, b) => {
        const aSort = a.endedAtMs ?? a.startedAtMs;
        const bSort = b.endedAtMs ?? b.startedAtMs;
        return bSort - aSort;
      })[0],
    [sessions]
  );

  const continueLatest = () => {
    if (!latestSession) {
      return;
    }
    if (latestSession.endedAtMs) {
      openSession(latestSession);
      return;
    }
    setActiveSession(latestSession);
    setSummary(emptySummary);
    setView('blurt');
  };

  return (
    <main>
      {view === 'setup' && (
        <div className="home-layout">
          <aside className="home-sidebar">
            <div className="sidebar-brand">
              <button type="button" className="sidebar-menu-toggle" aria-label="Menu">
                ☰
              </button>
              {!sidebarLogoErrored ? (
                <img
                  className="sidebar-logo"
                  src="/branding/blurt-logo.svg"
                  alt="blurt."
                  onError={() => setSidebarLogoErrored(true)}
                />
              ) : (
                <span className="sidebar-logo-fallback">blurt.</span>
              )}
            </div>

            <nav className="sidebar-nav" aria-label="Main navigation">
              <button className="sidebar-item sidebar-item--active" type="button">
                <span>🏠</span>
                <span>Home</span>
              </button>
              <button className="sidebar-item" type="button">
                <span>🗂️</span>
                <span>Your Library</span>
              </button>
              <button className="sidebar-item" type="button">
                <span>👥</span>
                <span>Collaborate</span>
              </button>
              <button className="sidebar-item" type="button">
                <span>🔔</span>
                <span>Notifications</span>
              </button>
            </nav>

            <div className="sidebar-group">
              <h3>Your Folders</h3>
              <button className="sidebar-item sidebar-item--folder" type="button">
                <span>📁</span>
                <span>+ Add New</span>
              </button>
            </div>

            <div className="sidebar-footer">
              <button className="sidebar-avatar-btn" type="button">
                👤
                <span>Profile</span>
              </button>
              <button className="sidebar-avatar-btn" type="button">
                ⚙️
                <span>Settings</span>
              </button>
            </div>
          </aside>

          <section className="home-main">
            <h2 className="home-panel-title">Recents</h2>
            {latestSession ? (
              <article className="recents-card">
                <div className="recents-header">
                  <h3>{latestSession.title}</h3>
                  <span>{formatRemaining(latestSession)}</span>
                </div>
                <p className="recents-topic">{latestSession.prompt || 'No prompt provided'}</p>
                <div className="recents-meta">
                  <strong>{latestSession.notes.length} Blurts</strong>
                  <button className="recents-cta" type="button" onClick={continueLatest}>
                    Continue
                  </button>
                </div>
              </article>
            ) : (
              <article className="recents-card recents-card--empty">
                <h3>No sessions yet</h3>
                <p>Start your first quick session on the right.</p>
              </article>
            )}

            <div className="quick-grid-panel">
              <div className="quick-grid-plus">+</div>
              <div className="quick-grid-divider" />
              <div className="quick-grid">
                {Array.from({ length: 8 }, (_, index) => (
                  <button key={index} className="quick-grid-tile" type="button" aria-label={`Quick action ${index + 1}`}>
                    ↗
                  </button>
                ))}
              </div>
            </div>

            <section className="history history--home">
              <h3>Past Sessions</h3>
              {sessions.length === 0 && <p>No sessions yet.</p>}
              {sessions.map((session) => (
                <button key={session.id} className="history-item" onClick={() => openSession(session)}>
                  <strong>{session.title}</strong>
                  <span>{new Date(session.startedAtMs).toLocaleString()}</span>
                  <span>{session.notes.length} notes</span>
                </button>
              ))}
            </section>
          </section>

          <aside className="home-quickstart">
            <SessionSetupView onStart={startSession} variant="compact" />
          </aside>
        </div>
      )}

      {view === 'blurt' && activeSession && (
        <BlurtView
          session={activeSession}
          onSessionChange={onSessionChange}
          onFinish={(nextSummary) => {
            setSummary(nextSummary);
            setView('review');
          }}
        />
      )}

      {view === 'review' && activeSession && (
        <ReviewView
          session={activeSession}
          summary={summary}
          onBack={() => setView('setup')}
          onSave={(session) => {
            void onSessionChange(session);
          }}
        />
      )}
    </main>
  );
}

export default App;
