export type InstrumentId = 'piano' | 'epiano' | 'organ' | 'pad' | 'bass' | 'guitar';

export interface Instrument {
  readonly id: InstrumentId;
  /** True once samples (if any) are loaded. Instruments still sound before that via a fallback synth. */
  isLoaded(): boolean;
  /** Resolves when samples are loaded. */
  loaded: Promise<void>;
  noteOn(note: string, velocity?: number, time?: number): void;
  noteOff(note: string, time?: number): void;
  /** Play a note for a fixed duration (Tone time, e.g. "8n"). */
  play(note: string, duration: string | number, time?: number, velocity?: number): void;
  releaseAll(): void;
  dispose(): void;
}
