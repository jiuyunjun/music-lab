import { describe, expect, it } from 'vitest';
import { Note } from 'tonal';
import { buildChord, diatonicChords, romanToChord } from './chords';
import { guitarShape, noteAt, parseFrets, shapeChromas } from './guitar';

const chromas = (notes: string[]) => new Set(notes.map((n) => Note.chroma(n)));

describe('noteAt', () => {
  it('reads standard tuning', () => {
    expect(noteAt(0, 0)).toBe('E2');
    expect(noteAt(0, 5)).toBe('A2');
    expect(noteAt(5, 12)).toBe('E5');
  });
});

describe('parseFrets', () => {
  it('parses x as muted', () => {
    expect(parseFrets('x32010')).toEqual([null, 3, 2, 0, 1, 0]);
  });
});

describe('guitarShape', () => {
  it('uses the familiar open C shape', () => {
    const c = guitarShape(buildChord('C', ''));
    expect(c?.frets).toEqual([null, 3, 2, 0, 1, 0]);
    expect(c?.notes).toEqual(['C3', 'E3', 'G3', 'C4', 'E4']);
    expect(c?.position).toBe(0);
  });

  it('falls back to barre chords', () => {
    const bb = guitarShape(buildChord('Bb', ''));
    expect(bb?.frets).toEqual([null, 1, 3, 3, 3, 1]);
    const fsm = guitarShape(buildChord('F#', 'm'));
    expect(fsm?.frets).toEqual([2, 4, 4, 2, 2, 2]);
  });

  it('finds sharps spelled as flats (A# -> Bb)', () => {
    expect(guitarShape(buildChord('A#', ''))?.frets).toEqual([null, 1, 3, 3, 3, 1]);
  });

  const cases = [
    ...['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'F#', 'B'].flatMap((k) => diatonicChords(k, 'ionian')),
    ...diatonicChords('A', 'ionian', true),
    ...['C', 'D', 'E', 'G', 'A'].flatMap((r) => ['sus2', 'sus4', 'add9', 'maj7', '7', 'm7'].map((t) => buildChord(r, t))),
    romanToChord('A', 'bVII'),
  ];

  it.each(cases.map((c) => [c.symbol, c] as const))('%s sounds only chord tones and includes root + third', (_, chord) => {
    const shape = guitarShape(chord);
    if (!shape) return; // unsupported colour on this root: the UI falls back to piano voicing
    const allowed = chromas(chord.notes);
    for (const c of shapeChromas(shape)) expect(allowed.has(c)).toBe(true);
    expect(shapeChromas(shape).has(Note.chroma(chord.notes[0]!)!)).toBe(true);
    expect(shapeChromas(shape).has(Note.chroma(chord.notes[1]!)!)).toBe(true);
    expect(shape.frets.every((f) => f === null || (f >= 0 && f <= 15))).toBe(true);
  });

  it('covers every triad in every major key', () => {
    const keys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db'];
    const missing = keys.flatMap((k) => diatonicChords(k, 'ionian')).filter((c) => !guitarShape(c));
    expect(missing.map((c) => c.symbol)).toEqual([]);
  });
});
