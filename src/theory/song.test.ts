import { describe, expect, it } from 'vitest';
import { Note } from 'tonal';
import { bassLine } from './bass';
import { romanToChord } from './chords';
import { parseSixteenths, shiftEvent } from './events';
import { generateMelody } from './melody';
import { degreeOf } from './modes';
import { createRng } from './random';
import { buildSong, entryCycle, type SongSpec } from './song';

const chords = ['I', 'V', 'vi', 'IV'].map((r) => romanToChord('C', r));
const chroma = (n: string) => Note.chroma(n);

describe('createRng', () => {
  it('is deterministic per seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a.next(), a.next()]).toEqual([b.next(), b.next()]);
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });
});

describe('shiftEvent / parseSixteenths', () => {
  it('moves events in sixteenths', () => {
    expect(parseSixteenths('1:2:3')).toBe(27);
    expect(shiftEvent({ time: '0:0:4', note: 'C4', duration: '0:0:1', velocity: 1 }, 16).time).toBe('0:0:20');
  });
});

describe('bassLine', () => {
  it('root plays one long note per chord', () => {
    expect(bassLine(chords, 'root').map((e) => e.note)).toEqual(['C3', 'G2', 'A2', 'F2']);
  });

  it('octave alternates root and octave', () => {
    expect(bassLine([chords[0]!], 'octave').slice(0, 4).map((e) => e.note)).toEqual(['C3', 'C4', 'C3', 'C4']);
  });

  it('rootFifth plays the fifth on beat 3', () => {
    expect(bassLine([chords[0]!], 'rootFifth').map((e) => e.note)).toEqual(['C3', 'G3']);
  });

  it('walking steps into the next root from a half step below', () => {
    const walk = bassLine(chords, 'walking');
    expect(walk.slice(0, 4).map((e) => e.note)).toEqual(['C3', 'E3', 'G3', 'F#2']); // -> G2
    expect(walk).toHaveLength(16);
  });
});

describe('generateMelody', () => {
  const opts = { tonic: 'C', mode: 'ionian' as const, seed: 7 };

  it('is reproducible', () => {
    expect(generateMelody(chords, opts)).toEqual(generateMelody(chords, opts));
    expect(generateMelody(chords, { ...opts, seed: 8 })).not.toEqual(generateMelody(chords, opts));
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])('seed %i: strong beats are chord tones, others in the scale', (seed) => {
    for (const e of generateMelody(chords, { ...opts, seed })) {
      const t = parseSixteenths(e.time);
      const chord = chords[Math.floor(t / 16)]!;
      if (t % 8 === 0) expect(chord.notes.map(chroma)).toContain(chroma(e.note));
      else expect(degreeOf(e.note, 'C', 'ionian')).not.toBeNull();
      expect(Note.midi(e.note)).toBeGreaterThanOrEqual(Note.midi('C4')!);
      expect(Note.midi(e.note)).toBeLessThanOrEqual(Note.midi('A5')!);
    }
  });

  it('ends on the tonic, held to the end of the progression', () => {
    const last = generateMelody(chords, opts).at(-1)!;
    expect(chroma(last.note)).toBe(chroma('C')); // IV chord has C as a chord tone
    expect(parseSixteenths(last.time) + parseSixteenths(last.duration)).toBe(64);
  });
});

const spec: SongSpec = {
  tonic: 'C',
  mode: 'ionian',
  progression: ['I', 'V', 'vi', 'IV'],
  beatsPerChord: 4,
  cycles: 3,
  drums: { on: true, pattern: { kick: 'X.......X.......', snare: '....X.......X...' } },
  bass: { on: true, style: 'root' },
  harmony: { on: true, pattern: 'block' },
  melody: { on: true, style: 'generated', seed: 3, double: false },
  tricks: { build: false, fill: false, lift: false },
};

describe('buildSong', () => {
  it('lays every track across all cycles', () => {
    const song = buildSong(spec);
    expect(song.cycleLength).toBe(64);
    expect(song.length).toBe(192);
    const tracks = new Set(song.events.map((e) => e.track));
    expect([...tracks].sort()).toEqual(['bass', 'chords', 'drums', 'melody']);
    expect(song.events.filter((e) => e.track === 'bass' && e.cycle === 2)[0]?.time).toBe('0:0:128');
  });

  it('build brings layers in one by one', () => {
    const song = buildSong({ ...spec, tricks: { ...spec.tricks, build: true } });
    const tracksIn = (c: number) => [...new Set(song.events.filter((e) => e.cycle === c).map((e) => e.track))].sort();
    expect(tracksIn(0)).toEqual(['chords']);
    expect(tracksIn(1)).toEqual(['bass', 'chords', 'drums']);
    expect(tracksIn(2)).toEqual(['bass', 'chords', 'drums', 'melody']);
    expect(entryCycle('melody', 2, true)).toBe(1);
  });

  it('fill swaps the last beat for toms and adds a crash on the next cycle', () => {
    const song = buildSong({ ...spec, tricks: { ...spec.tricks, fill: true } });
    const endOfFirst = song.events.filter((e) => e.track === 'drums' && e.cycle === 0 && parseSixteenths(e.time) >= 60);
    expect(endOfFirst.map((e) => e.note)).toEqual(['tomHigh', 'tomHigh', 'tomLow', 'tomLow']);
    expect(song.events.some((e) => e.note === 'crash' && e.time === '0:0:64')).toBe(true);
  });

  it('lift raises the last cycle by a half step, drums untouched', () => {
    const plain = buildSong(spec);
    const lifted = buildSong({ ...spec, tricks: { ...spec.tricks, lift: true } });
    const firstBass = (s: typeof plain, c: number) => s.events.find((e) => e.track === 'bass' && e.cycle === c)!.note;
    expect(firstBass(lifted, 0)).toBe('C3');
    expect(Note.midi(firstBass(lifted, 2))! - Note.midi(firstBass(plain, 2))!).toBe(1);
    expect(lifted.events.filter((e) => e.track === 'drums').map((e) => e.note)).toEqual(
      plain.events.filter((e) => e.track === 'drums').map((e) => e.note),
    );
  });

  it('canon brings the previous line back as a second voice', () => {
    const song = buildSong({ ...spec, melody: { ...spec.melody, style: 'canon' } });
    const melody0 = song.events.filter((e) => e.track === 'melody' && e.cycle === 0).map((e) => e.note);
    const counter1 = song.events.filter((e) => e.track === 'counter' && e.cycle === 1).map((e) => e.note);
    expect(counter1).toEqual(melody0);
    expect(song.events.some((e) => e.track === 'counter' && e.cycle === 0)).toBe(false);
  });

  it('canon gets busier each pass and stacks up to three voices', () => {
    const song = buildSong({ ...spec, cycles: 4, melody: { ...spec.melody, style: 'canon' } });
    const count = (track: string, c: number) => song.events.filter((e) => e.track === track && e.cycle === c).length;
    expect([0, 1, 2, 3].map((c) => count('melody', c))).toEqual([8, 16, 32, 64]); // half notes -> sixteenths
    expect([0, 1, 2, 3].map((c) => count('counter', c))).toEqual([0, 8, 8 + 16, 16 + 32]);
  });
});
