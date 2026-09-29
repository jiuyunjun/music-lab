import { Interval, Note, Scale } from 'tonal';

export const MODE_IDS = [
  'ionian',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'aeolian',
  'locrian',
] as const;

export type ModeId = (typeof MODE_IDS)[number];

/** Scale degree, 1-based. */
export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ModeInfo {
  id: ModeId;
  /** Position of this mode inside the major scale (ionian = 1, dorian = 2 ...). */
  parentDegree: Degree;
  /** The degree that gives the mode its signature colour. */
  characteristicDegree: Degree;
  /** 1 = brightest (lydian) ... 7 = darkest (locrian). */
  brightness: number;
  /** Whether the tonic triad is major, minor or diminished. */
  quality: 'major' | 'minor' | 'diminished';
}

export const MODES: Record<ModeId, ModeInfo> = {
  ionian: { id: 'ionian', parentDegree: 1, characteristicDegree: 7, brightness: 2, quality: 'major' },
  dorian: { id: 'dorian', parentDegree: 2, characteristicDegree: 6, brightness: 4, quality: 'minor' },
  phrygian: { id: 'phrygian', parentDegree: 3, characteristicDegree: 2, brightness: 6, quality: 'minor' },
  lydian: { id: 'lydian', parentDegree: 4, characteristicDegree: 4, brightness: 1, quality: 'major' },
  mixolydian: { id: 'mixolydian', parentDegree: 5, characteristicDegree: 7, brightness: 3, quality: 'major' },
  aeolian: { id: 'aeolian', parentDegree: 6, characteristicDegree: 6, brightness: 5, quality: 'minor' },
  locrian: { id: 'locrian', parentDegree: 7, characteristicDegree: 5, brightness: 7, quality: 'diminished' },
};

export const MODES_BY_BRIGHTNESS: ModeId[] = [...MODE_IDS].sort(
  (a, b) => MODES[a].brightness - MODES[b].brightness,
);

/** Pitch-class names of a mode, e.g. ("D", "dorian") -> D E F G A B C. */
export function modeNotes(root: string, mode: ModeId): string[] {
  return Scale.get(`${root} ${mode}`).notes;
}

/** Interval names from the root, e.g. dorian -> 1P 2M 3m 4P 5P 6M 7m. */
export function modeIntervals(mode: ModeId): string[] {
  return Scale.get(`C ${mode}`).intervals;
}

/** All scale notes (with octave) between two notes, inclusive. */
export function modeNotesInRange(root: string, mode: ModeId, low: string, high: string): string[] {
  return Scale.rangeOf(`${root} ${mode}`)(low, high) as string[];
}

/** The note that gives the mode its colour, e.g. D dorian -> B. */
export function characteristicNote(root: string, mode: ModeId): string {
  return noteOfDegree(root, mode, MODES[mode].characteristicDegree);
}

export function noteOfDegree(root: string, mode: ModeId, degree: Degree): string {
  const note = modeNotes(root, mode)[degree - 1];
  if (!note) throw new Error(`Invalid degree ${degree}`);
  return note;
}

/**
 * Which degree (1-7) a note is in the mode, compared by pitch class so
 * enharmonics match (A# counts as Bb in F major). Null when out of scale.
 */
export function degreeOf(note: string, root: string, mode: ModeId): Degree | null {
  const chroma = Note.chroma(note);
  const index = modeNotes(root, mode).findIndex((n) => Note.chroma(n) === chroma);
  return index === -1 ? null : ((index + 1) as Degree);
}

/**
 * The major key whose notes this mode borrows ("same white keys, different home").
 * D dorian -> C, E phrygian -> C, G mixolydian -> C.
 */
export function parentMajor(root: string, mode: ModeId): string {
  const tonicOfParent = Interval.invert(modeIntervals('ionian')[MODES[mode].parentDegree - 1] ?? '1P');
  return Note.pitchClass(Note.transpose(root, tonicOfParent));
}

/** The root of `mode` that shares the notes of `majorRoot` major. C + phrygian -> E. */
export function relativeRoot(majorRoot: string, mode: ModeId): string {
  return noteOfDegree(majorRoot, 'ionian', MODES[mode].parentDegree);
}

function accidentalCount(notes: string[]): number {
  return notes.reduce((sum, n) => sum + Note.get(n).acc.length, 0);
}

/**
 * Pick the spelling of a root pitch class that yields the simplest scale.
 * chroma 3 + phrygian -> "D#" (5 sharps) rather than "Eb" (7 flats).
 */
export function simplestRoot(chroma: number, mode: ModeId): string {
  const sharp = Note.pitchClass(Note.fromMidiSharps(60 + chroma));
  const flat = Note.pitchClass(Note.fromMidi(60 + chroma));
  if (sharp === flat) return sharp;
  return accidentalCount(modeNotes(flat, mode)) <= accidentalCount(modeNotes(sharp, mode)) ? flat : sharp;
}
