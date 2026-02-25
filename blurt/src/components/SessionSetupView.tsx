import { FormEvent, useState } from 'react';

type Props = {
  onStart: (payload: { title: string; prompt?: string; durationSec: number }) => void;
};

const PRESETS = [300, 600, 900, 1500];

export const SessionSetupView = ({ onStart }: Props) => {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [durationSec, setDurationSec] = useState(600);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }

    onStart({
      title: title.trim(),
      prompt: prompt.trim() || undefined,
      durationSec
    });
  };

  return (
    <form className="setup" onSubmit={onSubmit}>
      <h1>Blurt</h1>
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
        <div className="preset-row">
          {PRESETS.map((value) => (
            <button
              type="button"
              key={value}
              className={durationSec === value ? 'active' : ''}
              onClick={() => setDurationSec(value)}
            >
              {Math.round(value / 60)} min
            </button>
          ))}
        </div>
      </label>
      <button className="primary" type="submit">
        Start Session
      </button>
    </form>
  );
};
