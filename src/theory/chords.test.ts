import { describe, expect, it } from 'vitest';
import { Note } from 'tonal';
import {
  bassNote,
  buildChord,
  diatonicChords,
  displayRoman,
  harmonicFunctions,
  reharmonize,
  romanToChord,
  voiceChord,
} from './chords';

describe('romanToChord', () => {
  it('reads case as major/minor', () => {
    expect(romanToChord('D', 'I').symbol).toBe('D');
    expect(romanToChord('D', 'vi').symbol).toBe('Bm');
    expect(romanToChord('D', 'iii').notes).toEqual(['F#', 'A', 'C#']);
  });

  it('handles accidentals, sevenths and diminished', () => {
    expect(romanToChord('A', 'bVII').symbol).toBe('G');
    expect(romanToChord('A', 'bVI').symbol).toBe('F');
    expect(romanToChord('E', 'bII').symbol).toBe('F');
    expect(romanToChord('C', 'V7').symbol).toBe('G7');
    expect(romanToChord('C', 'ii7').symbol).toBe('Dm7');
    expect(romanToChord('C', 'IVmaj7').symbol).toBe('Fmaj7');
    expect(romanToChord('C', 'vii°').symbol).toBe('Bdim');
  });

  it('spells the Canon in D progression', () => {
    const canon = ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'].map((r) => romanToChord('D', r).symbol);
    expect(canon).toEqual(['D', 'A', 'Bm', 'F#m', 'G', 'D', 'G', 'A']);
  });
});

describe('displayRoman', () => {
  it('uses real accidental signs', () => {
    expect(displayRoman('bVII')).toBe('♭VII');
    expect(displayRoman('#iv')).toBe('♯iv');
    expect(displayRoman('vi')).toBe('vi');
  });
});

describe('buildChord', () => {
  it('builds colour chords', () => {
    expect(buildChord('C', 'sus4').notes).toEqual(['C', 'F', 'G']);
    expect(buildChord('C', 'add9').notes).toEqual(['C', 'E', 'G', 'D']);
    expect(buildChord('Bb', 'maj7').notes).toEqual(['Bb', 'D', 'F', 'A']);
  });
});

describe('diatonicChords', () => {
  it('lists the chords of C major', () => {
    const chords = diatonicChords('C', 'ionian');
    expect(chords.map((c) => c.symbol)).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']);
    expect(chords.map((c) => c.roman)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
  });

  it('marks borrowed degrees in minor with flats', () => {
    const chords = diatonicChords('A', 'aeolian');
    expect(chords.map((c) => c.symbol)).toEqual(['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G']);
    expect(chords.map((c) => c.roman)).toEqual(['i', 'ii°', 'bIII', 'iv', 'v', 'bVI', 'bVII']);
  });

  it('builds sevenths', () => {
    const chords = diatonicChords('C', 'ionian', true);
    expect(chords.map((c) => c.symbol)).toEqual(['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5']);
    expect(chords.map((c) => c.roman)).toEqual(['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'viiø7']);
  });

  it('round-trips through romanToChord', () => {
    for (const c of diatonicChords('F', 'dorian')) {
      expect(romanToChord('F', c.roman).symbol).toBe(c.symbol);
    }
  });
});

describe('reharmonize', () => {
  it('moves each chord to the same step of the new mode', () => {
    expect(reharmonize(['I', 'V', 'vi', 'IV'], 'dorian')).toEqual(['i', 'v', 'vi°', 'IV']);
    expect(reharmonize(['I', 'V', 'vi', 'IV'], 'aeolian')).toEqual(['i', 'v', 'bVI', 'iv']);
    expect(reharmonize(['i', 'bVII', 'bVI', 'V'], 'ionian')).toEqual(['I', 'vii°', 'vi', 'V']);
  });

  it('keeps sevenths', () => {
    expect(reharmonize(['ii7', 'V7', 'Imaj7'], 'dorian')).toEqual(['ii7', 'v7', 'i7']);
  });
});

describe('harmonicFunctions', () => {
  it('knows major and minor keys only', () => {
    expect(harmonicFunctions('ionian')?.[4]).toBe('D');
    expect(harmonicFunctions('dorian')).toBeNull();
  });
});

describe('voiceChord', () => {
  const range = (notes: string[]) => notes.map((n) => Note.midi(n) ?? 0);

  it('keeps chords in the middle register', () => {
    const v = range(voiceChord(['C', 'E', 'G']));
    expect(Math.min(...v)).toBeGreaterThanOrEqual(Note.midi('F3') ?? 0);
    expect(Math.max(...v)).toBeLessThanOrEqual(Note.midi('G5') ?? 0);
  });

  it('moves smoothly from C to F (C stays, E->F, G->A)', () => {
    const c = voiceChord(['C', 'E', 'G']);
    const f = voiceChord(['F', 'A', 'C'], c);
    const moved = range(f).reduce((sum, x) => sum + Math.min(...range(c).map((p) => Math.abs(p - x))), 0);
    expect(moved).toBeLessThanOrEqual(3);
  });
});

describe('bassNote', () => {
  it('places roots between E2 and D#3', () => {
    expect(bassNote('C')).toBe('C3');
    expect(bassNote('E')).toBe('E2');
    expect(bassNote('Bb')).toBe('Bb2');
  });
});
