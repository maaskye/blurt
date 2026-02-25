export type SessionNote = {
  id: string;
  text: string;
  x: number;
  y: number;
  createdAtMs: number;
};

export type Session = {
  id: string;
  title: string;
  prompt?: string;
  durationSec: number;
  startedAtMs: number;
  endedAtMs?: number;
  notes: SessionNote[];
};

export type SessionSummary = {
  totalNotes: number;
  totalWords: number;
  notesPerMinute: number;
};
