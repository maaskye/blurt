Place ascending note samples in this folder using deterministic names:

- note_01.wav (lowest note)
- note_02.wav
- ...
- note_12.wav (highest note by default)

Behavior:
- Each successful blurt entry plays the next file in order.
- After the last file, playback wraps back to note_01.wav.

If you add a different number of notes, update NOTE_COUNT in:
src/hooks/useAscendingNotePlayer.ts
