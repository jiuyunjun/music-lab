import * as Tone from 'tone';
import { getMasterBus } from '../engine';
import type { Instrument } from './types';

/** Rhodes-style electric piano: a bell-ish FM tone through a gentle stereo tremolo. */
export function createEPiano(): Instrument {
  const tremolo = new Tone.Tremolo({ frequency: 4.5, depth: 0.35, spread: 180 }).start();
  const output = new Tone.Volume(-4);
  tremolo.chain(output, getMasterBus());

  const synth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 1,
    modulationIndex: 3.5,
    oscillator: { type: 'sine' },
    modulation: { type: 'sine' },
    envelope: { attack: 0.002, decay: 1.6, sustain: 0.25, release: 0.9 },
    modulationEnvelope: { attack: 0.002, decay: 0.35, sustain: 0.05, release: 0.5 },
  }).connect(tremolo);
  synth.maxPolyphony = 24;

  return {
    id: 'epiano',
    isLoaded: () => true,
    loaded: Promise.resolve(),
    noteOn: (note, velocity = 0.8, time) => synth.triggerAttack(note, time, velocity),
    noteOff: (note, time) => synth.triggerRelease(note, time),
    play: (note, duration, time, velocity = 0.8) => synth.triggerAttackRelease(note, duration, time, velocity),
    releaseAll: () => synth.releaseAll(),
    dispose: () => {
      synth.dispose();
      tremolo.dispose();
      output.dispose();
    },
  };
}
