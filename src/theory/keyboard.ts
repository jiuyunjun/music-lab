import { Note } from 'tonal';

export interface PianoKey {
  midi: number;
  /** Sharp spelling, used as a stable id ("C#4"). */
  note: string;
  isBlack: boolean;
}

/** All piano keys from `low` to `high` inclusive. */
export function pianoKeys(low: string, high: string): PianoKey[] {
  const from = Note.midi(low);
  const to = Note.midi(high);
  if (from === null || to === null) throw new Error(`Invalid range ${low}-${high}`);
  const keys: PianoKey[] = [];
  for (let midi = from; midi <= to; midi++) {
    const note = Note.fromMidiSharps(midi);
    keys.push({ midi, note, isBlack: Note.get(note).acc !== '' });
  }
  return keys;
}

/** Keyboard key id for any spelling: "Bb3" -> "A#3". */
export function keyId(note: string): string {
  const midi = Note.midi(note);
  if (midi === null) throw new Error(`Invalid note ${note}`);
  return Note.fromMidiSharps(midi);
}

/**
 * Computer keyboard layout: the home row plays white keys, the row above
 * plays black keys (a common DAW layout). Values are semitones above C.
 */
export const COMPUTER_KEY_OFFSETS: Readonly<Record<string, number>> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
  k: 12, o: 13, l: 14, p: 15, ';': 16,
};

export function computerKeyToNote(key: string, octave: number): string | null {
  const offset = COMPUTER_KEY_OFFSETS[key.toLowerCase()];
  const base = Note.midi(`C${octave}`);
  if (offset === undefined || base === null) return null;
  return Note.fromMidiSharps(base + offset);
}
