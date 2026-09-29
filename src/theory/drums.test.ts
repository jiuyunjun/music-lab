import { describe, expect, it } from 'vitest';
import { drumEvents, hitsAt, normalizePattern, toggleCell } from './drums';

describe('normalizePattern', () => {
  it('fills rows and fixes lengths', () => {
    const p = normalizePattern({ kick: 'x...x' });
    expect(p.kick).toBe('x...x...........');
    expect(p.snare).toBe('................');
  });
});

describe('toggleCell', () => {
  it('cycles rest -> hit -> accent -> rest', () => {
    expect(toggleCell('....', 1)).toBe('.x..');
    expect(toggleCell('.x..', 1)).toBe('.X..');
    expect(toggleCell('.X..', 1)).toBe('....');
  });
});

describe('hitsAt / drumEvents', () => {
  const backbeat = { kick: 'X.......x.......', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };

  it('reads hits per step with accents', () => {
    expect(hitsAt(backbeat, 0)).toEqual([
      { piece: 'hat', velocity: 0.72 },
      { piece: 'kick', velocity: 1 },
    ]);
    expect(hitsAt(backbeat, 1)).toEqual([]);
  });

  it('times events in sixteenths across bars', () => {
    const events = drumEvents(backbeat, 2);
    expect(events.filter((e) => e.piece === 'snare').map((e) => e.time)).toEqual(['0:0:4', '0:0:12', '0:0:20', '0:0:28']);
    expect(events.at(-1)?.step).toBe(14);
  });
});
