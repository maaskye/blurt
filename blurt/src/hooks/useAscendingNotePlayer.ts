import { useCallback, useRef } from 'react';

const NOTE_COUNT = 21;

const buildNotePaths = () =>
  Array.from({ length: NOTE_COUNT }, (_, index) => `/sfx/notes/note_${String(index + 1).padStart(2, '0')}.wav`);

export const useAscendingNotePlayer = () => {
  const nextIndexRef = useRef(0);
  const playersRef = useRef<HTMLAudioElement[] | null>(null);

  const getPlayers = () => {
    if (!playersRef.current) {
      playersRef.current = buildNotePaths().map((path) => new Audio(path));
    }
    return playersRef.current;
  };

  const playNext = useCallback(async () => {
    const players = getPlayers();
    if (players.length === 0) {
      return;
    }

    const index = nextIndexRef.current % players.length;
    const player = players[index];
    nextIndexRef.current = (index + 1) % players.length;

    try {
      player.currentTime = 0;
      await player.play();
    } catch {
      // Ignore autoplay or decode failures so note creation always succeeds.
    }
  }, []);

  const reset = useCallback(() => {
    nextIndexRef.current = 0;
  }, []);

  return { playNext, reset };
};
