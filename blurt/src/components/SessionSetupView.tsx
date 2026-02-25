import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  onStart: (payload: { title: string; prompt?: string; durationSec: number }) => void;
};

const MIN_DURATION_MIN = 1;
const MAX_DURATION_MIN = 60;
const ROW_HEIGHT = 44;
const WHEEL_VISIBLE_ROWS = 5;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const SessionSetupView = ({ onStart }: Props) => {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [durationMin, setDurationMin] = useState(5);
  const [isDurationOpen, setIsDurationOpen] = useState(false);
  const [tempDurationMin, setTempDurationMin] = useState(5);
  const [logoErrored, setLogoErrored] = useState(false);

  const wheelRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const doneRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const scrollSnapTimeoutRef = useRef<number | null>(null);

  const minuteOptions = useMemo(
    () => Array.from({ length: MAX_DURATION_MIN }, (_, index) => index + MIN_DURATION_MIN),
    []
  );

  const closeDuration = () => {
    setIsDurationOpen(false);
    window.setTimeout(() => {
      triggerRef.current?.focus();
    }, 0);
  };

  const openDuration = () => {
    setTempDurationMin(durationMin);
    setIsDurationOpen(true);
  };

  const applyDuration = () => {
    setDurationMin(tempDurationMin);
    closeDuration();
  };

  useEffect(() => {
    if (!isDurationOpen || !wheelRef.current) {
      return;
    }
    wheelRef.current.scrollTop = (tempDurationMin - MIN_DURATION_MIN) * ROW_HEIGHT;
    cancelRef.current?.focus();
  }, [isDurationOpen, tempDurationMin]);

  useEffect(() => {
    if (!isDurationOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDuration();
        return;
      }

      if (event.key === 'Enter') {
        const active = document.activeElement;
        if (active === cancelRef.current) {
          event.preventDefault();
          closeDuration();
          return;
        }
        if (active === doneRef.current) {
          event.preventDefault();
          applyDuration();
          return;
        }
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusables = [cancelRef.current, doneRef.current].filter(Boolean) as HTMLButtonElement[];
      if (focusables.length === 0) {
        return;
      }

      const currentIndex = focusables.indexOf(document.activeElement as HTMLButtonElement);
      let nextIndex = currentIndex;
      if (event.shiftKey) {
        nextIndex = currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1;
      } else {
        nextIndex = currentIndex === focusables.length - 1 ? 0 : currentIndex + 1;
      }

      event.preventDefault();
      focusables[nextIndex]?.focus();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDurationOpen, tempDurationMin]);

  const onWheelScroll = () => {
    if (!wheelRef.current) {
      return;
    }

    const raw = Math.round(wheelRef.current.scrollTop / ROW_HEIGHT) + MIN_DURATION_MIN;
    const next = clamp(raw, MIN_DURATION_MIN, MAX_DURATION_MIN);
    setTempDurationMin(next);

    if (scrollSnapTimeoutRef.current) {
      window.clearTimeout(scrollSnapTimeoutRef.current);
    }
    scrollSnapTimeoutRef.current = window.setTimeout(() => {
      if (!wheelRef.current) {
        return;
      }
      wheelRef.current.scrollTo({
        top: (next - MIN_DURATION_MIN) * ROW_HEIGHT,
        behavior: 'smooth'
      });
    }, 100);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }

    onStart({
      title: title.trim(),
      prompt: prompt.trim() || undefined,
      durationSec: durationMin * 60
    });
  };

  return (
    <form className="setup" onSubmit={onSubmit}>
      <div className="setup-logo-wrap">
        {!logoErrored ? (
          <img
            className="setup-logo"
            src="/branding/blurt-logo.svg"
            alt="blurt."
            onError={() => setLogoErrored(true)}
          />
        ) : (
          <h1 className="setup-logo-fallback">blurt.</h1>
        )}
      </div>
      <label>
        Topic / Session Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Experiment Design" />
      </label>
      <label>
        Prompt (optional)
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Recall everything you know about..."
        />
      </label>
      <label>
        Duration
        <button ref={triggerRef} type="button" className="duration-trigger" onClick={openDuration}>
          <span>{durationMin} min</span>
          <span className="duration-trigger-chevron">▾</span>
        </button>
      </label>
      <button className="primary" type="submit">
        Lets do this!
      </button>

      {isDurationOpen && (
        <div className="duration-modal-overlay" onMouseDown={closeDuration}>
          <div className="duration-modal" onMouseDown={(event) => event.stopPropagation()}>
            <h3>Select duration</h3>
            <div
              ref={wheelRef}
              className="duration-wheel"
              onScroll={onWheelScroll}
              style={{ height: `${ROW_HEIGHT * WHEEL_VISIBLE_ROWS}px` }}
            >
              {minuteOptions.map((minute) => (
                <button
                  type="button"
                  key={minute}
                  className={`duration-wheel-row ${minute === tempDurationMin ? 'active' : ''}`}
                  onClick={() => {
                    setTempDurationMin(minute);
                    wheelRef.current?.scrollTo({
                      top: (minute - MIN_DURATION_MIN) * ROW_HEIGHT,
                      behavior: 'smooth'
                    });
                  }}
                >
                  {minute} min
                </button>
              ))}
            </div>
            <div className="duration-modal-actions">
              <button ref={cancelRef} type="button" onClick={closeDuration}>
                Cancel
              </button>
              <button ref={doneRef} className="primary" type="button" onClick={applyDuration}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
