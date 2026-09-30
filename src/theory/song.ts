import { Note } from 'tonal';
import { bassLine, type BassStyle } from './bass';
import { canonLine } from './canon';
import { romanToChord } from './chords';
import { drumEvents, type DrumPattern } from './drums';
import { parseSixteenths, shiftEvent, sixteenths } from './events';
import { generateMelody } from './melody';
import type { ModeId } from './modes';
import { accompany, type ArrangedEvent, type PatternId } from './patterns';

export type MelodyStyle = 'generated' | 'canon';

export interface SongSpec {
  tonic: string;
  mode: ModeId;
  progression: string[];
  beatsPerChord: number;
  /** How many times the progression plays. */
  cycles: number;
  drums: { on: boolean; pattern: DrumPattern };
  bass: { on: boolean; style: BassStyle };
  harmony: { on: boolean; pattern: PatternId; strumPattern?: string };
  melody: { on: boolean; style: MelodyStyle; seed: number; double: boolean };
  tricks: {
    /** Layers enter one by one: chords, then bass + drums, then melody. */
    build: boolean;
    /** Tom fill on the last beat of each cycle, crash on the next downbeat. */
    fill: boolean;
    /** Last cycle a half step higher. */
    lift: boolean;
  };
}

export interface SongEvent extends ArrangedEvent {
  /** Which pass through the progression (0-based). */
  cycle: number;
}

export interface Song {
  events: SongEvent[];
  cycleLength: number;
  length: number;
}

/** Cycle in which each layer first plays when "build" is on. */
export function entryCycle(layer: 'chords' | 'bass' | 'drums' | 'melody', cycles: number, build: boolean): number {
  if (!build) return 0;
  const want = layer === 'chords' ? 0 : layer === 'melody' ? 2 : 1;
  return Math.min(want, cycles - 1);
}

/** Replace the last beat of each cycle with a tom fill. */
function withFill(events: SongEvent[], cycleLength: number, cycle: number, offset: number): SongEvent[] {
  const fillStart = offset + cycleLength - 4;
  const kept = events.filter((e) => parseSixteenths(e.time) < fillStart);
  const fill: SongEvent[] = ['tomHigh', 'tomHigh', 'tomLow', 'tomLow'].map((piece, i) => ({
    time: sixteenths(fillStart + i),
    note: piece,
    duration: sixteenths(1),
    velocity: 0.7 + i * 0.08,
    track: 'drums',
    step: 0,
    cycle,
  }));
  return [...kept, ...fill];
}

/** Assemble the whole song: every track, every cycle, with the chosen tricks. */
export function buildSong(spec: SongSpec): Song {
  const chords = spec.progression.map((r) => romanToChord(spec.tonic, r));
  const cycleLength = chords.length * spec.beatsPerChord * 4;
  const events: SongEvent[] = [];
  const at = (e: ArrangedEvent, cycle: number): SongEvent => ({ ...shiftEvent(e, cycle * cycleLength), cycle });

  const harmony = accompany(chords, {
    pattern: spec.harmony.pattern,
    beatsPerChord: spec.beatsPerChord,
    bass: false,
    strumPattern: spec.harmony.strumPattern,
  });
  const bass = bassLine(chords, spec.bass.style, spec.beatsPerChord);
  const bars = Math.ceil(cycleLength / 16);
  const drums: ArrangedEvent[] = drumEvents(spec.drums.pattern, bars)
    .filter((e) => parseSixteenths(e.time) < cycleLength)
    .map((e) => ({ time: e.time, note: e.piece, duration: sixteenths(1), velocity: e.velocity, track: 'drums', step: 0 }));
  const enters = (layer: Parameters<typeof entryCycle>[0], c: number) => c >= entryCycle(layer, spec.cycles, spec.tricks.build);
  const melodyEntry = entryCycle('melody', spec.cycles, spec.tricks.build);

  const melodies = Array.from({ length: spec.cycles }, (_, c) => {
    const common = { tonic: spec.tonic, mode: spec.mode, beatsPerChord: spec.beatsPerChord };
    // A song wants its tune to repeat; a canon gets busier every pass (half notes -> sixteenths).
    const line =
      spec.melody.style === 'canon'
        ? canonLine(chords, { ...common, seed: spec.melody.seed + c, level: Math.max(0, c - melodyEntry) })
        : generateMelody(chords, { ...common, seed: spec.melody.seed });
    return line.map((e): ArrangedEvent => ({ ...e, track: 'melody', step: Math.floor(parseSixteenths(e.time) / (spec.beatsPerChord * 4)) }));
  });

  for (let c = 0; c < spec.cycles; c++) {
    if (spec.harmony.on && enters('chords', c)) events.push(...harmony.map((e) => at(e, c)));
    if (spec.bass.on && enters('bass', c)) events.push(...bass.map((e) => at(e, c)));

    if (spec.drums.on && enters('drums', c)) {
      let cycleDrums = drums.map((e) => at(e, c));
      if (spec.tricks.fill && c < spec.cycles - 1) cycleDrums = withFill(cycleDrums, cycleLength, c, c * cycleLength);
      if (spec.tricks.fill && c > entryCycle('drums', spec.cycles, spec.tricks.build)) {
        cycleDrums.push({ time: sixteenths(c * cycleLength), note: 'crash', duration: sixteenths(1), velocity: 0.9, track: 'drums', step: 0, cycle: c });
      }
      events.push(...cycleDrums);
    }

    if (spec.melody.on && enters('melody', c)) {
      const line = melodies[c] ?? [];
      events.push(...line.map((e) => at(e, c)));
      if (spec.melody.double) {
        events.push(...line.map((e) => at({ ...e, note: Note.transpose(e.note, '-8P'), velocity: e.velocity * 0.55 }, c)));
      }
      // Canon: the lines from the previous two passes come back as second and third voices.
      if (spec.melody.style === 'canon') {
        [1, 2].forEach((back) => {
          const earlier = melodies[c - back];
          if (!earlier || !enters('melody', c - back)) return;
          const softer = back === 1 ? 0.72 : 0.55;
          events.push(...earlier.map((e) => at({ ...e, track: 'counter', velocity: e.velocity * softer }, c)));
        });
      }
    }
  }

  if (spec.tricks.lift && spec.cycles > 1) {
    const last = spec.cycles - 1;
    for (const e of events) {
      if (e.cycle === last && e.track !== 'drums') e.note = Note.simplify(Note.transpose(e.note, '2m'));
    }
  }

  events.sort((a, b) => parseSixteenths(a.time) - parseSixteenths(b.time));
  return { events, cycleLength, length: cycleLength * spec.cycles };
}
