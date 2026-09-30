import { describe, expect, it } from 'vitest';
import { Note } from 'tonal';
import { canonLine } from './canon';
import { romanToChord } from './chords';
import { parseSixteenths } from './events';
import { degreeOf } from './modes';

// Pachelbel's progression in D, two beats per chord.
const chords = ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'].map((r) => romanToChord('D', r));
const opts = { tonic: 'D', mode: 'ionian' as const, beatsPerChord: 2, seed: 11 };
const chordAt = (t: number) => chords[Math.floor(t / 8)]!;

describe('canonLine', () => {
  it('doubles its speed with each variation', () => {
    const counts = [0, 1, 2, 3].map((level) => canonLine(chords, { ...opts, level }).length);
    expect(counts).toEqual([8, 16, 32, 64]);
  });

  it('is reproducible', () => {
    expect(canonLine(chords, { ...opts, level: 2 })).toEqual(canonLine(chords, { ...opts, level: 2 }));
  });

  it.each([0, 1, 2, 3])('level %i: every beat is a chord tone and every note is in D major', (level) => {
    for (const seed of [1, 2, 3, 4, 5, 11, 42]) {
      for (const e of canonLine(chords, { ...opts, seed, level })) {
        const t = parseSixteenths(e.time);
        if (t % 4 === 0) expect(chordAt(t).notes.map(Note.chroma)).toContain(Note.chroma(e.note));
        expect(degreeOf(e.note, 'D', 'ionian')).not.toBeNull();
        expect(Note.midi(e.note)).toBeGreaterThanOrEqual(Note.midi('D4')!);
        expect(Note.midi(e.note)).toBeLessThanOrEqual(Note.midi('D6')!);
      }
    }
  });

  it('moves mostly by step between anchors (no wide leaps inside a beat)', () => {
    const line = canonLine(chords, { ...opts, level: 3 });
    for (let i = 1; i < line.length; i++) {
      if (parseSixteenths(line[i]!.time) % 4 === 0) continue; // anchors may leap
      const jump = Math.abs(Note.midi(line[i]!.note)! - Note.midi(line[i - 1]!.note)!);
      expect(jump).toBeLessThanOrEqual(4);
    }
  });

  it('any two variations agree on every beat (they can be stacked)', () => {
    const slow = canonLine(chords, { ...opts, seed: 1, level: 1 });
    const fast = canonLine(chords, { ...opts, seed: 2, level: 3 });
    for (const e of slow) {
      const t = parseSixteenths(e.time);
      const other = fast.find((f) => parseSixteenths(f.time) === t)!;
      const tones = chordAt(t).notes.map(Note.chroma);
      expect(tones).toContain(Note.chroma(e.note));
      expect(tones).toContain(Note.chroma(other.note));
    }
  });
});
