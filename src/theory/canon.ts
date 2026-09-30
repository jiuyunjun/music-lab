import { Note } from 'tonal';
import type { ChordInfo } from './chords';
import { sixteenths, type NoteEvent } from './events';
import { modeNotesInRange, type ModeId } from './modes';
import { createRng } from './random';

/** Note length per variation, in sixteenths: half, quarter, eighth, sixteenth notes. */
export const CANON_NOTE_LENGTHS = [8, 4, 2, 1] as const;

export interface CanonOptions {
  tonic: string;
  mode: ModeId;
  beatsPerChord?: number;
  seed: number;
  /** Variation number: 0 = half notes, 1 = quarters, 2 = eighths, 3+ = sixteenths. */
  level: number;
  low?: string;
  high?: string;
}

const midi = (note: string) => Note.midi(note) ?? 0;

/**
 * One variation of a Pachelbel-style canon line.
 *
 * Why this sounds good when several variations play at once:
 * - every beat (the "anchors") is a chord tone, so stacked voices always
 *   agree on the beat;
 * - anchors drift down by step, like Pachelbel's F#-E-D-C#-B-A line, and
 *   leap back up when they get low;
 * - notes between anchors are scale steps leading into the next anchor
 *   (passing tones), or a turn around the anchor when there's no room;
 * - each variation is twice as busy as the one before.
 */
export function canonLine(chords: ChordInfo[], options: CanonOptions): NoteEvent[] {
  const { tonic, mode, beatsPerChord = 2, seed, level, low = 'D4', high = 'D6' } = options;
  const rng = createRng(seed);
  const noteLength = CANON_NOTE_LENGTHS[Math.min(level, CANON_NOTE_LENGTHS.length - 1)]!;
  const spacing = Math.max(noteLength, 4); // anchors on every beat, or every half note
  const chordLength = beatsPerChord * 4;
  const total = chords.length * chordLength;
  const pool = modeNotesInRange(tonic, mode, low, high);
  const poolMidi = pool.map(midi);
  const top = midi(high);
  const bottom = midi(low);

  const chordTonesAt = (t: number) => {
    const chord = chords[Math.min(chords.length - 1, Math.floor(t / chordLength))]!;
    const chromas = new Set(chord.notes.map((n) => Note.chroma(n)));
    return pool.filter((n) => chromas.has(Note.chroma(n)));
  };

  // 1. Anchors: a chord tone on every anchor time, drifting downward by step.
  const anchors: string[] = [];
  let previous = bottom + Math.round((top - bottom) * 0.7);
  for (let t = 0; t < total; t += spacing) {
    const tones = chordTonesAt(t);
    const target = previous < bottom + 5 ? previous + 7 : previous - 2;
    const ranked = [...tones].sort((a, b) => Math.abs(midi(a) - target) - Math.abs(midi(b) - target));
    const pick = (rng.chance(0.25) ? ranked[1] : ranked[0]) ?? ranked[0]!;
    anchors.push(pick);
    previous = midi(pick);
  }

  // 2. Fill between anchors with scale steps.
  const indexOf = (note: string) => {
    const m = midi(note);
    const i = poolMidi.findIndex((p) => p >= m);
    return i === -1 ? pool.length - 1 : i;
  };
  const at = (i: number) => pool[Math.max(0, Math.min(pool.length - 1, i))]!;

  const events: NoteEvent[] = [];
  anchors.forEach((anchor, a) => {
    const start = a * spacing;
    const count = spacing / noteLength;
    const from = indexOf(anchor);
    const to = indexOf(anchors[a + 1] ?? anchor);
    const distance = Math.abs(to - from);
    const dir = Math.sign(to - from) || 1;

    let figure: string[];
    if (count === 1) figure = [anchor];
    else if (count === 2) figure = distance >= 2 ? [anchor, at(from + dir)] : [anchor, at(from - dir)];
    else if (distance >= count) figure = Array.from({ length: count }, (_, i) => at(from + dir * i));
    else figure = [anchor, at(from - dir), anchor, at(from + dir)]; // turn: lower/upper neighbour, then step on

    figure.forEach((note, i) => {
      const t = start + i * noteLength;
      if (t >= total) return;
      events.push({
        time: sixteenths(t),
        note,
        duration: sixteenths(noteLength),
        velocity: t % 16 === 0 ? 0.82 : t % 4 === 0 ? 0.74 : 0.64,
      });
    });
  });
  return events;
}
