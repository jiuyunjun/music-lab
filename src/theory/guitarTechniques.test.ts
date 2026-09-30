import { describe, expect, it } from 'vitest';
import { Note } from 'tonal';
import { buildChord } from './chords';
import { parseSixteenths } from './events';
import { GUITAR_TECHNIQUES, chordStrings, guitarTechnique } from './guitarTechniques';

const C = buildChord('C', ''); // open C: x32010 -> C3 E3 G3 C4 E4
const at = (events: ReturnType<typeof guitarTechnique>, t: number) =>
  events.filter((e) => parseSixteenths(e.time) === t).map((e) => e.note);

describe('chordStrings', () => {
  it('pairs each sounding note with its string', () => {
    expect(chordStrings(C)).toEqual([
      { string: 1, note: 'C3' },
      { string: 2, note: 'E3' },
      { string: 3, note: 'G3' },
      { string: 4, note: 'C4' },
      { string: 5, note: 'E4' },
    ]);
  });
});

describe('guitarTechnique', () => {
  it('tremolo (p-a-m-i): a bass note then three repeats of the top note, every beat', () => {
    const e = guitarTechnique(C, 'tremolo', 16);
    expect(e.map((x) => x.note).slice(0, 8)).toEqual(['C3', 'E4', 'E4', 'E4', 'E3', 'E4', 'E4', 'E4']);
    expect(e).toHaveLength(16);
  });

  it('travis: thumb alternates bass strings on the beat, pinch on beat 1', () => {
    const e = guitarTechnique(C, 'travis', 16);
    expect(at(e, 0).sort()).toEqual(['C3', 'E4']);
    expect(at(e, 4)).toEqual(['E3']);
    expect(at(e, 8)).toEqual(['C3']);
    expect(at(e, 2)).toEqual(['C4']);
  });

  it('p-i-m-a climbs the strings from the bass', () => {
    expect(guitarTechnique(C, 'pima', 8).map((x) => x.note)).toEqual(['C3', 'G3', 'C4', 'E4']);
  });

  it('rasgueado rolls four quick strums on beat 1', () => {
    const e = guitarTechnique(C, 'rasgueado', 16);
    const beat1 = e.filter((x) => x.time === '0:0:0');
    expect(beat1).toHaveLength(4 * 5);
    const firstStrings = beat1.filter((x) => x.note === 'C3').map((x) => x.offset ?? 0);
    expect(firstStrings).toEqual([0, 0.045, 0.09, 0.135]);
  });

  it('palm mute chugs the three low strings, muted and short', () => {
    const e = guitarTechnique(C, 'palmMute', 16);
    expect(at(e, 0)).toEqual(['C3', 'E3', 'G3']);
    expect(e.every((x) => x.articulation === 'muted' && x.duration === '0:0:1')).toBe(true);
    expect(e).toHaveLength(8 * 3);
  });

  it('harmonics ring an octave above the top strings', () => {
    const e = guitarTechnique(C, 'harmonics', 16);
    expect(e.map((x) => x.note)).toEqual(['E4', 'G4', 'C5', 'E5']);
    expect(e.every((x) => x.articulation === 'harmonic')).toBe(true);
  });

  it('keeps the pattern locked to the bar when a chord starts mid-bar', () => {
    const second = guitarTechnique(C, 'tremolo', 8, 8); // beats 3-4 of the bar
    expect(second[0]!.note).toBe('G3'); // beat 3 bass = third string, not the root
  });

  it.each(GUITAR_TECHNIQUES)('%s only plays chord tones and stays inside the chord', (technique) => {
    for (const chord of [C, buildChord('G', ''), buildChord('A', 'm'), buildChord('F#', 'm'), buildChord('D', '7')]) {
      const tones = chord.notes.map(Note.chroma);
      for (const e of guitarTechnique(chord, technique, 8)) {
        expect(tones).toContain(Note.chroma(e.note));
        expect(parseSixteenths(e.time) + parseSixteenths(e.duration)).toBeLessThanOrEqual(8);
      }
    }
  });
});
