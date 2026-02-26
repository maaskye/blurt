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
import {
  animateRaf,
  easeOutCubic,
  easeOutQuint,
  prefersReducedMotion,
  stepVelocity,
  subscribeReducedMotion
} from '../utils/motion';
import { placeNoteRandomly } from '../utils/placeNoteRandomly';
import { Session, SessionNote, SessionSummary } from '../types/session';

const INERTIA_DURATION_MS = 220;
const INERTIA_FRICTION = 7.5;
const LAUNCH_DURATION_MS = 300;
const GRID_MORPH_DURATION_MS = 280;
const GRID_MORPH_STAGGER_MS = 14;

type DragState = {
  id: string;
  offsetX: number;
  offsetY: number;
  noteHeight: number;
};

type DragSample = {
  x: number;
  y: number;
  timestamp: number;
};

type GhostState = {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  blurPx: number;
};

type NoteFx = {
  isDragging?: boolean;
  isInertia?: boolean;
  isSettle?: boolean;
};

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
  const notesRef = useRef<SessionNote[]>(session.notes);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const dragSamplesRef = useRef<DragSample[]>([]);
  const animationCancelsRef = useRef<Set<() => void>>(new Set());
  const settleTimeoutsRef = useRef<Set<number>>(new Set());
  const finalizedRef = useRef(false);
  const finishingRef = useRef(false);
  const [noteFxMap, setNoteFxMap] = useState<Record<string, NoteFx>>({});
  const [hiddenNotes, setHiddenNotes] = useState<Record<string, true>>({});
  const [launchGhosts, setLaunchGhosts] = useState<GhostState[]>([]);
  const [isReducedMotion, setIsReducedMotion] = useState(prefersReducedMotion());
  const { playNext, reset } = useAscendingNotePlayer();

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => subscribeReducedMotion(setIsReducedMotion), []);

  const clearAnimationResources = useCallback(() => {
    animationCancelsRef.current.forEach((cancel) => cancel());
    animationCancelsRef.current.clear();

    settleTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    settleTimeoutsRef.current.clear();
  }, []);

  useEffect(() => () => clearAnimationResources(), [clearAnimationResources]);

  const applyNoteFx = useCallback((id: string, partial: Partial<NoteFx>) => {
    setNoteFxMap((prev) => {
      const next = { ...(prev[id] ?? {}), ...partial };
      const isEmpty = !next.isDragging && !next.isInertia && !next.isSettle;
      if (isEmpty) {
        const clone = { ...prev };
        delete clone[id];
        return clone;
      }
      return { ...prev, [id]: next };
    });
  }, []);

  const queueSettleFx = useCallback(
    (id: string) => {
      applyNoteFx(id, { isSettle: true });
      const timeoutId = window.setTimeout(() => {
        applyNoteFx(id, { isSettle: false });
        settleTimeoutsRef.current.delete(timeoutId);
      }, 180);
      settleTimeoutsRef.current.add(timeoutId);
    },
    [applyNoteFx]
  );

  const clampNotePosition = useCallback((x: number, y: number, noteHeight: number) => {
    const canvasWidth = canvasRef.current?.clientWidth ?? 960;
    const canvasHeight = canvasRef.current?.clientHeight ?? MIN_CANVAS_HEIGHT;
    return {
      x: Math.max(0, Math.min(canvasWidth - NOTE_WIDTH, x)),
      y: Math.max(0, Math.min(canvasHeight - noteHeight, y))
    };
  }, []);

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

  const finalizeSession = useCallback(async () => {
    if (finalizedRef.current) {
      return;
    }
    finalizedRef.current = true;
    finishingRef.current = true;
    dragRef.current = null;
    clearAnimationResources();

    const startNotes = notesRef.current;
    const canvasWidth = canvasRef.current?.clientWidth ?? 960;
    const arranged = arrangeNotesIntoGrid(startNotes, canvasWidth);

    if (isReducedMotion || startNotes.length === 0) {
      const endedSession = { ...session, notes: arranged.notes, endedAtMs: Date.now() };
      setNotes(arranged.notes);
      await onSessionChange(endedSession);
      onFinish(summary);
      return;
    }

    const startById = new Map(startNotes.map((note) => [note.id, note]));
    await new Promise<void>((resolve) => {
      const cancel = animateRaf(
        GRID_MORPH_DURATION_MS + Math.max(0, arranged.notes.length - 1) * GRID_MORPH_STAGGER_MS,
        ({ elapsedMs }) => {
          setNotes(() =>
            arranged.notes.map((target, index) => {
              const source = startById.get(target.id) ?? target;
              const startedAt = index * GRID_MORPH_STAGGER_MS;
              const raw = (elapsedMs - startedAt) / GRID_MORPH_DURATION_MS;
              const progress = Math.min(1, Math.max(0, raw));
              const eased = easeOutCubic(progress);
              return {
                ...target,
                x: source.x + (target.x - source.x) * eased,
                y: source.y + (target.y - source.y) * eased
              };
            })
          );
        },
        async () => {
          animationCancelsRef.current.delete(cancel);
          setNotes(arranged.notes);
          const endedSession = { ...session, notes: arranged.notes, endedAtMs: Date.now() };
          await onSessionChange(endedSession);
          resolve();
        }
      );
      animationCancelsRef.current.add(cancel);
    });

    onFinish(summary);
  }, [clearAnimationResources, isReducedMotion, onFinish, onSessionChange, session, summary]);

  const { remainingSec, isPaused, isComplete, togglePause, completeNow } = useTimer(
    session.durationSec,
    () => {
      void finalizeSession();
    }
  );

  useEffect(() => {
    finalizedRef.current = false;
    finishingRef.current = false;
    setLaunchGhosts([]);
    setHiddenNotes({});
    setNoteFxMap({});
    clearAnimationResources();
    reset();
    inputRef.current?.focus();
  }, [clearAnimationResources, reset, session.id]);

  useEffect(() => {
    const flushSession = () => {
      if (finishingRef.current) {
        return;
      }
      void onSessionChange({ ...session, notes: notesRef.current });
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flushSession();
      }
    };

    window.addEventListener('beforeunload', flushSession);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('beforeunload', flushSession);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [onSessionChange, session]);

  const addNote = () => {
    const submitted = text.trim();
    if (!submitted || isComplete || !canvasRef.current) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const position = placeNoteRandomly(rect.width, rect.height, notes);
    const noteId = crypto.randomUUID();
    const nextNote: SessionNote = {
      id: noteId,
      text: submitted,
      x: position.x,
      y: position.y,
      createdAtMs: Date.now()
    };

    const nextNotes = [...notes, nextNote];

    const nextSession = { ...session, notes: nextNotes };
    setNotes(nextNotes);
    onSessionChange(nextSession);
    setText('');
    inputRef.current?.focus();

    if (isReducedMotion || !inputRef.current || !canvasRef.current) {
      void playNext();
      return;
    }

    const inputRect = inputRef.current.getBoundingClientRect();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const start = {
      x: inputRect.left - canvasRect.left + inputRect.width / 2 - NOTE_WIDTH / 2,
      y: inputRect.top - canvasRect.top
    };
    const target = { x: nextNote.x, y: nextNote.y };

    setHiddenNotes((prev) => ({ ...prev, [noteId]: true }));
    setLaunchGhosts((prev) => [
      ...prev,
      {
        id: noteId,
        text: submitted,
        x: start.x,
        y: start.y,
        scale: 1,
        opacity: 0.92,
        blurPx: 0
      }
    ]);

    const control = {
      x: (start.x + target.x) / 2,
      y: Math.min(start.y, target.y) - 140
    };
    const quadraticPoint = (t: number) => {
      const oneMinus = 1 - t;
      return {
        x: oneMinus * oneMinus * start.x + 2 * oneMinus * t * control.x + t * t * target.x,
        y: oneMinus * oneMinus * start.y + 2 * oneMinus * t * control.y + t * t * target.y
      };
    };

    const cancel = animateRaf(
      LAUNCH_DURATION_MS,
      ({ progress }) => {
        const eased = easeOutQuint(progress);
        const point = quadraticPoint(eased);
        setLaunchGhosts((prev) =>
          prev.map((ghost) =>
            ghost.id === noteId
              ? {
                  ...ghost,
                  x: point.x,
                  y: point.y,
                  scale: 1 - 0.08 * eased,
                  opacity: 0.92 - 0.3 * eased,
                  blurPx: 2.5 * eased
                }
              : ghost
          )
        );
      },
      ({ completed }) => {
        animationCancelsRef.current.delete(cancel);
        setLaunchGhosts((prev) => prev.filter((ghost) => ghost.id !== noteId));
        setHiddenNotes((prev) => {
          const clone = { ...prev };
          delete clone[noteId];
          return clone;
        });
        if (completed) {
          void playNext();
        }
      }
    );
    animationCancelsRef.current.add(cancel);
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
    if (isComplete || finishingRef.current) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      id: note.id,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      noteHeight: getNoteHeight(note.text)
    };
    dragSamplesRef.current = [{ x: note.x, y: note.y, timestamp: performance.now() }];
    applyNoteFx(note.id, { isDragging: true, isInertia: false, isSettle: false });
  };

  const onMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragRef.current || isComplete || finishingRef.current) {
      return;
    }

    const canvasRect = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - canvasRect.left - dragRef.current.offsetX;
    const pointerY = event.clientY - canvasRect.top - dragRef.current.offsetY;
    const clamped = clampNotePosition(pointerX, pointerY, dragRef.current.noteHeight);
    const now = performance.now();
    dragSamplesRef.current.push({ x: clamped.x, y: clamped.y, timestamp: now });
    dragSamplesRef.current = dragSamplesRef.current.filter((sample) => now - sample.timestamp <= 120);

    setNotes((prev) =>
      prev.map((note) =>
        note.id === dragRef.current?.id
          ? {
              ...note,
              x: clamped.x,
              y: clamped.y
            }
          : note
      )
    );
  };

  const endDrag = () => {
    if (!dragRef.current || isComplete || finishingRef.current) {
      dragRef.current = null;
      return;
    }
    const { id, noteHeight } = dragRef.current;
    dragRef.current = null;

    applyNoteFx(id, { isDragging: false });

    const samples = dragSamplesRef.current;
    dragSamplesRef.current = [];
    if (samples.length < 2 || isReducedMotion) {
      queueSettleFx(id);
      void onSessionChange({ ...session, notes: notesRef.current });
      return;
    }

    const latest = samples[samples.length - 1];
    const anchor = [...samples].reverse().find((sample) => latest.timestamp - sample.timestamp >= 36) ?? samples[0];
    const deltaTimeMs = Math.max(1, latest.timestamp - anchor.timestamp);
    const velocityX = ((latest.x - anchor.x) / deltaTimeMs) * 1000;
    const velocityY = ((latest.y - anchor.y) / deltaTimeMs) * 1000;
    const speed = Math.hypot(velocityX, velocityY);

    if (speed < 20) {
      queueSettleFx(id);
      void onSessionChange({ ...session, notes: notesRef.current });
      return;
    }

    applyNoteFx(id, { isInertia: true });
    let vx = velocityX;
    let vy = velocityY;

    const cancel = animateRaf(
      INERTIA_DURATION_MS,
      ({ deltaMs }) => {
        vx = stepVelocity(vx, INERTIA_FRICTION, deltaMs);
        vy = stepVelocity(vy, INERTIA_FRICTION, deltaMs);

        setNotes((prev) =>
          prev.map((note) => {
            if (note.id !== id) {
              return note;
            }
            const nextX = note.x + (vx * deltaMs) / 1000;
            const nextY = note.y + (vy * deltaMs) / 1000;
            const clamped = clampNotePosition(nextX, nextY, noteHeight);
            return { ...note, x: clamped.x, y: clamped.y };
          })
        );
      },
      () => {
        animationCancelsRef.current.delete(cancel);
        applyNoteFx(id, { isInertia: false });
        queueSettleFx(id);
        void onSessionChange({ ...session, notes: notesRef.current });
      }
    );
    animationCancelsRef.current.add(cancel);
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
        className={`canvas ${isReducedMotion ? 'motion-reduced' : ''}`}
        style={{ minHeight: MIN_CANVAS_HEIGHT }}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        <div className="launch-layer" aria-hidden>
          {launchGhosts.map((ghost) => (
            <div
              key={`ghost-${ghost.id}`}
              className="launch-ghost"
              style={{
                left: ghost.x,
                top: ghost.y,
                width: NOTE_WIDTH,
                transform: `scale(${ghost.scale})`,
                opacity: ghost.opacity,
                filter: `blur(${ghost.blurPx}px)`
              }}
            >
              {ghost.text}
            </div>
          ))}
        </div>
        {notes.map((note) => (
          <div
            key={note.id}
            className={`note ${isComplete ? '' : 'draggable'} ${
              noteFxMap[note.id]?.isDragging ? 'note--dragging' : ''
            } ${noteFxMap[note.id]?.isInertia ? 'note--inertia' : ''} ${
              noteFxMap[note.id]?.isSettle ? 'note--settle' : ''
            } ${hiddenNotes[note.id] ? 'note--hidden' : ''}`}
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
