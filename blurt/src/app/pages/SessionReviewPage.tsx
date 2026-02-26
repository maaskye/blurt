import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ReviewView } from '../../components/ReviewView';
import { useAppState } from '../state';
import { Session, SessionSummary } from '../../types/session';

const computeSummary = (session: Session): SessionSummary => {
  const totalNotes = session.notes.length;
  const totalWords = session.notes.reduce((sum, note) => sum + note.text.split(/\s+/).filter(Boolean).length, 0);
  return {
    totalNotes,
    totalWords,
    notesPerMinute: Number((totalNotes / (session.durationSec / 60)).toFixed(2))
  };
};

export const SessionReviewPage = () => {
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
    })();
  }, [getSession, id, navigate]);

  const summary = useMemo(() => (session ? computeSummary(session) : null), [session]);

  if (!session || !summary) {
    return <div className="p-8 text-neutral-500">Loading review...</div>;
  }

  return (
    <ReviewView
      session={session}
      summary={summary}
      onBack={() => navigate('/')}
      onSave={(nextSession) => {
        setSession(nextSession);
        void saveSession(nextSession);
      }}
    />
  );
};
