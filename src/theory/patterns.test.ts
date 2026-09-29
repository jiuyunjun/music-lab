import { describe, expect, it } from 'vitest';
import { romanToChord } from './chords';
import { accompany, progressionLength } from './patterns';

const chords = ['I', 'IV'].map((r) => romanToChord('C', r));

describe('accompany', () => {
  it('pad holds each chord for the whole bar with the bass underneath', () => {
    const events = accompany(chords, { pattern: 'pad' });
    const first = events.filter((e) => e.step === 0);
    expect(first.filter((e) => e.track === 'bass').map((e) => e.note)).toEqual(['C3']);
    expect(first.filter((e) => e.track === 'chords')).toHaveLength(3);
    expect(first.every((e) => e.duration === '0:0:16')).toBe(true);
    expect(events.find((e) => e.step === 1)?.time).toBe('0:0:16');
  });

  it('block hits twice per 4-beat bar', () => {
    const times = new Set(accompany(chords, { pattern: 'block', bass: false }).filter((e) => e.step === 0).map((e) => e.time));
    expect([...times]).toEqual(['0:0:0', '0:0:8']);
  });

  it('alberti plays low-high-middle-high in eighths', () => {
    const notes = accompany([chords[0]!], { pattern: 'alberti', bass: false }).slice(0, 4).map((e) => e.note);
    const [low, high, middle] = [notes[0], notes[1], notes[2]];
    expect(notes[3]).toBe(high);
    expect(new Set([low, high, middle]).size).toBe(3);
  });

  it('arpeggio fills the bar with eighth notes', () => {
    expect(accompany([chords[0]!], { pattern: 'arpeggio', bass: false })).toHaveLength(8);
  });

  it('respects beatsPerChord', () => {
    const events = accompany(chords, { pattern: 'pad', beatsPerChord: 2 });
    expect(events.find((e) => e.step === 1)?.time).toBe('0:0:8');
    expect(progressionLength(2, 2)).toBe('0:0:16');
  });
});
