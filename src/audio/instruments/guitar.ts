import * as Tone from 'tone';
import { getMasterBus } from '../engine';
import type { Instrument } from './types';

const VOICES = 18; // three full strums can ring over each other

/**
 * Plucked-string guitar (Karplus-Strong via PluckSynth). PluckSynth is
 * monophonic and has no velocity, so we keep a round-robin pool of voices,
 * each with its own gain for dynamics.
 */
export function createGuitar(): Instrument {
  const body = new Tone.Filter({ frequency: 3400, type: 'lowpass', rolloff: -12 });
  const warmth = new Tone.EQ3({ low: 2, mid: 0, high: -3 });
  const output = new Tone.Volume(-1);
  body.chain(warmth, output, getMasterBus());

  const voices = Array.from({ length: VOICES }, () => {
    const gain = new Tone.Gain(0.8).connect(body);
    const synth = new Tone.PluckSynth({ attackNoise: 1.2, dampening: 3600, resonance: 0.965, release: 0.6 }).connect(gain);
    return { synth, gain, note: null as string | null };
  });
  let next = 0;

  const strike = (note: string, time: number | undefined, velocity: number) => {
    const voice = voices[next]!;
    next = (next + 1) % voices.length;
    const at = time ?? Tone.now();
    voice.gain.gain.setValueAtTime(velocity, at);
    voice.synth.triggerAttack(note, at);
    voice.note = note;
  };

  const release = (note: string, time?: number) => {
    for (const voice of voices) {
      if (voice.note === note) {
        voice.synth.triggerRelease(time);
        voice.note = null;
      }
    }
  };

  return {
    id: 'guitar',
    isLoaded: () => true,
    loaded: Promise.resolve(),
    noteOn: (note, velocity = 0.8, time) => strike(note, time, velocity),
    noteOff: (note, time) => release(note, time),
    // Plucked strings decay on their own; the next strum on the pool takes over,
    // so `duration` is only a hint here.
    play: (note, _duration, time, velocity = 0.8) => strike(note, time, velocity),
    releaseAll: () => voices.forEach((v) => v.synth.triggerRelease()),
    dispose: () => {
      voices.forEach((v) => {
        v.synth.dispose();
        v.gain.dispose();
      });
      body.dispose();
      warmth.dispose();
      output.dispose();
    },
  };
}
