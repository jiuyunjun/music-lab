import * as Tone from 'tone';
import { getMasterBus } from '../engine';
import type { Instrument } from './types';

/** Round synth bass: a triangle/square blend through a plucky low-pass envelope. */
export function createBass(): Instrument {
  const output = new Tone.Volume(-10).connect(getMasterBus());

  const synth = new Tone.PolySynth(Tone.MonoSynth, {
    oscillator: { type: 'fattriangle', count: 2, spread: 8 },
    filter: { type: 'lowpass', Q: 1.5, rolloff: -24 },
    filterEnvelope: { attack: 0.005, decay: 0.25, sustain: 0.35, release: 0.4, baseFrequency: 120, octaves: 3 },
    envelope: { attack: 0.008, decay: 0.3, sustain: 0.7, release: 0.25 },
  }).connect(output);
  synth.maxPolyphony = 8;

  return {
    id: 'bass',
    isLoaded: () => true,
    loaded: Promise.resolve(),
    noteOn: (note, velocity = 0.8, time) => synth.triggerAttack(note, time, velocity),
    noteOff: (note, time) => synth.triggerRelease(note, time),
    play: (note, duration, time, velocity = 0.8) => synth.triggerAttackRelease(note, duration, time, velocity),
    releaseAll: () => synth.releaseAll(),
    dispose: () => {
      synth.dispose();
      output.dispose();
    },
  };
}
