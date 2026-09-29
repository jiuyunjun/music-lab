import { describe, expect, it } from 'vitest';
import { computerKeyToNote, keyId, pianoKeys } from './keyboard';

describe('pianoKeys', () => {
  it('lists one octave with black keys marked', () => {
    const keys = pianoKeys('C4', 'C5');
    expect(keys).toHaveLength(13);
    expect(keys.filter((k) => k.isBlack).map((k) => k.note)).toEqual(['C#4', 'D#4', 'F#4', 'G#4', 'A#4']);
    expect(keys[0]).toEqual({ midi: 60, note: 'C4', isBlack: false });
  });
});

describe('keyId', () => {
  it('normalises spellings to the keyboard id', () => {
    expect(keyId('Bb3')).toBe('A#3');
    expect(keyId('Fb4')).toBe('E4');
    expect(keyId('C4')).toBe('C4');
  });
});

describe('computerKeyToNote', () => {
  it('maps the home row to white keys', () => {
    expect(computerKeyToNote('a', 4)).toBe('C4');
    expect(computerKeyToNote('W', 4)).toBe('C#4');
    expect(computerKeyToNote('k', 3)).toBe('C4');
    expect(computerKeyToNote('q', 4)).toBeNull();
  });
});
