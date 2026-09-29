import type { InstrumentId } from '../../audio/instruments';
import { DRUM_PRESETS } from '../../content/drums';
import { BASS_STYLES, type BassStyle } from '../../theory/bass';
import { romanToChord } from '../../theory/chords';
import { MODE_IDS, simplestRoot, type ModeId } from '../../theory/modes';
import { PATTERN_IDS, STRUM_PATTERNS, type PatternId } from '../../theory/patterns';
import type { MelodyStyle, SongSpec } from '../../theory/song';

export const LANES = ['drums', 'bass', 'harmony', 'melody'] as const;
export type Lane = (typeof LANES)[number];

export interface Project {
  v: 1;
  keyChroma: number;
  mode: ModeId;
  bpm: number;
  progression: string[];
  beatsPerChord: 2 | 4;
  cycles: number;
  drums: { on: boolean; preset: string };
  bass: { on: boolean; style: BassStyle };
  harmony: { on: boolean; instrument: InstrumentId; pattern: PatternId; strum: string };
  melody: { on: boolean; instrument: InstrumentId; style: MelodyStyle; seed: number; double: boolean };
  tricks: SongSpec['tricks'];
  mixer: Record<Lane, { volume: number; muted: boolean }>;
}

export const MELODY_INSTRUMENTS: InstrumentId[] = ['piano', 'epiano', 'organ', 'guitar', 'pad'];
export const HARMONY_INSTRUMENTS: InstrumentId[] = ['piano', 'epiano', 'organ', 'guitar', 'pad'];

export const DEFAULT_PROJECT: Project = {
  v: 1,
  keyChroma: 0,
  mode: 'ionian',
  bpm: 100,
  progression: ['I', 'V', 'vi', 'IV'],
  beatsPerChord: 4,
  cycles: 3,
  drums: { on: true, preset: 'pop' },
  bass: { on: true, style: 'root' },
  harmony: { on: true, instrument: 'piano', pattern: 'block', strum: 'folk' },
  melody: { on: true, instrument: 'piano', style: 'generated', seed: 1, double: false },
  tricks: { build: true, fill: true, lift: false },
  mixer: {
    drums: { volume: 0.9, muted: false },
    bass: { volume: 0.9, muted: false },
    harmony: { volume: 0.8, muted: false },
    melody: { volume: 1, muted: false },
  },
};

export function drumPreset(id: string) {
  return DRUM_PRESETS.find((p) => p.id === id) ?? DRUM_PRESETS[0]!;
}

export function projectTonic(project: Project): string {
  return simplestRoot(project.keyChroma, project.mode);
}

export function toSpec(project: Project): SongSpec {
  return {
    tonic: projectTonic(project),
    mode: project.mode,
    progression: project.progression,
    beatsPerChord: project.beatsPerChord,
    cycles: project.cycles,
    drums: { on: project.drums.on, pattern: drumPreset(project.drums.preset).pattern },
    bass: project.bass,
    harmony: {
      on: project.harmony.on,
      pattern: project.harmony.pattern,
      strumPattern: STRUM_PATTERNS.find((p) => p.id === project.harmony.strum)?.value,
    },
    melody: {
      on: project.melody.on,
      style: project.melody.style,
      seed: project.melody.seed,
      double: project.melody.double,
    },
    tricks: project.tricks,
  };
}

/** Which mixer lane an event track belongs to. */
export function laneOf(track: string): Lane {
  if (track === 'chords') return 'harmony';
  if (track === 'counter') return 'melody';
  return track as Lane;
}

// --- validation: shared links and saved data are untrusted input ---

const oneOf = <T>(value: unknown, options: readonly T[], fallback: T): T =>
  options.includes(value as T) ? (value as T) : fallback;
const num = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const bool = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);
const obj = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

function validProgression(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 16) return null;
  try {
    const romans = value.map(String);
    romans.forEach((r) => romanToChord('C', r));
    return romans;
  } catch {
    return null;
  }
}

/** Coerce anything into a valid Project, falling back to defaults field by field. */
export function sanitizeProject(input: unknown): Project {
  const p = obj(input);
  const d = DEFAULT_PROJECT;
  const drums = obj(p.drums);
  const bass = obj(p.bass);
  const harmony = obj(p.harmony);
  const melody = obj(p.melody);
  const tricks = obj(p.tricks);
  const mixerIn = obj(p.mixer);
  const allInstruments = [...new Set([...MELODY_INSTRUMENTS, ...HARMONY_INSTRUMENTS])];
  return {
    v: 1,
    keyChroma: Math.round(num(p.keyChroma, 0, 11, d.keyChroma)),
    mode: oneOf(p.mode, MODE_IDS, d.mode),
    bpm: Math.round(num(p.bpm, 40, 200, d.bpm)),
    progression: validProgression(p.progression) ?? d.progression,
    beatsPerChord: oneOf(p.beatsPerChord, [2, 4] as const, d.beatsPerChord),
    cycles: Math.round(num(p.cycles, 1, 6, d.cycles)),
    drums: {
      on: bool(drums.on, d.drums.on),
      preset: oneOf(drums.preset, DRUM_PRESETS.map((x) => x.id), d.drums.preset),
    },
    bass: { on: bool(bass.on, d.bass.on), style: oneOf(bass.style, BASS_STYLES, d.bass.style) },
    harmony: {
      on: bool(harmony.on, d.harmony.on),
      instrument: oneOf(harmony.instrument, allInstruments, d.harmony.instrument),
      pattern: oneOf(harmony.pattern, PATTERN_IDS, d.harmony.pattern),
      strum: oneOf(harmony.strum, STRUM_PATTERNS.map((x) => x.id as string), d.harmony.strum),
    },
    melody: {
      on: bool(melody.on, d.melody.on),
      instrument: oneOf(melody.instrument, allInstruments, d.melody.instrument),
      style: oneOf(melody.style, ['generated', 'canon'] as const, d.melody.style),
      seed: Math.round(num(melody.seed, 0, 2 ** 31, d.melody.seed)),
      double: bool(melody.double, d.melody.double),
    },
    tricks: {
      build: bool(tricks.build, d.tricks.build),
      fill: bool(tricks.fill, d.tricks.fill),
      lift: bool(tricks.lift, d.tricks.lift),
    },
    mixer: Object.fromEntries(
      LANES.map((lane) => {
        const m = obj(mixerIn[lane]);
        return [lane, { volume: num(m.volume, 0, 1, d.mixer[lane].volume), muted: bool(m.muted, d.mixer[lane].muted) }];
      }),
    ) as Project['mixer'],
  };
}

// --- sharing: the whole project lives in the URL, no server needed ---

export function encodeProject(project: Project): string {
  const bytes = new TextEncoder().encode(JSON.stringify(project));
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeProject(code: string): Project | null {
  try {
    const binary = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return sanitizeProject(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

const STORAGE_KEY = 'music-lab.arrange.v1';

export function loadSaved(): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeProject(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function save(project: Project): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch {
    // Private mode or storage full: saving is a convenience, not a requirement.
  }
}
