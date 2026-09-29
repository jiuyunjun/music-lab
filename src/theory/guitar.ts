import { Interval, Note } from 'tonal';
import type { ChordInfo } from './chords';

/** Open strings, low E (6th string) first. */
export const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] as const;
export const FRET_COUNT = 12;

/** Frets per string low->high; null = muted string ("x"). */
export type Frets = (number | null)[];

export interface GuitarShape {
  frets: Frets;
  /** Sounding notes low->high, muted strings skipped. */
  notes: string[];
  /** 0 for open chords (any open string), otherwise the lowest fret used. */
  position: number;
}

export function noteAt(string: number, fret: number): string {
  const open = STANDARD_TUNING[string];
  if (!open) throw new Error(`Invalid string ${string}`);
  return Note.transpose(open, Interval.fromSemitones(fret));
}

export function parseFrets(shape: string): Frets {
  return shape.split('').map((c) => (c === 'x' ? null : parseInt(c, 36)));
}

/** Common open-position chords, as a guitarist would finger them. */
const OPEN_SHAPES: Record<string, string> = {
  C: 'x32010', Cmaj7: 'x32000', C7: 'x32310', Cadd9: 'x32033', Csus2: 'x30033', Csus4: 'x33011',
  D: 'xx0232', Dm: 'xx0231', D7: 'xx0212', Dmaj7: 'xx0222', Dm7: 'xx0211', Dsus2: 'xx0230', Dsus4: 'xx0233',
  E: '022100', Em: '022000', E7: '020100', Em7: '022030', Emaj7: '021100', Esus4: '022200',
  F: '133211', Fmaj7: 'xx3210',
  G: '320003', G7: '320001', Gmaj7: '320002', Gsus4: '330013', Gadd9: '300003',
  A: 'x02220', Am: 'x02210', A7: 'x02020', Am7: 'x02010', Amaj7: 'x02120', Asus2: 'x02200', Asus4: 'x02230',
  B7: 'x21202', Bm: 'x24432',
};

/** Movable barre shapes relative to the root fret: E-shape (root on 6th string) and A-shape (root on 5th). */
const BARRE_SHAPES: Record<string, { e?: number[]; a?: number[] }> = {
  '': { e: [0, 2, 2, 1, 0, 0], a: [0, 2, 2, 2, 0] },
  m: { e: [0, 2, 2, 0, 0, 0], a: [0, 2, 2, 1, 0] },
  '7': { e: [0, 2, 0, 1, 0, 0], a: [0, 2, 0, 2, 0] },
  m7: { e: [0, 2, 0, 0, 0, 0], a: [0, 2, 0, 1, 0] },
  maj7: { e: [0, 2, 1, 1, 0, 0], a: [0, 2, 1, 2, 0] },
  sus4: { e: [0, 2, 2, 2, 0, 0], a: [0, 2, 2, 3, 0] },
  sus2: { a: [0, 2, 2, 0, 0] },
  dim: { a: [0, 1, 2, 1, -99] },
  m7b5: { a: [0, 1, 0, 1, -99] },
};

function shapeFromFrets(frets: Frets): GuitarShape {
  const notes = frets.flatMap((fret, string) => (fret === null ? [] : [noteAt(string, fret)]));
  const fretted = frets.filter((f): f is number => f !== null && f > 0);
  const usesOpenStrings = frets.includes(0);
  return { frets, notes, position: usesOpenStrings || !fretted.length ? 0 : Math.min(...fretted) };
}

/** Fret (0-11) where `pitchClass` sits on the given open string. */
function rootFret(string: number, pitchClass: string): number {
  const open = Note.chroma(STANDARD_TUNING[string] ?? 'E') ?? 0;
  return ((Note.chroma(pitchClass) ?? 0) - open + 12) % 12;
}

function barre(root: string, type: string): GuitarShape | null {
  const shape = BARRE_SHAPES[type];
  if (!shape) return null;
  const options: Frets[] = [];
  if (shape.e) {
    const r = rootFret(0, root);
    options.push(shape.e.map((d) => r + d));
  }
  if (shape.a) {
    const r = rootFret(1, root);
    options.push([null, ...shape.a.map((d) => (d < -9 ? null : r + d))]);
  }
  // Prefer the shape played lowest on the neck, but never at fret 0 with a
  // negative offset.
  const valid = options.filter((f) => f.every((x) => x === null || x >= 0));
  if (!valid.length) return null;
  const lowest = valid.reduce((a, b) =>
    Math.max(...(a.filter((x) => x !== null) as number[])) <= Math.max(...(b.filter((x) => x !== null) as number[])) ? a : b,
  );
  return shapeFromFrets(lowest);
}

/**
 * A playable guitar shape for a chord: the familiar open shape when there is
 * one, otherwise a movable barre shape. Null when no shape is known.
 */
export function guitarShape(chord: Pick<ChordInfo, 'root' | 'symbol'>): GuitarShape | null {
  const type = chord.symbol.slice(chord.root.length);
  for (const root of [chord.root, Note.enharmonic(chord.root)]) {
    const open = OPEN_SHAPES[`${root}${type}`];
    if (open) return shapeFromFrets(parseFrets(open));
  }
  return barre(chord.root, type);
}

/** Pitch classes a shape actually sounds, for checking it against the chord. */
export function shapeChromas(shape: GuitarShape): Set<number> {
  return new Set(shape.notes.map((n) => Note.chroma(n) ?? -1));
}
