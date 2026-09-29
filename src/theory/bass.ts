import { Chord, Note } from 'tonal';
import { bassNote, type ChordInfo } from './chords';
import { sixteenths } from './events';
import { accent, type ArrangedEvent } from './patterns';

export const BASS_STYLES = ['root', 'pulse', 'octave', 'rootFifth', 'walking'] as const;
export type BassStyle = (typeof BASS_STYLES)[number];

/** The bass-register note `interval` above the chord's bass root. */
function above(chord: ChordInfo, index: number): string {
  const root = bassNote(chord.root);
  const interval = Chord.get(chord.symbol).intervals[index];
  return interval ? Note.transpose(root, interval) : root;
}

/**
 * A bass line under a progression:
 * - root: one long root per chord
 * - pulse: driving eighth-note roots (rock)
 * - octave: root / octave-up eighths (disco)
 * - rootFifth: root on beat 1, fifth on beat 3 (country, bossa)
 * - walking: a note every beat through the chord, stepping into the next root (jazz)
 */
export function bassLine(chords: ChordInfo[], style: BassStyle, beatsPerChord = 4): ArrangedEvent[] {
  const length = beatsPerChord * 4;
  const events: ArrangedEvent[] = [];

  chords.forEach((chord, step) => {
    const start = step * length;
    const root = bassNote(chord.root);
    const push = (at: number, note: string, duration: number, velocity: number) =>
      events.push({
        time: sixteenths(start + at),
        note,
        duration: sixteenths(duration),
        velocity: accent(start + at, velocity),
        track: 'bass',
        step,
      });

    switch (style) {
      case 'root':
        push(0, root, length, 0.85);
        break;
      case 'pulse':
        for (let t = 0; t < length; t += 2) push(t, root, 2, 0.8);
        break;
      case 'octave':
        for (let t = 0; t < length; t += 2) push(t, t % 4 === 0 ? root : Note.transpose(root, '8P'), 2, 0.8);
        break;
      case 'rootFifth':
        for (let t = 0; t < length; t += 8) push(t, t % 16 === 0 ? root : above(chord, 2), 8, 0.85);
        break;
      case 'walking': {
        const next = chords[step + 1] ?? chords[0]!;
        // Approach the next root from a half step below: the classic walking-bass pull.
        const approach = Note.transpose(bassNote(next.root), '-2m');
        const line = [root, above(chord, 1), above(chord, 2), approach];
        const beats = beatsPerChord;
        for (let b = 0; b < beats; b++) {
          const note = b === beats - 1 ? approach : (line[b] ?? root);
          push(b * 4, note, 4, 0.8);
        }
        break;
      }
    }
  });
  return events;
}
