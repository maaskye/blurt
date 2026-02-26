import { MouseEvent, useMemo, useRef, useState } from 'react';
import { getNoteHeight, GRID_PADDING, MIN_CANVAS_HEIGHT, NOTE_WIDTH } from '../utils/arrangeNotesIntoGrid';
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

  const boardHeight = useMemo(() => {
    const maxBottom = notes.reduce((max, note) => Math.max(max, note.y + getNoteHeight(note.text)), 0);
    return Math.max(MIN_CANVAS_HEIGHT, maxBottom + GRID_PADDING);
  }, [notes]);

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
        x: Math.max(0, Math.min(canvas.width - NOTE_WIDTH, event.clientX - canvas.left - dragRef.current.offsetX)),
        y: Math.max(
          0,
          Math.min(canvas.height - getNoteHeight(note.text), event.clientY - canvas.top - dragRef.current.offsetY)
        )
      };
    });

    setNotes(nextNotes);
  };

  const endDrag = () => {
    dragRef.current = null;
    onSave({ ...session, notes });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[1480px] flex-col overflow-hidden rounded-3xl border border-[#d8deed] bg-[#f3f5fb] shadow-[0_20px_40px_rgba(17,27,55,0.1)]">
      <header className="flex items-center justify-between border-b border-[#d7ddee] bg-white px-8 py-6">
        <h2 className="text-3xl font-semibold text-[#1a2340]">Review Session</h2>
        <button
          className="rounded-lg border border-[#d2d7e8] bg-[#f2f4fb] px-4 py-2 font-medium text-[#1d2848] hover:bg-[#e8ecf7]"
          onClick={onBack}
        >
          Back to Setup
        </button>
      </header>

      <section className="grid grid-cols-2 gap-3 border-b border-[#d7ddee] bg-[#eef2ff] px-8 py-4 text-[#2f3f69] md:grid-cols-4">
        <p>Completed: {endedAtText}</p>
        <p>Total notes: {summary.totalNotes}</p>
        <p>Total words: {summary.totalWords}</p>
        <p>Notes/minute: {summary.notesPerMinute}</p>
      </section>

      <div
        className="canvas m-8 mt-6 rounded-2xl border-2 border-[#d8ddea] bg-white shadow-inner"
        style={{ minHeight: boardHeight, height: boardHeight }}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        {notes.map((note) => (
          <div
            key={note.id}
            className="note draggable"
            style={{ left: note.x, top: note.y, height: getNoteHeight(note.text) }}
            onMouseDown={(event) => beginDrag(event, note)}
          >
            {note.text}
          </div>
        ))}
      </div>
    </div>
  );
};
