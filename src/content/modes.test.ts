import { describe, expect, it } from 'vitest';
import { romanToChord } from '../theory/chords';
import { degreeToNote } from '../theory/events';
import { MODES, MODE_IDS, noteOfDegree } from '../theory/modes';
import { MODE_COPY } from './modes';

describe('MODE_COPY demos', () => {
  it.each(MODE_IDS)('%s demo is exactly 5 bars', (mode) => {
    const total = MODE_COPY[mode].demo.reduce((sum, [, , length]) => sum + length, 0);
    expect(total).toBe(80);
  });

  it.each(MODE_IDS)('%s demo ends on the tonic', (mode) => {
    expect(MODE_COPY[mode].demo.at(-1)?.[0]).toBe(1);
  });

  it.each(MODE_IDS)('%s vamp colour chord contains the characteristic note', (mode) => {
    const colourChord = romanToChord('D', MODE_COPY[mode].vamp[1]);
    const colourNote = noteOfDegree('D', mode, MODES[mode].characteristicDegree);
    expect(colourChord.notes).toContain(colourNote);
  });

  it('demo notes stay inside the mode', () => {
    expect(degreeToNote('D4', 'dorian', 6)).toBe('B4');
  });
});
