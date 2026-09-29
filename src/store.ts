import { create } from 'zustand';
import type { InstrumentId } from './audio/instruments';
import type { ModeId } from './theory/modes';

interface AppState {
  instrument: InstrumentId;
  octave: number;
  /** Root as pitch-class chroma 0-11; spelled per mode via simplestRoot. */
  rootChroma: number;
  mode: ModeId;
  volumeDb: number;
  setInstrument: (id: InstrumentId) => void;
  setOctave: (octave: number) => void;
  setRootChroma: (chroma: number) => void;
  setMode: (mode: ModeId) => void;
  setVolumeDb: (db: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  instrument: 'piano',
  octave: 4,
  rootChroma: 2, // D, as in D Dorian
  mode: 'dorian',
  volumeDb: -6,
  setInstrument: (instrument) => set({ instrument }),
  setOctave: (octave) => set({ octave: Math.min(6, Math.max(1, octave)) }),
  setRootChroma: (rootChroma) => set({ rootChroma }),
  setMode: (mode) => set({ mode }),
  setVolumeDb: (volumeDb) => set({ volumeDb }),
}));
