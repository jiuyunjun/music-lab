import * as Tone from 'tone';
import { getMasterBus } from '../engine';
import type { Instrument } from './types';

/** Soft detuned synth pad, also used as the drone under the scale lab. */
export function createPad(): Instrument {
  const filter = new Tone.Filter(1400, 'lowpass');
  const reverb = new Tone.Reverb({ decay: 4, wet: 0.35 });
  const output = new Tone.Volume(-7);
  filter.chain(reverb, output, getMasterBus());

  // A short attack so a quick tap is still clearly audible; the long release keeps it "pad"-like.
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'fatsawtooth', count: 3, spread: 24 },
    envelope: { attack: 0.06, decay: 0.4, sustain: 0.8, release: 1.6 },
  }).connect(filter);
  synth.maxPolyphony = 16;

  return {
    id: 'pad',
    isLoaded: () => true,
    loaded: Promise.resolve(),
    noteOn: (note, velocity = 0.7, time) => synth.triggerAttack(note, time, velocity),
    noteOff: (note, time) => synth.triggerRelease(note, time),
    play: (note, duration, time, velocity = 0.7) => synth.triggerAttackRelease(note, duration, time, velocity),
    releaseAll: () => synth.releaseAll(),
    dispose: () => {
      synth.dispose();
      filter.dispose();
      reverb.dispose();
      output.dispose();
    },
  };
}
