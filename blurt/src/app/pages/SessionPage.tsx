import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BlurtView } from '../../components/BlurtView';
import { useAppState } from '../state';
import { Session, SessionSummary } from '../../types/session';

const emptySummary: SessionSummary = { totalNotes: 0, totalWords: 0, notesPerMinute: 0 };

export const SessionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getSession, saveSession } = useAppState();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    void (async () => {
      const next = await getSession(id);
      if (!next) {
        navigate('/');
        return;
      }
      setSession(next);
      if (next.endedAtMs) {
        navigate(`/session/${next.id}/review`);
      }
    })();
  }, [getSession, id, navigate]);

  if (!session) {
    return <div className="p-8 text-neutral-500">Loading session...</div>;
  }

  return (
    <BlurtView
      session={session}
      onSessionChange={async (nextSession) => {
        setSession(nextSession);
        await saveSession(nextSession);
      }}
      onFinish={(summary: SessionSummary = emptySummary) => {
        void summary;
        navigate(`/session/${session.id}/review`);
      }}
    />
  );
};
