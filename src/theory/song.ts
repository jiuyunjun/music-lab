import { Note } from 'tonal';
import { bassLine, type BassStyle } from './bass';
import { canonLine, canonPlan, type CanonPass } from './canon';
import { bassNote, diatonicChords, romanToChord, voiceChord } from './chords';
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

  // A canon follows a plan from its first melodic pass: rise, climax, wind down.
  const isCanon = spec.melody.on && spec.melody.style === 'canon';
  const plan = isCanon ? canonPlan(spec.cycles - melodyEntry) : [];
  const passFor = (c: number): CanonPass | undefined => plan[Math.max(0, c - melodyEntry)];

  const melodies = Array.from({ length: spec.cycles }, (_, c) => {
    const common = { tonic: spec.tonic, mode: spec.mode, beatsPerChord: spec.beatsPerChord };
    // A song wants its tune to repeat; a canon changes every pass.
    const line = isCanon
      ? canonLine(chords, { ...common, seed: spec.melody.seed + c, level: passFor(c)?.level ?? 0 })
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
      const pass = passFor(c);
      events.push(...line.map((e) => at(e, c)));
      if (spec.melody.double || pass?.climax) {
        events.push(...line.map((e) => at({ ...e, note: Note.transpose(e.note, '-8P'), velocity: e.velocity * 0.6 }, c)));
      }
      if (pass?.climax && spec.bass.on) {
        // Peak: the bass doubles an octave up for extra weight.
        events.push(...bass.map((e) => at({ ...e, note: Note.transpose(e.note, '8P'), velocity: e.velocity * 0.6 }, c)));
      }
      // Canon: lines from earlier passes come back as extra voices.
      for (let back = 1; back <= (pass?.voices ?? 0); back++) {
        const earlier = melodies[c - back];
        if (!earlier || !enters('melody', c - back)) continue;
        const softer = back === 1 ? 0.72 : 0.55;
        events.push(...earlier.map((e) => at({ ...e, track: 'counter', velocity: e.velocity * softer }, c)));
      }
    }
  }

  let length = cycleLength * spec.cycles;
  if (isCanon) {
    // Dynamic arc: every pitched part follows the plan's crescendo and fade.
    for (const e of events) {
      if (e.track !== 'drums') e.velocity *= passFor(e.cycle)?.dynamic ?? 1;
    }
    events.push(...ending(spec, events, length, spec.cycles));
    length += ENDING_LENGTH;
  }

  if (spec.tricks.lift && spec.cycles > 1) {
    const last = spec.cycles - 1;
    for (const e of events) {
      if (e.cycle >= last && e.track !== 'drums') e.note = Note.simplify(Note.transpose(e.note, '2m'));
    }
  }

  events.sort((a, b) => parseSixteenths(a.time) - parseSixteenths(b.time));
  return { events, cycleLength, length };
}

/** One bar for the final chord. */
export const ENDING_LENGTH = 16;

/**
 * A closing bar on the home chord: the progression ends on V, so without this
 * the piece would stop "in the air". Step -1 marks it as outside the progression.
 */
function ending(spec: SongSpec, events: SongEvent[], start: number, cycle: number): SongEvent[] {
  const home = diatonicChords(spec.tonic, spec.mode)[0]!;
  const lastMelody = [...events].reverse().find((e) => e.track === 'melody');
  const near = (pitchClass: string, target: number) => {
    const options = [3, 4, 5, 6].map((o) => `${pitchClass}${o}`);
    return options.reduce((a, b) => (Math.abs((Note.midi(a) ?? 0) - target) <= Math.abs((Note.midi(b) ?? 0) - target) ? a : b));
  };
  const top = near(spec.tonic, Note.midi(lastMelody?.note ?? `${spec.tonic}5`) ?? 72);
  const third = near(home.notes[1] ?? spec.tonic, (Note.midi(top) ?? 72) - 4);
  const note = (n: string, track: SongEvent['track'], velocity: number): SongEvent => ({
    time: sixteenths(start),
    note: n,
    duration: sixteenths(ENDING_LENGTH),
    velocity,
    track,
    step: -1,
    cycle,
  });
  const parts: SongEvent[] = [];
  if (spec.harmony.on) parts.push(...voiceChord(home.notes).map((n) => note(n, 'chords', 0.4)));
  if (spec.bass.on) parts.push(note(bassNote(home.root), 'bass', 0.6));
  parts.push(note(top, 'melody', 0.55), note(third, 'counter', 0.4));
  return parts;
}
