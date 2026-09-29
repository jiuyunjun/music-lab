import { describe, expect, it } from 'vitest';
import {
  MODES_BY_BRIGHTNESS,
  characteristicNote,
  degreeOf,
  modeNotes,
  modeNotesInRange,
  parentMajor,
  relativeRoot,
  simplestRoot,
} from './modes';

describe('modeNotes', () => {
  it('spells the white-key modes', () => {
    expect(modeNotes('C', 'ionian')).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    expect(modeNotes('D', 'dorian')).toEqual(['D', 'E', 'F', 'G', 'A', 'B', 'C']);
    expect(modeNotes('E', 'phrygian')).toEqual(['E', 'F', 'G', 'A', 'B', 'C', 'D']);
    expect(modeNotes('F', 'lydian')).toEqual(['F', 'G', 'A', 'B', 'C', 'D', 'E']);
    expect(modeNotes('G', 'mixolydian')).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F']);
    expect(modeNotes('A', 'aeolian')).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(modeNotes('B', 'locrian')).toEqual(['B', 'C', 'D', 'E', 'F', 'G', 'A']);
  });

  it('uses flats in flat keys', () => {
    expect(modeNotes('F', 'ionian')).toEqual(['F', 'G', 'A', 'Bb', 'C', 'D', 'E']);
  });
});

describe('modeNotesInRange', () => {
  it('includes octave numbers', () => {
    expect(modeNotesInRange('D', 'dorian', 'D3', 'D4')).toEqual([
      'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4',
    ]);
  });
});

describe('characteristicNote', () => {
  it('finds the colour note of each mode', () => {
    expect(characteristicNote('D', 'dorian')).toBe('B'); // major 6th
    expect(characteristicNote('E', 'phrygian')).toBe('F'); // minor 2nd
    expect(characteristicNote('F', 'lydian')).toBe('B'); // augmented 4th
    expect(characteristicNote('G', 'mixolydian')).toBe('F'); // minor 7th
  });
});

describe('degreeOf', () => {
  it('returns 1-based degrees and null outside the scale', () => {
    expect(degreeOf('D4', 'D', 'dorian')).toBe(1);
    expect(degreeOf('B2', 'D', 'dorian')).toBe(6);
    expect(degreeOf('F#4', 'D', 'dorian')).toBeNull();
  });

  it('matches enharmonic spellings', () => {
    expect(degreeOf('A#3', 'F', 'ionian')).toBe(4);
  });
});

describe('parentMajor / relativeRoot', () => {
  it('D dorian and E phrygian both live on the C major white keys', () => {
    expect(parentMajor('D', 'dorian')).toBe('C');
    expect(parentMajor('E', 'phrygian')).toBe('C');
    expect(parentMajor('A', 'aeolian')).toBe('C');
    expect(parentMajor('A', 'dorian')).toBe('G');
  });

  it('finds the mode root inside a major key', () => {
    expect(relativeRoot('C', 'phrygian')).toBe('E');
    expect(relativeRoot('G', 'dorian')).toBe('A');
  });
});

describe('simplestRoot', () => {
  it('prefers the spelling with fewer accidentals', () => {
    expect(simplestRoot(3, 'phrygian')).toBe('D#'); // not Eb phrygian (Fb, Cb)
    expect(simplestRoot(3, 'ionian')).toBe('Eb'); // not D# major
    expect(simplestRoot(10, 'ionian')).toBe('Bb');
    expect(simplestRoot(2, 'dorian')).toBe('D');
  });
});

describe('MODES_BY_BRIGHTNESS', () => {
  it('orders from brightest to darkest', () => {
    expect(MODES_BY_BRIGHTNESS).toEqual([
      'lydian', 'ionian', 'mixolydian', 'dorian', 'aeolian', 'phrygian', 'locrian',
    ]);
  });
});
