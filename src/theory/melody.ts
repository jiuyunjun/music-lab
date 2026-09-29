import { Note } from 'tonal';
import type { ChordInfo } from './chords';
import { sixteenths, type NoteEvent } from './events';
import { modeNotesInRange, type ModeId } from './modes';
import { createRng } from './random';

/**
 * One-beat rhythm cells in sixteenths. Negative = rest.
 * A melody reuses one bar of these cells every bar: repetition is what makes
 * a random line sound like a tune.
 */
const RHYTHM_CELLS: number[][] = [[4], [2, 2], [3, 1], [2, 2], [4], [-2, 2], [1, 1, 2]];

export interface MelodyOptions {
  tonic: string;
  mode: ModeId;
  beatsPerChord?: number;
  seed: number;
  low?: string;
  high?: string;
}

function midi(note: string): number {
  return Note.midi(note) ?? 0;
}

/**
 * Generate a singable melody over a progression.
 * Rules (the ones a songwriter uses without thinking):
 * - strong beats (1 and 3) land on a chord tone, the one nearest the last note
 * - other notes move by step (one or two scale notes)
 * - the rhythm of bar 1 repeats every bar
 * - the last chord gets one long chord tone, so the phrase "lands"
 */
export function generateMelody(chords: ChordInfo[], options: MelodyOptions): NoteEvent[] {
  const { tonic, mode, beatsPerChord = 4, seed, low = 'C4', high = 'A5' } = options;
  const rng = createRng(seed);
  const pool = modeNotesInRange(tonic, mode, low, high);
  const chordLength = beatsPerChord * 4;
  const total = chords.length * chordLength;

  const barRhythm = [0, 1, 2, 3].map((beat) => {
    const cell = rng.pick(RHYTHM_CELLS);
    return beat === 0 ? cell.map(Math.abs) : cell; // never rest on the downbeat
  });

  const chordAt = (t: number) => chords[Math.min(chords.length - 1, Math.floor(t / chordLength))]!;
  const chordTones = (chord: ChordInfo) => {
    const chromas = new Set(chord.notes.map((n) => Note.chroma(n)));
    // Chord tones in range, spelled as the chord spells them.
    const tones: string[] = [];
    for (let octave = 3; octave <= 6; octave++) {
      for (const pc of chord.notes) {
        const n = `${pc}${octave}`;
        if (midi(n) >= midi(low) && midi(n) <= midi(high) && chromas.has(Note.chroma(n))) tones.push(n);
      }
    }
    return tones.sort((a, b) => midi(a) - midi(b));
  };
  const nearest = (candidates: string[], target: number) => {
    const sorted = [...candidates].sort((a, b) => Math.abs(midi(a) - target) - Math.abs(midi(b) - target));
    // A little variety: sometimes take the second nearest.
    return (rng.chance(0.25) ? sorted[1] : sorted[0]) ?? sorted[0]!;
  };

  const events: NoteEvent[] = [];
  let previous = midi('G4');
  let direction = rng.chance(0.5) ? 1 : -1;
  const lastChordStart = total - chordLength;

  bars: for (let bar = 0; bar * 16 < total; bar++) {
    let t = bar * 16;
    for (const cell of barRhythm) {
      for (const length of cell) {
        const at = t;
        t += Math.abs(length);
        if (at >= total || length < 0) continue;

        if (at >= lastChordStart) {
          // Final landing: one long chord tone, preferring the tonic.
          const tones = chordTones(chordAt(at));
          const home = tones.filter((n) => Note.chroma(n) === Note.chroma(tonic));
          const note = home.length ? home.reduce((a, b) => (Math.abs(midi(a) - previous) <= Math.abs(midi(b) - previous) ? a : b)) : nearest(tones, previous);
          events.push({ time: sixteenths(at), note, duration: sixteenths(total - at), velocity: 0.8 });
          break bars;
        }

        let note: string;
        if (at % 8 === 0) {
          note = nearest(chordTones(chordAt(at)), previous);
        } else {
          const index = pool.findIndex((n) => midi(n) >= previous);
          const from = index === -1 ? pool.length - 1 : index;
          if (from <= 1) direction = 1;
          if (from >= pool.length - 2) direction = -1;
          if (rng.chance(0.2)) direction = -direction;
          note = pool[Math.max(0, Math.min(pool.length - 1, from + direction * (rng.chance(0.7) ? 1 : 2)))]!;
        }
        previous = midi(note);
        events.push({
          time: sixteenths(at),
          note,
          duration: sixteenths(Math.abs(length)),
          velocity: at % 16 === 0 ? 0.85 : at % 4 === 0 ? 0.75 : 0.62,
        });
      }
    }
  }
  return events;
}
