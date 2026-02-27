import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { SessionTemplate } from '../types/template';

type StartPayload = {
  title: string;
  prompt?: string;
  durationSec: number;
};

type TemplatePayload = {
  name: string;
  titleDefault: string;
  promptDefault?: string;
  durationSecDefault: number;
};

type Props = {
  onStart: (payload: StartPayload) => void | Promise<void>;
  variant?: 'full' | 'compact';
  templates?: SessionTemplate[];
  onSaveTemplate?: (payload: TemplatePayload) => Promise<void> | void;
  onUpdateTemplate?: (id: string, payload: TemplatePayload) => Promise<void> | void;
  onDeleteTemplate?: (id: string) => Promise<void> | void;
  startDisabled?: boolean;
  startError?: string | null;
};

const MIN_DURATION_MIN = 1;
const MAX_DURATION_MIN = 60;
const ROW_HEIGHT = 44;
const WHEEL_VISIBLE_ROWS = 5;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const SessionSetupView = ({
  onStart,
  variant = 'full',
  templates = [],
  onSaveTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  startDisabled = false,
  startError = null
}: Props) => {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [durationMin, setDurationMin] = useState(5);
  const [isDurationOpen, setIsDurationOpen] = useState(false);
  const [tempDurationMin, setTempDurationMin] = useState(5);
  const [logoErrored, setLogoErrored] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');

  const wheelRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const doneRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const scrollSnapTimeoutRef = useRef<number | null>(null);

  const minuteOptions = useMemo(
    () => Array.from({ length: MAX_DURATION_MIN }, (_, index) => index + MIN_DURATION_MIN),
    []
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId, templates]
  );

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }
    setTitle(selectedTemplate.titleDefault);
    setPrompt(selectedTemplate.promptDefault ?? '');
    setDurationMin(Math.max(1, Math.round(selectedTemplate.durationSecDefault / 60)));
    setTemplateName(selectedTemplate.name);
  }, [selectedTemplate]);

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
    if (!title.trim() || startDisabled) {
      return;
    }

    void onStart({
      title: title.trim(),
      prompt: prompt.trim() || undefined,
      durationSec: durationMin * 60
    });
  };

  const templatePayload = (): TemplatePayload => ({
    name: templateName.trim() || title.trim() || 'Untitled Template',
    titleDefault: title.trim(),
    promptDefault: prompt.trim() || undefined,
    durationSecDefault: durationMin * 60
  });

  const canSaveTemplate = Boolean(onSaveTemplate && title.trim());
  const canUpdateTemplate = Boolean(onUpdateTemplate && selectedTemplateId && title.trim());
  const canDeleteTemplate = Boolean(onDeleteTemplate && selectedTemplateId);

  return (
    <form className={`setup ${variant === 'compact' ? 'setup--compact' : ''}`} onSubmit={onSubmit}>
      {variant === 'full' ? (
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
      ) : (
        <h2 className="quickstart-title">Quick Start</h2>
      )}

      {variant === 'compact' ? (
        <details className="template-tools">
          <summary>Templates</summary>
          <div className="template-tools-body">
            <label>
              Template
              <select
                className="template-select"
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
              >
                <option value="">None</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Template Name
              <input
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                placeholder="e.g. Statutory Sprint"
              />
            </label>

            <div className="template-actions" role="group" aria-label="Template actions">
              <button
                type="button"
                onClick={() => {
                  void onSaveTemplate?.(templatePayload());
                  setTemplateName('');
                  setSelectedTemplateId('');
                }}
                disabled={!canSaveTemplate}
              >
                Save New
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedTemplateId) {
                    return;
                  }
                  void onUpdateTemplate?.(selectedTemplateId, templatePayload());
                }}
                disabled={!canUpdateTemplate}
              >
                Update
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  if (!selectedTemplateId) {
                    return;
                  }
                  void onDeleteTemplate?.(selectedTemplateId);
                  setSelectedTemplateId('');
                }}
                disabled={!canDeleteTemplate}
              >
                Delete
              </button>
            </div>
          </div>
        </details>
      ) : (
        <>
          <label>
            Template
            <select
              className="template-select"
              value={selectedTemplateId}
              onChange={(event) => setSelectedTemplateId(event.target.value)}
            >
              <option value="">None</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Template Name
            <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="e.g. Statutory Sprint" />
          </label>

          <div className="template-actions" role="group" aria-label="Template actions">
            <button
              type="button"
              onClick={() => {
                void onSaveTemplate?.(templatePayload());
                setTemplateName('');
                setSelectedTemplateId('');
              }}
              disabled={!canSaveTemplate}
            >
              Save New
            </button>
            <button
              type="button"
              onClick={() => {
                if (!selectedTemplateId) {
                  return;
                }
                void onUpdateTemplate?.(selectedTemplateId, templatePayload());
              }}
              disabled={!canUpdateTemplate}
            >
              Update
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => {
                if (!selectedTemplateId) {
                  return;
                }
                void onDeleteTemplate?.(selectedTemplateId);
                setSelectedTemplateId('');
              }}
              disabled={!canDeleteTemplate}
            >
              Delete
            </button>
          </div>
        </>
      )}

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
      <button className="primary" type="submit" disabled={startDisabled || !title.trim()}>
        {variant === 'compact' ? 'Lets Go!' : 'Lets do this!'}
      </button>
      {startError && <p className="text-sm text-red-600 mt-1">{startError}</p>}

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
