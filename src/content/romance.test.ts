import { describe, expect, it } from 'vitest';
import { Note } from 'tonal';
import { romanToChord } from '../theory/chords';
import { buildSong, type SongSpec } from '../theory/song';
import { QUOTE_COPY } from './arrange';
import { QUOTE_PIECES } from './quotes';
import { ROMANCE_PROGRESSIONS, ROMANCE_SEGMENTS } from './romance';

const BAR = 12; // a 3/4 bar in sixteenths
const TRIPLET = 4 / 3;

describe('ROMANCE_SEGMENTS', () => {
  it('plays minor, minor, major, major (both repeats)', () => {
    expect(ROMANCE_SEGMENTS).toHaveLength(4);
    expect(ROMANCE_SEGMENTS[0]).toEqual(ROMANCE_SEGMENTS[1]);
    expect(ROMANCE_SEGMENTS[2]).toEqual(ROMANCE_SEGMENTS[3]);
  });

  it('opens with the famous melody B B B | B A G | G F# E | E G B over a low E', () => {
    const melody = ROMANCE_SEGMENTS[0]!.filter(([, , , v]) => v === 0.85).map(([, n]) => n);
    expect(melody.slice(0, 12)).toEqual(['B4', 'B4', 'B4', 'B4', 'A4', 'G4', 'G4', 'F#4', 'E4', 'E4', 'G4', 'B4']);
    expect(ROMANCE_SEGMENTS[0]![0]).toEqual([0, 'E2', 9 * TRIPLET, 0.68]);
  });

  it('each beat is a melody note followed by two arpeggio notes, in triplets', () => {
    const bar1 = ROMANCE_SEGMENTS[0]!.filter(([t]) => t < BAR);
    expect(bar1.map(([t, n]) => [+t.toFixed(3), n])).toEqual([
      [0, 'E2'], [0, 'B4'], [1.333, 'B3'], [2.667, 'G3'],
      [4, 'B4'], [5.333, 'B3'], [6.667, 'G3'],
      [8, 'B4'], [9.333, 'B3'], [10.667, 'G3'],
    ]);
  });

  it('every section is 16 bars of 3/4 (the last bar may end on a rest)', () => {
    for (const segment of ROMANCE_SEGMENTS) {
      const end = Math.max(...segment.map(([t, , l]) => t + l));
      expect(end).toBeGreaterThan(15 * BAR);
      expect(end).toBeLessThanOrEqual(16 * BAR + 1e-9);
    }
  });

  it('the bass of every bar belongs to that bar\'s chord', () => {
    ROMANCE_SEGMENTS.forEach((segment, s) => {
      ROMANCE_PROGRESSIONS[s]!.forEach((roman, bar) => {
        const chord = romanToChord('E', roman);
        const inBar = segment.filter(([t]) => t >= bar * BAR - 1e-9 && t < (bar + 1) * BAR - 1e-9);
        const low = inBar.reduce((a, b) => (Note.midi(b[1])! < Note.midi(a[1])! ? b : a));
        expect({ bar: bar + 1 + s * 16, ok: chord.notes.map(Note.chroma).includes(Note.chroma(low[1])) }).toEqual({ bar: bar + 1 + s * 16, ok: true });
      });
    });
  });
});

describe('romance in the arranger', () => {
  const piece = QUOTE_PIECES.romance;
  const spec: SongSpec = {
    tonic: 'E',
    mode: piece.song.mode,
    progression: piece.song.progression,
    beatsPerChord: piece.song.beatsPerChord,
    cycles: 4,
    drums: { on: false, pattern: {} },
    bass: { on: false, style: 'root' },
    harmony: { on: false, pattern: 'pima' },
    melody: { on: true, style: 'quote', seed: 1, double: false, quote: { ...piece, start: 0 } },
    tricks: { build: false, fill: false, lift: false },
  };

  it('is a solo: no canon voices and no extra ending bar', () => {
    const song = buildSong(spec);
    expect(song.events.some((e) => e.track === 'counter')).toBe(false);
    expect(song.cycleLength).toBe(16 * BAR);
    expect(song.length).toBe(4 * 16 * BAR);
  });

  it('shows minor chords in the first half and major chords in the second', () => {
    const song = buildSong(spec);
    expect(song.cycleChords[0]!.slice(0, 1)).toEqual(['Em']);
    expect(song.cycleChords[2]!.slice(0, 1)).toEqual(['E']);
  });

  it('excerpts stay inside the piece', () => {
    for (const e of QUOTE_COPY.romance.excerpts) expect(e.start + e.cycles).toBeLessThanOrEqual(ROMANCE_SEGMENTS.length);
  });
});
