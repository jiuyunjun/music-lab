import { describe, expect, it } from 'vitest';
import { DRUM_PIECES } from '../theory/drums';
import { DRUM_PIECE_COPY, DRUM_PRESETS } from './drums';

describe('DRUM_PRESETS', () => {
  it.each(DRUM_PRESETS.map((p) => [p.id, p] as const))('%s rows are 16 valid steps', (_, preset) => {
    for (const row of Object.values(preset.pattern)) expect(row).toMatch(/^[.xX]{16}$/);
  });

  it('every piece has a unique keyboard key', () => {
    const keys = DRUM_PIECES.map((p) => DRUM_PIECE_COPY[p].key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
