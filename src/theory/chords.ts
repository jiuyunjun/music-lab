import { Chord, Interval, Note, RomanNumeral } from 'tonal';
import { modeIntervals, modeNotes, type ModeId } from './modes';

export interface ChordInfo {
  /** Roman numeral relative to the tonic, e.g. "vi", "bVII", "V7". */
  roman: string;
  /** Chord symbol, e.g. "Bm", "C7". */
  symbol: string;
  root: string;
  /** Pitch classes, root first. */
  notes: string[];
}

export type HarmonicFunction = 'T' | 'SD' | 'D';

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/** Map a roman numeral's case + suffix to a tonal chord type. */
function chordType(major: boolean, suffix: string): string {
  switch (suffix) {
    case '':
      return major ? '' : 'm';
    case 'o':
    case '°':
      return 'dim';
    case 'o7':
    case '°7':
      return 'dim7';
    case 'ø':
    case 'ø7':
      return 'm7b5';
    case '+':
      return 'aug';
    case '7':
      return major ? '7' : 'm7';
    case 'maj7':
      return major ? 'maj7' : 'mMaj7';
    case 'add9':
      return major ? 'add9' : 'madd9';
    default:
      return suffix;
  }
}

function chordFromSymbol(roman: string, root: string, type: string): ChordInfo {
  const symbol = `${root}${type}`;
  const chord = Chord.get(symbol);
  if (chord.empty) throw new Error(`Unknown chord ${symbol}`);
  return { roman, symbol, root, notes: chord.notes };
}

/**
 * Roman numeral -> chord, measured chromatically from the tonic:
 * ("D", "vi") -> Bm, ("A", "bVII") -> G, ("C", "V7") -> G7.
 * Lower case = minor, upper case = major.
 */
export function romanToChord(tonic: string, roman: string): ChordInfo {
  const parsed = RomanNumeral.get(roman);
  if (parsed.empty) throw new Error(`Invalid roman numeral ${roman}`);
  const root = Note.simplify(Note.pitchClass(Note.transpose(tonic, parsed.interval)));
  return chordFromSymbol(roman, root, chordType(parsed.major, parsed.chordType));
}

/** Roman numeral for display: "bVII" -> "♭VII", "#iv" -> "♯iv". */
export function displayRoman(roman: string): string {
  return roman.replace(/^b/, '♭').replace(/^#/, '♯');
}

/** Any chord type on any root, e.g. ("C", "sus4"). */
export function buildChord(root: string, type: string): ChordInfo {
  return chordFromSymbol('', root, type);
}

function triadType(third: string, fifth: string): { type: string; mark: string } {
  if (third === '3M' && fifth === '5A') return { type: 'aug', mark: '+' };
  if (third === '3m' && fifth === '5d') return { type: 'dim', mark: '°' };
  return { type: third === '3M' ? '' : 'm', mark: '' };
}

function seventhType(triad: string, seventh: string): { type: string; mark: string } {
  if (triad === 'dim') return seventh === '7d' ? { type: 'dim7', mark: '°7' } : { type: 'm7b5', mark: 'ø7' };
  if (triad === '') return seventh === '7M' ? { type: 'maj7', mark: 'maj7' } : { type: '7', mark: '7' };
  if (triad === 'm') return seventh === '7M' ? { type: 'mMaj7', mark: 'maj7' } : { type: 'm7', mark: '7' };
  return { type: 'maj7#5', mark: 'maj7' };
}

/**
 * The seven chords built by stacking thirds inside a mode. Numerals carry
 * accidentals relative to the major scale (A aeolian -> i ii° bIII iv v bVI bVII),
 * the same convention romanToChord reads, so they round-trip.
 */
export function diatonicChords(tonic: string, mode: ModeId, sevenths = false): ChordInfo[] {
  const scale = modeNotes(tonic, mode);
  const majorIntervals = modeIntervals('ionian');
  return scale.map((root, i) => {
    const at = (step: number) => scale[(i + step) % 7] ?? root;
    const third = Interval.distance(root, at(2));
    const fifth = Interval.distance(root, at(4));
    const triad = triadType(third, fifth);
    const { type, mark } = sevenths ? seventhType(triad.type, Interval.distance(root, at(6))) : triad;

    const shift =
      Interval.semitones(modeIntervals(mode)[i] ?? '1P') - Interval.semitones(majorIntervals[i] ?? '1P');
    const accidental = shift < 0 ? 'b' : shift > 0 ? '#' : '';
    const numeral = NUMERALS[i] ?? '';
    const cased = third === '3M' ? numeral : numeral.toLowerCase();
    const suffix = sevenths ? mark : triad.mark;
    return chordFromSymbol(`${accidental}${cased}${suffix}`, root, type);
  });
}

/**
 * Mode substitution: keep each chord's scale step, but take the chord that
 * lives on that step in `mode`. I–V–vi–IV in dorian -> i–v–vi°–IV.
 * Sevenths stay sevenths.
 */
export function reharmonize(progression: string[], mode: ModeId): string[] {
  const triads = diatonicChords('C', mode);
  const sevenths = diatonicChords('C', mode, true);
  return progression.map((roman) => {
    const parsed = RomanNumeral.get(roman);
    if (parsed.empty) return roman;
    const table = parsed.chordType.includes('7') ? sevenths : triads;
    return table[parsed.step]?.roman ?? roman;
  });
}

const FUNCTIONS: Partial<Record<ModeId, HarmonicFunction[]>> = {
  // Same table tonal's Key module uses.
  ionian: ['T', 'SD', 'T', 'SD', 'D', 'T', 'D'],
  aeolian: ['T', 'SD', 'T', 'SD', 'D', 'SD', 'SD'],
};

/** Tonic / subdominant / dominant role of each degree, for major and minor keys only. */
export function harmonicFunctions(mode: ModeId): HarmonicFunction[] | null {
  return FUNCTIONS[mode] ?? null;
}

/** Stack pitch classes upward from `first` at `octave`, keeping spelling. */
function stackUp(pitchClasses: string[], octave: number): string[] {
  const result: string[] = [];
  let floor = -Infinity;
  for (const pc of pitchClasses) {
    let oct = octave;
    let note = `${pc}${oct}`;
    while ((Note.midi(note) ?? 0) <= floor) note = `${pc}${++oct}`;
    floor = Note.midi(note) ?? floor;
    result.push(note);
  }
  return result;
}

const VOICING_LOW = Note.midi('F3') ?? 53;
const VOICING_HIGH = Note.midi('G5') ?? 79;
const VOICING_CENTER = Note.midi('E4') ?? 64;

function midis(notes: string[]): number[] {
  return notes.map((n) => Note.midi(n) ?? 0);
}

/**
 * Close-position voicing between F3 and G5. With a previous voicing, picks the
 * inversion that moves the hands least (smooth "voice leading"); otherwise the
 * one closest to the middle of the keyboard.
 */
export function voiceChord(chordNotes: string[], previous?: string[]): string[] {
  const candidates: string[][] = [];
  for (let inversion = 0; inversion < chordNotes.length; inversion++) {
    const rotated = [...chordNotes.slice(inversion), ...chordNotes.slice(0, inversion)];
    for (let octave = 2; octave <= 5; octave++) {
      const voiced = stackUp(rotated, octave);
      const m = midis(voiced);
      if (Math.min(...m) >= VOICING_LOW && Math.max(...m) <= VOICING_HIGH) candidates.push(voiced);
    }
  }
  const prev = previous ? midis(previous) : null;
  const score = (voiced: string[]) => {
    const m = midis(voiced);
    if (!prev) return Math.abs(m.reduce((a, b) => a + b, 0) / m.length - VOICING_CENTER);
    return m.reduce((sum, x) => sum + Math.min(...prev.map((p) => Math.abs(p - x))), 0);
  };
  const best = candidates.reduce((a, b) => (score(b) < score(a) ? b : a));
  return best;
}

/** Root in the bass register, E2 up to D#3. */
export function bassNote(root: string): string {
  const low = `${root}2`;
  return (Note.midi(low) ?? 0) < (Note.midi('E2') ?? 40) ? `${root}3` : low;
}
