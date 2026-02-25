import html2canvas from 'html2canvas';
import { KeyboardEvent, MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTimer } from '../hooks/useTimer';
import { useAscendingNotePlayer } from '../hooks/useAscendingNotePlayer';
import {
  arrangeNotesIntoGrid,
  getNoteHeight,
  MIN_CANVAS_HEIGHT,
  NOTE_WIDTH
} from '../utils/arrangeNotesIntoGrid';
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
  onSessionChange: (nextSession: Session) => void | Promise<void>;
  onFinish: (summary: SessionSummary) => void;
};

export const BlurtView = ({ session, onSessionChange, onFinish }: Props) => {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState<SessionNote[]>(session.notes);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const finalizedRef = useRef(false);
  const { playNext, reset } = useAscendingNotePlayer();

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

  const finalizeSession = useCallback(() => {
    if (finalizedRef.current) {
      return;
    }
    finalizedRef.current = true;

    const canvasWidth = canvasRef.current?.clientWidth ?? 960;
    const arranged = arrangeNotesIntoGrid(notes, canvasWidth);
    const endedSession = { ...session, notes: arranged.notes, endedAtMs: Date.now() };
    setNotes(arranged.notes);
    void onSessionChange(endedSession);
    onFinish(summary);
  }, [notes, onFinish, onSessionChange, session, summary]);

  const { remainingSec, isPaused, isComplete, togglePause, completeNow } = useTimer(
    session.durationSec,
    finalizeSession
  );

  useEffect(() => {
    finalizedRef.current = false;
    reset();
    inputRef.current?.focus();
  }, [reset, session.id]);

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
    void playNext();
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
  };

  const beginDrag = (event: ReactMouseEvent<HTMLDivElement>, note: SessionNote) => {
    if (isComplete) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      id: note.id,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
  };

  const onMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragRef.current || isComplete) {
      return;
    }

    const canvas = event.currentTarget.getBoundingClientRect();
    const nextNotes = notes.map((note) => {
      if (note.id !== dragRef.current?.id) {
        return note;
      }

      const noteHeight = getNoteHeight(note.text);
      return {
        ...note,
        x: Math.max(0, Math.min(canvas.width - NOTE_WIDTH, event.clientX - canvas.left - dragRef.current.offsetX)),
        y: Math.max(
          0,
          Math.min(canvas.height - noteHeight, event.clientY - canvas.top - dragRef.current.offsetY)
        )
      };
    });

    setNotes(nextNotes);
  };

  const endDrag = () => {
    if (!dragRef.current || isComplete) {
      dragRef.current = null;
      return;
    }
    dragRef.current = null;
    void onSessionChange({ ...session, notes });
  };

  const exportViewport = async () => {
    if (!canvasRef.current) {
      return;
    }
    const canvas = await html2canvas(canvasRef.current, { backgroundColor: '#f7f8fc' });
    const dataUrl = canvas.toDataURL('image/png');
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = `${session.title.replace(/\s+/g, '_')}_blurt_view.png`;
    anchor.click();
  };

  const exportFullBoard = async () => {
    const exportWidth = canvasRef.current?.clientWidth ?? 960;
    const arranged = arrangeNotesIntoGrid(notes, exportWidth);
    const exportRoot = document.createElement('div');
    exportRoot.className = 'canvas';
    exportRoot.style.width = `${exportWidth}px`;
    exportRoot.style.height = `${arranged.boardHeight}px`;
    exportRoot.style.position = 'fixed';
    exportRoot.style.left = '-10000px';
    exportRoot.style.top = '0';

    arranged.notes.forEach((note) => {
      const item = document.createElement('div');
      item.className = 'note';
      item.style.left = `${note.x}px`;
      item.style.top = `${note.y}px`;
      item.style.height = `${getNoteHeight(note.text)}px`;
      item.textContent = note.text;
      exportRoot.appendChild(item);
    });

    document.body.appendChild(exportRoot);
    const canvas = await html2canvas(exportRoot, { backgroundColor: '#f7f8fc' });
    document.body.removeChild(exportRoot);
    const dataUrl = canvas.toDataURL('image/png');
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = `${session.title.replace(/\s+/g, '_')}_blurt_full.png`;
    anchor.click();
  };

  return (
    <div className="blurt-view" onKeyDown={onKeyDown} tabIndex={0}>
      <header>
        <h2>{session.title}</h2>
        <div className="controls">
          <span className="timer">{formatTime(remainingSec)}</span>
          <button onClick={togglePause}>{isPaused ? 'Resume' : 'Pause'}</button>
          <button className="danger" onClick={completeNow} disabled={isComplete}>
            Stop Early
          </button>
          <button onClick={exportViewport}>Export View PNG</button>
          <button onClick={exportFullBoard}>Export Full PNG</button>
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

      <div
        ref={canvasRef}
        className="canvas"
        style={{ minHeight: MIN_CANVAS_HEIGHT }}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        {notes.map((note) => (
          <div
            key={note.id}
            className={`note ${isComplete ? '' : 'draggable'}`}
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
