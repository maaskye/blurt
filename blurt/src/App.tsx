import { useEffect, useState } from 'react';
import { BlurtView } from './components/BlurtView';
import { ReviewView } from './components/ReviewView';
import { SessionSetupView } from './components/SessionSetupView';
import { sessionStore } from './services/sessionStore';
import { Session, SessionSummary } from './types/session';

type View = 'setup' | 'blurt' | 'review';

const emptySummary: SessionSummary = { totalNotes: 0, totalWords: 0, notesPerMinute: 0 };

function App() {
  const [view, setView] = useState<View>('setup');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [summary, setSummary] = useState<SessionSummary>(emptySummary);

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

  return (
    <main>
      {view === 'setup' && (
        <>
          <SessionSetupView onStart={startSession} />
          <section className="history">
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
        </>
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
