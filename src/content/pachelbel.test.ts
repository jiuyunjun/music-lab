import { describe, expect, it } from 'vitest';
import { Note } from 'tonal';
import { romanToChord } from '../theory/chords';
import { QUOTE_COPY } from './arrange';
import { QUOTE_PIECES } from './quotes';
import { PACHELBEL_VIOLIN } from './pachelbel';

const names = (i: number) => PACHELBEL_VIOLIN[i]!.map(([, n]) => n);

describe('PACHELBEL_VIOLIN', () => {
  it('has the bass-only intro plus 27 violin entries and the final note', () => {
    expect(PACHELBEL_VIOLIN[0]).toEqual([]);
    expect(PACHELBEL_VIOLIN).toHaveLength(29);
  });

  it('opens with the famous descending line F#-E-D-C#-B-A-B-C#', () => {
    expect(names(1)).toEqual(['F#5', 'E5', 'D5', 'C#5', 'B4', 'A4', 'B4', 'C#5']);
  });

  it('entry 9 is the best-known passage (A, F#G, A, F#G, A A B C# D E F# G ...)', () => {
    expect(names(9).slice(0, 14)).toEqual(['A5', 'F#5', 'G5', 'A5', 'F#5', 'G5', 'A5', 'A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'G5']);
  });

  it('every entry fits in one pass of the ground bass and notes do not overlap', () => {
    for (const segment of PACHELBEL_VIOLIN) {
      let cursor = 0;
      for (const [start, note, length] of segment) {
        expect(start).toBeGreaterThanOrEqual(cursor);
        expect(Note.midi(note)).not.toBeNull();
        cursor = start + length;
      }
      expect(cursor).toBeLessThanOrEqual(64);
    }
  });

  it('the first entry lands on a chord tone on every chord', () => {
    const chords = QUOTE_PIECES.pachelbel.song.progression.map((r) => romanToChord('D', r));
    for (const [start, note] of PACHELBEL_VIOLIN[1]!) {
      expect(chords[start / 8]!.notes.map(Note.chroma)).toContain(Note.chroma(note));
    }
  });

  it('excerpts stay inside the piece', () => {
    for (const e of QUOTE_COPY.pachelbel.excerpts) expect(e.start + e.cycles - 1).toBeLessThanOrEqual(27);
  });
});
