import { describe, expect, it } from 'vitest';
import { romanToChord } from '../theory/chords';
import { PROGRESSIONS } from './chords';

describe('PROGRESSIONS', () => {
  it.each(PROGRESSIONS.map((p) => [p.id, p] as const))('%s parses in its key', (_, preset) => {
    expect(() => preset.romans.map((r) => romanToChord(preset.key, r))).not.toThrow();
  });

  it('Canon in D matches the original bass line chords', () => {
    const canon = PROGRESSIONS.find((p) => p.id === 'canon')!;
    expect(canon.romans.map((r) => romanToChord(canon.key, r).symbol)).toEqual(['D', 'A', 'Bm', 'F#m', 'G', 'D', 'G', 'A']);
  });

  it('Andalusian cadence in A minor is Am G F E', () => {
    const p = PROGRESSIONS.find((x) => x.id === 'andalusian')!;
    expect(p.romans.map((r) => romanToChord(p.key, r).symbol)).toEqual(['Am', 'G', 'F', 'E']);
  });
});
