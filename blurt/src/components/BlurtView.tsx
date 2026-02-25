import html2canvas from 'html2canvas';
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTimer } from '../hooks/useTimer';
import { placeNoteRandomly } from '../utils/placeNoteRandomly';
import { Session, SessionNote, SessionSummary } from '../types/session';

const formatTime = (remainingSec: number) => {
  const min = Math.floor(remainingSec / 60)
    .toString()
    .padStart(2, '0');
  const sec = (remainingSec % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
};

type Props = {
  session: Session;
  onSessionChange: (nextSession: Session) => void;
  onFinish: (summary: SessionSummary) => void;
};

export const BlurtView = ({ session, onSessionChange, onFinish }: Props) => {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState<SessionNote[]>(session.notes);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const summary = useMemo(() => {
    const totalNotes = notes.length;
    const totalWords = notes.reduce((sum, note) => sum + note.text.trim().split(/\s+/).filter(Boolean).length, 0);
    const elapsedMin = session.durationSec / 60;
    return {
      totalNotes,
      totalWords,
      notesPerMinute: Number((totalNotes / elapsedMin).toFixed(2))
    };
  }, [notes, session.durationSec]);

  const { remainingSec, isPaused, isComplete, togglePause } = useTimer(session.durationSec, () => {
    const endedSession = { ...session, notes, endedAtMs: Date.now() };
    onSessionChange(endedSession);
    onFinish(summary);
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addNote = () => {
    const next = text.trim();
    if (!next || isComplete || !canvasRef.current) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const position = placeNoteRandomly(rect.width, rect.height, notes);

    const nextNotes = [
      ...notes,
      {
        id: crypto.randomUUID(),
        text: next,
        x: position.x,
        y: position.y,
        createdAtMs: Date.now()
      }
    ];

    const nextSession = { ...session, notes: nextNotes };
    setNotes(nextNotes);
    onSessionChange(nextSession);
    setText('');
    inputRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      const nextNotes = notes.slice(0, -1);
      setNotes(nextNotes);
      onSessionChange({ ...session, notes: nextNotes });
      return;
    }

    if (event.code === 'Space') {
      event.preventDefault();
      togglePause();
    }
  };

  const exportCanvas = async () => {
    if (!canvasRef.current) {
      return;
    }
    const canvas = await html2canvas(canvasRef.current, { backgroundColor: '#f7f8fc' });
    const dataUrl = canvas.toDataURL('image/png');
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = `${session.title.replace(/\s+/g, '_')}_blurt.png`;
    anchor.click();
  };

  return (
    <div className="blurt-view" onKeyDown={onKeyDown} tabIndex={0}>
      <header>
        <h2>{session.title}</h2>
        <div className="controls">
          <span className="timer">{formatTime(remainingSec)}</span>
          <button onClick={togglePause}>{isPaused ? 'Resume' : 'Pause'}</button>
          <button onClick={exportCanvas}>Export PNG</button>
        </div>
      </header>

      {session.prompt && <p className="prompt">{session.prompt}</p>}

      <div className="input-row">
        <input
          ref={inputRef}
          disabled={isComplete}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addNote();
            }
          }}
          placeholder="Type a fact and press Enter"
        />
      </div>

      <div ref={canvasRef} className="canvas">
        {notes.map((note) => (
          <div key={note.id} className="note" style={{ left: note.x, top: note.y }}>
            {note.text}
          </div>
        ))}
      </div>
    </div>
  );
};
