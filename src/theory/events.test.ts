import { describe, expect, it } from 'vitest';
import { degreeToNote, melodyToEvents, runToEvents } from './events';

describe('degreeToNote', () => {
  it('maps degrees in the chosen mode', () => {
    expect(degreeToNote('D4', 'dorian', 1)).toBe('D4');
    expect(degreeToNote('D4', 'dorian', 6)).toBe('B4');
    expect(degreeToNote('D4', 'aeolian', 6)).toBe('Bb4');
    expect(degreeToNote('E4', 'phrygian', 2)).toBe('F4');
  });

  it('shifts octaves', () => {
    expect(degreeToNote('D4', 'dorian', 1, 1)).toBe('D5');
    expect(degreeToNote('D4', 'dorian', 5, -1)).toBe('A3');
  });
});

describe('melodyToEvents', () => {
  it('turns degree steps into timed events and skips rests', () => {
    const events = melodyToEvents('C4', 'ionian', [
      [1, 0, 4],
      [0, 0, 2],
      [5, 0, 2],
    ]);
    expect(events).toEqual([
      { time: '0:0:0', note: 'C4', duration: '0:0:4', velocity: 0.85 },
      { time: '0:0:6', note: 'G4', duration: '0:0:2', velocity: 0.62 },
    ]);
  });

  it('plays the same phrase in another mode', () => {
    const phrase = [[3, 0, 2], [6, 0, 2]] as const;
    expect(melodyToEvents('D4', 'dorian', phrase).map((e) => e.note)).toEqual(['F4', 'B4']);
    expect(melodyToEvents('D4', 'ionian', phrase).map((e) => e.note)).toEqual(['F#4', 'B4']);
  });
});

describe('runToEvents', () => {
  it('spaces notes evenly', () => {
    expect(runToEvents(['C4', 'D4']).map((e) => e.time)).toEqual(['0:0:0', '0:0:2']);
  });
});
