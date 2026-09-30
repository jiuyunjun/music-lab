import { Note } from 'tonal';
import { voiceChord, type ChordInfo } from './chords';
import { sixteenths, type NoteEvent } from './events';
import { guitarShape } from './guitar';

/** Right-hand techniques besides strumming. */
export const GUITAR_TECHNIQUES = ['tremolo', 'travis', 'pima', 'rasgueado', 'palmMute', 'harmonics'] as const;
export type GuitarTechnique = (typeof GUITAR_TECHNIQUES)[number];

/** Sounding strings of the chord, low to high, with their string number (0 = low E). */
export function chordStrings(chord: ChordInfo): { string: number; note: string }[] {
  const shape = guitarShape(chord);
  if (!shape) return voiceChord(chord.notes).map((note, i) => ({ string: i + 2, note }));
  const strings: { string: number; note: string }[] = [];
  let i = 0;
  shape.frets.forEach((fret, string) => {
    if (fret !== null) strings.push({ string, note: shape.notes[i++]! });
  });
  return strings;
}

const velocityAt = (t: number, base: number) => (t % 16 === 0 ? base : t % 4 === 0 ? base * 0.9 : base * 0.78);

/**
 * Generate one chord's worth of a picking technique. `length` and all times
 * are in sixteenths relative to the chord start; `barOffset` is where the
 * chord starts inside its bar, so patterns stay locked to the beat.
 */
export function guitarTechnique(chord: ChordInfo, technique: GuitarTechnique, length: number, barOffset = 0): NoteEvent[] {
  const strings = chordStrings(chord);
  const bass = strings[0]!.note;
  const alt = (strings[1] ?? strings[0]!).note; // alternating bass for the thumb
  const top = strings.at(-1)!.note; // melody string
  const second = (strings.at(-2) ?? strings.at(-1)!).note;
  const third = (strings.at(-3) ?? strings.at(-2) ?? strings.at(-1)!).note;
  const events: NoteEvent[] = [];
  const push = (t: number, note: string, duration: number, velocity: number, extra: Partial<NoteEvent> = {}) => {
    if (t < length) events.push({ time: sixteenths(t), note, duration: sixteenths(Math.max(1, Math.min(duration, length - t))), velocity, ...extra });
  };

  switch (technique) {
    case 'tremolo':
      // p-a-m-i: thumb plays a moving bass, then three fingers repeat the melody note.
      for (let t = 0; t < length; t += 4) {
        const beat = ((t + barOffset) % 16) / 4;
        push(t, [bass, alt, third, alt][beat] ?? bass, 4, velocityAt(t + barOffset, 0.72));
        for (let k = 1; k < 4; k++) push(t + k, top, 1, 0.5 + (k === 1 ? 0.04 : 0));
      }
      break;

    case 'travis':
      // Thumb alternates bass strings on the beat; fingers pick the top strings between.
      for (let t = 0; t < length; t += 2) {
        const slot = ((t + barOffset) % 16) / 2;
        if (slot % 2 === 0) {
          push(t, slot % 4 === 0 ? bass : alt, 4, velocityAt(t + barOffset, 0.85));
          if (slot === 0) push(t, top, 4, 0.72); // the "pinch" on beat 1
        } else {
          push(t, slot % 4 === 1 ? second : top, 4, 0.7);
        }
      }
      break;

    case 'pima': {
      // Classical arpeggio: thumb, index, middle, ring, and back.
      const order = [bass, third, second, top, second, third, second, top];
      for (let t = 0; t < length; t += 2) push(t, order[((t + barOffset) % 16) / 2]!, 4, velocityAt(t + barOffset, 0.95));
      break;
    }

    case 'rasgueado': {
      // Flamenco: a fast four-finger roll on beats 1 and 3, a down-up in between.
      const spread = 0.006;
      const strum = (t: number, down: boolean, velocity: number, delay = 0) => {
        const order = down ? strings : [...strings].reverse().slice(0, 4);
        order.forEach(({ note }, i) => push(t, note, 4, velocity, { offset: Math.round((delay + i * spread) * 1000) / 1000 }));
      };
      for (let t = 0; t < length; t += 4) {
        const beat = ((t + barOffset) % 16) / 4;
        if (beat % 2 === 0) [0, 0.045, 0.09, 0.135].forEach((d, k) => strum(t, true, 0.3 + k * 0.08, d));
        else {
          strum(t, true, 0.5);
          strum(t + 2, false, 0.38);
        }
      }
      break;
    }

    case 'palmMute': {
      // Chug the low strings in eighths, muted by the palm; accents on the beat.
      const low = strings.slice(0, 3);
      for (let t = 0; t < length; t += 2) {
        low.forEach(({ note }, i) =>
          push(t, note, 1, velocityAt(t + barOffset, 0.48), { offset: i * 0.004, articulation: 'muted' }),
        );
      }
      break;
    }

    case 'harmonics': {
      // Bell-like harmonics an octave up, picked slowly across the top strings.
      const bells = strings.slice(-4).map(({ note }) => Note.transpose(note, '8P'));
      for (let t = 0; t < length; t += 4) {
        const beat = ((t + barOffset) % 16) / 4;
        push(t, bells[beat % bells.length]!, 8, 0.7, { articulation: 'harmonic' });
      }
      break;
    }
  }
  return events;
}
