import * as Tone from 'tone';
import { STRUM_SPREAD } from '../theory/patterns';
import { withAudio } from './engine';
import type { Instrument } from './instruments';

/**
 * Strum a chord right now: down = low to high across all strings,
 * up = the top four strings high to low, a little softer.
 */
export function strumNow(instrument: Instrument, notes: string[], down: boolean, velocity = 0.8): void {
  const order = down ? notes : notes.slice(-4).reverse();
  withAudio(() => {
    const start = Tone.now();
    order.forEach((note, i) => instrument.play(note, '1n', start + i * STRUM_SPREAD, down ? velocity : velocity * 0.75));
  });
}
