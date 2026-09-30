import { describe, expect, it } from 'vitest';
import { DRUM_PIECES } from '../theory/drums';
import { DRUM_GROUPS, DRUM_PIECE_COPY, DRUM_PRESETS } from './drums';

describe('DRUM_PRESETS', () => {
  it.each(DRUM_PRESETS.map((p) => [p.id, p] as const))('%s rows are 16 valid steps', (_, preset) => {
    for (const row of Object.values(preset.pattern)) expect(row).toMatch(/^[.xX]{16}$/);
  });

  it('ids are unique and every preset is in a known group with at least one preset per group', () => {
    const ids = DRUM_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const group of DRUM_GROUPS) expect(DRUM_PRESETS.some((p) => p.group === group.id)).toBe(true);
    for (const p of DRUM_PRESETS) expect(DRUM_GROUPS.map((g) => g.id)).toContain(p.group);
  });

  it('no step plays a closed and an open hat together (the closed hat would choke the open one)', () => {
    const clashes = DRUM_PRESETS.flatMap((p) => {
      const open = p.pattern.openHat ?? '.'.repeat(16);
      const closed = p.pattern.hat ?? '.'.repeat(16);
      return [...open].flatMap((cell, i) => (cell !== '.' && closed[i] !== '.' ? [`${p.id}@${i}`] : []));
    });
    expect(clashes).toEqual([]);
  });

  it('every piece has a unique keyboard key', () => {
    const keys = DRUM_PIECES.map((p) => DRUM_PIECE_COPY[p].key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
