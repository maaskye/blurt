import { SessionNote } from '../types/session';

export const NOTE_WIDTH = 220;
export const NOTE_BASE_HEIGHT = 110;
export const NOTE_LINES_PER_UNIT = 4;
export const GRID_GAP = 12;
export const GRID_PADDING = 20;
export const MIN_CANVAS_HEIGHT = 460;

const CHARS_PER_LINE_ESTIMATE = 24;

const estimateLineCount = (text: string) => {
  const normalized = text.trim();
  if (!normalized) {
    return 1;
  }

  const explicitLines = normalized.split('\n');
  let lines = 0;

  explicitLines.forEach((line) => {
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines += 1;
      return;
    }

    let currentLineLength = 0;
    let segmentLines = 1;

    words.forEach((word) => {
      const wordLength = word.length;
      if (currentLineLength === 0) {
        currentLineLength = wordLength;
        return;
      }

      if (currentLineLength + 1 + wordLength <= CHARS_PER_LINE_ESTIMATE) {
        currentLineLength += 1 + wordLength;
        return;
      }

      segmentLines += 1;
      currentLineLength = wordLength;
    });

    lines += segmentLines;
  });

  return Math.max(1, lines);
};

export const getNoteSpanUnits = (text: string) =>
  Math.max(1, Math.ceil(estimateLineCount(text) / NOTE_LINES_PER_UNIT));

export const getNoteHeight = (text: string) => getNoteSpanUnits(text) * NOTE_BASE_HEIGHT;

type ArrangeResult = {
  notes: SessionNote[];
  boardHeight: number;
};

export const arrangeNotesIntoGrid = (notes: SessionNote[], canvasWidth: number): ArrangeResult => {
  const usableWidth = Math.max(1, canvasWidth - GRID_PADDING * 2);
  const columnWidth = NOTE_WIDTH + GRID_GAP;
  const columns = Math.max(1, Math.floor((usableWidth + GRID_GAP) / columnWidth));
  const occupancy: boolean[][] = [];

  const ensureRow = (rowIndex: number) => {
    while (occupancy.length <= rowIndex) {
      occupancy.push(Array.from({ length: columns }, () => false));
    }
  };

  const canPlace = (row: number, column: number, span: number) => {
    for (let r = row; r < row + span; r += 1) {
      ensureRow(r);
      if (occupancy[r][column]) {
        return false;
      }
    }
    return true;
  };

  const markPlaced = (row: number, column: number, span: number) => {
    for (let r = row; r < row + span; r += 1) {
      ensureRow(r);
      occupancy[r][column] = true;
    }
  };

  const arrangedNotes = notes.map((note) => {
    const span = getNoteSpanUnits(note.text);
    let row = 0;
    let chosenRow = 0;
    let chosenColumn = 0;

    let placed = false;
    while (!placed) {
      for (let column = 0; column < columns; column += 1) {
        if (!canPlace(row, column, span)) {
          continue;
        }
        chosenRow = row;
        chosenColumn = column;
        markPlaced(row, column, span);
        placed = true;
        break;
      }
      row += 1;
    }

    return {
      ...note,
      x: GRID_PADDING + chosenColumn * columnWidth,
      y: GRID_PADDING + chosenRow * (NOTE_BASE_HEIGHT + GRID_GAP)
    };
  });

  const maxBottom = arrangedNotes.reduce((max, note) => {
    const noteBottom = note.y + getNoteHeight(note.text);
    return Math.max(max, noteBottom);
  }, 0);

  return {
    notes: arrangedNotes,
    boardHeight: Math.max(MIN_CANVAS_HEIGHT, maxBottom + GRID_PADDING)
  };
};
