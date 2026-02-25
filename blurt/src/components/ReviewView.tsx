import { MouseEvent, useMemo, useRef, useState } from 'react';
import { Session, SessionNote, SessionSummary } from '../types/session';

type Props = {
  session: Session;
  summary: SessionSummary;
  onBack: () => void;
  onSave: (session: Session) => void;
};

export const ReviewView = ({ session, summary, onBack, onSave }: Props) => {
  const [notes, setNotes] = useState(session.notes);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const endedAtText = useMemo(() => {
    if (!session.endedAtMs) {
      return 'Not finished';
    }
    return new Date(session.endedAtMs).toLocaleString();
  }, [session.endedAtMs]);

  const beginDrag = (event: MouseEvent<HTMLDivElement>, note: SessionNote) => {
    const rect = (event.target as HTMLDivElement).getBoundingClientRect();
    dragRef.current = {
      id: note.id,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
  };

  const onMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current) {
      return;
    }

    const canvas = event.currentTarget.getBoundingClientRect();
    const nextNotes = notes.map((note) => {
      if (note.id !== dragRef.current?.id) {
        return note;
      }

      return {
        ...note,
        x: Math.max(0, event.clientX - canvas.left - dragRef.current.offsetX),
        y: Math.max(0, event.clientY - canvas.top - dragRef.current.offsetY)
      };
    });

    setNotes(nextNotes);
  };

  const endDrag = () => {
    dragRef.current = null;
    onSave({ ...session, notes });
  };

  return (
    <div className="review-view">
      <header>
        <h2>Review Session</h2>
        <button onClick={onBack}>Back to Setup</button>
      </header>

      <section className="summary">
        <p>Completed: {endedAtText}</p>
        <p>Total notes: {summary.totalNotes}</p>
        <p>Total words: {summary.totalWords}</p>
        <p>Notes/minute: {summary.notesPerMinute}</p>
      </section>

      <div className="canvas" onMouseMove={onMouseMove} onMouseUp={endDrag} onMouseLeave={endDrag}>
        {notes.map((note) => (
          <div
            key={note.id}
            className="note draggable"
            style={{ left: note.x, top: note.y }}
            onMouseDown={(event) => beginDrag(event, note)}
          >
            {note.text}
          </div>
        ))}
      </div>
    </div>
  );
};
