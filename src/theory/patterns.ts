import { Note } from 'tonal';
import { bassNote, voiceChord, type ChordInfo } from './chords';
import { sixteenths, type NoteEvent } from './events';
import { guitarShape } from './guitar';

export type TrackId = 'melody' | 'chords' | 'bass';

export interface ArrangedEvent extends NoteEvent {
  track: TrackId;
  /** Index of the chord this event belongs to (for highlighting). */
  step: number;
}

/** How the chord hand plays each chord ("texture"). */
export const PATTERN_IDS = ['block', 'pad', 'broken', 'arpeggio', 'alberti', 'strum'] as const;
export type PatternId = (typeof PATTERN_IDS)[number];

/**
 * Strumming rhythms: one character per eighth note of a 4/4 bar.
 * D = down strum, U = up strum, - = let it ring.
 */
export const STRUM_PATTERNS = [
  { id: 'folk', value: 'D-DU-UDU' },
  { id: 'pop', value: 'D-D-DUDU' },
  { id: 'eighths', value: 'DDDDDDDD' },
  { id: 'ballad', value: 'D---D-DU' },
  { id: 'whole', value: 'D-------' },
] as const;

/** Seconds between neighbouring strings in a strum. */
export const STRUM_SPREAD = 0.012;

export interface AccompanyOptions {
  pattern: PatternId;
  beatsPerChord?: number;
  bass?: boolean;
  /** Only for the "strum" pattern; see STRUM_PATTERNS. */
  strumPattern?: string;
}

/** Louder on the downbeat, a little on each beat, softer in between. */
export function accent(position: number, base: number): number {
  if (position % 16 === 0) return base;
  if (position % 4 === 0) return base * 0.88;
  return base * 0.75;
}

/** Index sequences into [voicing..., top note an octave up] for the moving patterns. */
const FIGURES: Record<'broken' | 'arpeggio' | 'alberti', (size: number) => number[]> = {
  arpeggio: (n) => [...Array.from({ length: n }, (_, i) => i), n], // up, up, up, octave
  broken: (n) => [0, ...Array.from({ length: n - 1 }, (_, i) => i + 1), ...Array.from({ length: n - 2 }, (_, i) => n - 2 - i)], // up then back down
  alberti: (n) => [0, n - 1, Math.floor((n - 1) / 2), n - 1], // low, high, middle, high
};

/**
 * Turn a chord progression into playable events: a voice-led chord part in the
 * chosen texture plus an optional bass line on the roots.
 */
export function accompany(chords: ChordInfo[], options: AccompanyOptions): ArrangedEvent[] {
  const { pattern, beatsPerChord = 4, bass = true, strumPattern = STRUM_PATTERNS[0]!.value } = options;
  const length = beatsPerChord * 4; // in sixteenths
  const events: ArrangedEvent[] = [];
  let previous: string[] | undefined;

  chords.forEach((chord, step) => {
    const start = step * length;
    const voicing = voiceChord(chord.notes, previous);
    previous = voicing;
    const push = (at: number, note: string, duration: number, velocity: number, track: TrackId = 'chords', offset?: number) =>
      events.push({
        time: sixteenths(start + at),
        note,
        duration: sixteenths(duration),
        velocity,
        track,
        step,
        ...(offset ? { offset } : {}),
      });

    if (bass) {
      const root = bassNote(chord.root);
      if (pattern === 'pad' || length <= 8) push(0, root, length, 0.8, 'bass');
      else for (let t = 0; t < length; t += 8) push(t, root, 8, accent(start + t, 0.8), 'bass');
    }

    if (pattern === 'pad') {
      voicing.forEach((note) => push(0, note, length, 0.35));
    } else if (pattern === 'block') {
      const hit = Math.min(8, length);
      for (let t = 0; t < length; t += hit) voicing.forEach((note) => push(t, note, hit, accent(start + t, 0.65)));
    } else if (pattern === 'strum') {
      const strings = guitarShape(chord)?.notes ?? voicing;
      const hits: { t: number; down: boolean }[] = [];
      for (let t = 0; t < length; t += 2) {
        // Index by position in the bar so the rhythm carries across short chords.
        const slot = strumPattern[((start + t) % 16) / 2] ?? '-';
        if (slot === 'D' || slot === 'U') hits.push({ t, down: slot === 'D' });
      }
      hits.forEach(({ t, down }, i) => {
        const ring = (hits[i + 1]?.t ?? length) - t; // let strings ring until the next strum
        // Down strums hit every string low->high; up strums catch the top four, high->low.
        const order = down ? strings : strings.slice(-4).reverse();
        const velocity = accent(start + t, 0.7) * (down ? 1 : 0.75);
        order.forEach((note, j) => push(t, note, ring, velocity, 'chords', Math.round(j * STRUM_SPREAD * 1000) / 1000));
      });
    } else {
      const top = voicing[0] ? Note.transpose(voicing[0], '8P') : undefined;
      const pool = top ? [...voicing, top] : voicing;
      const figure = FIGURES[pattern](voicing.length);
      for (let t = 0, i = 0; t < length; t += 2, i++) {
        const note = pool[figure[i % figure.length] ?? 0];
        if (note) push(t, note, 2, accent(start + t, 0.62));
      }
    }
  });
  return events;
}

/** Total length of a progression in transport time. */
export function progressionLength(chordCount: number, beatsPerChord = 4): string {
  return sixteenths(chordCount * beatsPerChord * 4);
}
