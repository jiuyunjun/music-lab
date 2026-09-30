import { Interval, Note } from 'tonal';
import { bassLine, type BassStyle } from './bass';
import { canonLine, canonPlan, type CanonPass } from './canon';
import { bassNote, diatonicChords, romanToChord, voiceChord } from './chords';
import { drumEvents, type DrumPattern } from './drums';
import { parseSixteenths, shiftEvent, sixteenths, type NoteEvent } from './events';
import { generateMelody } from './melody';
import type { ModeId } from './modes';
import { accompany, type ArrangedEvent, type PatternId } from './patterns';

/**
 * generated: a tune that repeats every pass; canon: generated canon variations;
 * quote: a written-out line (e.g. Pachelbel's own violin part), one segment per pass.
 */
export type MelodyStyle = 'generated' | 'canon' | 'quote';

/**
 * [start, pitch, length, velocity?] within one pass, in sixteenths. Times may be
 * fractional (a triplet eighth is 4/3 of a sixteenth).
 */
export type QuoteNote = readonly [start: number, note: string, length: number, velocity?: number];

export interface Quote {
  /** Key the segments are written in; they're transposed to the song's tonic. */
  key: string;
  /** One segment per pass. */
  segments: readonly (readonly QuoteNote[])[];
  /** Segment played on the first melodic pass. */
  start: number;
  /** Earlier segments that sound at the same time, as in a canon (default 2; 0 for a solo piece). */
  voices?: number;
  /** Chords per segment (roman numerals), when sections differ; otherwise the song's progression. */
  progressions?: readonly (readonly string[])[];
  /** Add a closing bar on the home chord (default true). */
  ending?: boolean;
}

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
  melody: { on: boolean; style: MelodyStyle; seed: number; double: boolean; quote?: Quote };
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
  /** Chord symbols of each pass (they differ when a quote brings its own sections). */
  cycleChords: string[][];
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

  const chordLength = spec.beatsPerChord * 4;
  const toArranged = (line: NoteEvent[]) =>
    line.map((e): ArrangedEvent => ({ ...e, track: 'melody', step: Math.floor(parseSixteenths(e.time) / chordLength) }));

  // A quoted line: segment k plays on the k-th melodic pass, and (as in a real canon)
  // earlier segments can sound at the same time as extra voices.
  const quote = spec.melody.on && spec.melody.style === 'quote' ? spec.melody.quote : undefined;
  const quoteSegment = (c: number) => (quote ? quote.start + c - melodyEntry : -1);
  const quoteLine = (index: number) => (quote ? toArranged(quoteEvents(quote, index, spec.tonic)) : []);

  // Chords per pass: a quote may bring different chords for each section.
  const chordsFor = (c: number) => {
    const romans = quote?.progressions?.[quoteSegment(c)];
    return romans ? romans.map((r) => romanToChord(spec.tonic, r)) : chords;
  };
  const layerCache = new Map<string, { harmony: ArrangedEvent[]; bass: ArrangedEvent[] }>();
  const layersFor = (c: number) => {
    const passChords = chordsFor(c);
    const key = passChords.map((ch) => ch.symbol).join();
    let layers = layerCache.get(key);
    if (!layers) {
      layers = {
        harmony: accompany(passChords, {
          pattern: spec.harmony.pattern,
          beatsPerChord: spec.beatsPerChord,
          bass: false,
          strumPattern: spec.harmony.strumPattern,
        }),
        bass: bassLine(passChords, spec.bass.style, spec.beatsPerChord),
      };
      layerCache.set(key, layers);
    }
    return layers;
  };

  const melodies = Array.from({ length: spec.cycles }, (_, c) => {
    if (quote) return quoteLine(quoteSegment(c));
    const common = { tonic: spec.tonic, mode: spec.mode, beatsPerChord: spec.beatsPerChord };
    // A song wants its tune to repeat; a canon changes every pass.
    return toArranged(
      isCanon
        ? canonLine(chords, { ...common, seed: spec.melody.seed + c, level: passFor(c)?.level ?? 0 })
        : generateMelody(chords, { ...common, seed: spec.melody.seed }),
    );
  });

  for (let c = 0; c < spec.cycles; c++) {
    const { harmony, bass } = layersFor(c);
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
      // Quote: in a canon the other voices are always one and two segments behind,
      // even on the first pass of an excerpt - that's where they are in the piece.
      for (let back = 1; back <= (quote?.voices ?? 2) && quote; back++) {
        const softer = back === 1 ? 0.85 : 0.75;
        events.push(...quoteLine(quoteSegment(c) - back).map((e) => at({ ...e, track: 'counter', velocity: e.velocity * softer }, c)));
      }
    }
  }

  let length = cycleLength * spec.cycles;
  if (isCanon) {
    // Dynamic arc: every pitched part follows the plan's crescendo and fade.
    for (const e of events) {
      if (e.track !== 'drums') e.velocity *= passFor(e.cycle)?.dynamic ?? 1;
    }
  }
  if (isCanon || (quote && quote.ending !== false)) {
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
  const cycleChords = Array.from({ length: spec.cycles }, (_, c) => chordsFor(c).map((ch) => ch.symbol));
  return { events, cycleLength, length, cycleChords };
}

/**
 * One segment of a quote as note events, moved from the quote's key to the
 * song's tonic by the nearest interval (D -> C goes down a tone, not up a seventh).
 * Out-of-range segments are silent.
 */
export function quoteEvents(quote: Quote, index: number, tonic: string): NoteEvent[] {
  const segment = quote.segments[index];
  if (!segment || index < 0) return [];
  const up = Interval.semitones(Interval.distance(quote.key, tonic)) ?? 0;
  const shift = Interval.fromSemitones(up > 6 ? up - 12 : up);
  return segment.map(([t, note, length, velocity]) => ({
    time: sixteenths(t),
    note: Note.simplify(Note.transpose(note, shift)),
    duration: sixteenths(length),
    velocity: velocity ?? (t % 16 === 0 ? 0.8 : t % 4 === 0 ? 0.72 : 0.64),
  }));
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
