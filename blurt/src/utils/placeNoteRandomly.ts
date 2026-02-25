import { SessionNote } from '../types/session';

const PADDING = 20;
const NOTE_WIDTH = 220;
const NOTE_HEIGHT = 72;
const MAX_ATTEMPTS = 120;

type Position = { x: number; y: number };

const intersects = (a: Position, b: Position) => {
  return !(
    a.x + NOTE_WIDTH <= b.x ||
    b.x + NOTE_WIDTH <= a.x ||
    a.y + NOTE_HEIGHT <= b.y ||
    b.y + NOTE_HEIGHT <= a.y
  );
};

export const placeNoteRandomly = (
  canvasWidth: number,
  canvasHeight: number,
  existingNotes: SessionNote[]
): Position => {
  const minX = PADDING;
  const minY = PADDING;
  const maxX = Math.max(PADDING, canvasWidth - NOTE_WIDTH - PADDING);
  const maxY = Math.max(PADDING, canvasHeight - NOTE_HEIGHT - PADDING);

  const existingPositions = existingNotes.map((note) => ({ x: note.x, y: note.y }));

  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const candidate = {
      x: Math.floor(Math.random() * (maxX - minX + 1) + minX),
      y: Math.floor(Math.random() * (maxY - minY + 1) + minY)
    };

    if (!existingPositions.some((position) => intersects(candidate, position))) {
      return candidate;
    }
  }

  const fallbackIndex = existingNotes.length;
  const columns = Math.max(1, Math.floor((canvasWidth - PADDING * 2) / (NOTE_WIDTH + 8)));
  const row = Math.floor(fallbackIndex / columns);
  const column = fallbackIndex % columns;

  return {
    x: Math.min(maxX, minX + column * (NOTE_WIDTH + 8)),
    y: Math.min(maxY, minY + row * (NOTE_HEIGHT + 8))
  };
};
