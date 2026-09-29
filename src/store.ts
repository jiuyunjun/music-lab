import { create } from 'zustand';
import type { InstrumentId } from './audio/instruments';
import type { ModeId } from './theory/modes';

export type KeyMode = Extract<ModeId, 'ionian' | 'aeolian'>;

interface AppState {
  instrument: InstrumentId;
  octave: number;
  /** Scale lab root as pitch-class chroma 0-11; spelled per mode via simplestRoot. */
  rootChroma: number;
  mode: ModeId;
  /** Song key shared by chords (and later arrange): tonic chroma + major/minor. */
  keyChroma: number;
  keyMode: KeyMode;
  bpm: number;
  volumeDb: number;
  setInstrument: (id: InstrumentId) => void;
  setOctave: (octave: number) => void;
  setRootChroma: (chroma: number) => void;
  setMode: (mode: ModeId) => void;
  setKey: (chroma: number, mode: KeyMode) => void;
  setBpm: (bpm: number) => void;
  setVolumeDb: (db: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  instrument: 'piano',
  octave: 4,
  rootChroma: 2, // D, as in D Dorian
  mode: 'dorian',
  keyChroma: 0,
  keyMode: 'ionian',
  bpm: 90,
  volumeDb: -6,
  setInstrument: (instrument) => set({ instrument }),
  setOctave: (octave) => set({ octave: Math.min(6, Math.max(1, octave)) }),
  setRootChroma: (rootChroma) => set({ rootChroma }),
  setMode: (mode) => set({ mode }),
  setKey: (keyChroma, keyMode) => set({ keyChroma, keyMode }),
  setBpm: (bpm) => set({ bpm: Math.min(180, Math.max(40, bpm)) }),
  setVolumeDb: (volumeDb) => set({ volumeDb }),
}));
