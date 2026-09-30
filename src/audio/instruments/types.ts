import type { Articulation } from '../../theory/events';

export type InstrumentId = 'piano' | 'epiano' | 'organ' | 'pad' | 'bass' | 'guitar';

export interface Instrument {
  readonly id: InstrumentId | 'drums';
  /** True once samples (if any) are loaded. Instruments still sound before that via a fallback synth. */
  isLoaded(): boolean;
  /** Resolves when samples are loaded. */
  loaded: Promise<void>;
  noteOn(note: string, velocity?: number, time?: number): void;
  noteOff(note: string, time?: number): void;
  /**
   * Play a note for a fixed duration (Tone time, e.g. "8n"). Instruments that
   * don't know an articulation (e.g. "muted") just play the note normally.
   */
  play(note: string, duration: string | number, time?: number, velocity?: number, articulation?: Articulation): void;
  releaseAll(): void;
  dispose(): void;
}
