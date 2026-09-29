import * as Tone from 'tone';
import { Note } from 'tonal';
import { getMasterBus } from '../engine';
import type { Instrument } from './types';

/**
 * Drawbar footages of a tonewheel organ and the harmonic each one produces,
 * measured against the 16' sub-octave (harmonic 1).
 */
export const DRAWBARS = [
  { footage: "16'", harmonic: 1 },
  { footage: "5⅓'", harmonic: 3 },
  { footage: "8'", harmonic: 2 },
  { footage: "4'", harmonic: 4 },
  { footage: "2⅔'", harmonic: 6 },
  { footage: "2'", harmonic: 8 },
  { footage: "1⅗'", harmonic: 10 },
  { footage: "1⅓'", harmonic: 12 },
  { footage: "1'", harmonic: 16 },
] as const;

/** Nine drawbar levels, 0-8 each, e.g. "888000000". */
export type DrawbarSetting = number[];

export function parseDrawbars(registration: string): DrawbarSetting {
  return registration.split('').map(Number);
}

function drawbarPartials(setting: DrawbarSetting): number[] {
  const partials = new Array<number>(16).fill(0);
  DRAWBARS.forEach(({ harmonic }, i) => {
    partials[harmonic - 1] = (setting[i] ?? 0) / 8;
  });
  return partials;
}

export interface OrganInstrument extends Instrument {
  setDrawbars(setting: DrawbarSetting): void;
}

/**
 * Tonewheel ("electric tube") organ, Hammond style. The oscillator runs one
 * octave below the played note so the 16' drawbar can be harmonic 1; the other
 * drawbars are integer harmonics above it. Chorus + vibrato approximate a Leslie.
 */
export function createOrgan(initial = parseDrawbars('888000000')): OrganInstrument {
  const leslie = new Tone.Chorus({ frequency: 5.5, delayTime: 2.5, depth: 0.5, spread: 180, wet: 0.5 }).start();
  const vibrato = new Tone.Vibrato({ frequency: 6.5, depth: 0.08 });
  const output = new Tone.Volume(-14);
  vibrato.chain(leslie, output, getMasterBus());

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'custom', partials: drawbarPartials(initial) },
    envelope: { attack: 0.006, decay: 0, sustain: 1, release: 0.06 },
  }).connect(vibrato);
  synth.maxPolyphony = 24;

  const sub = (note: string) => Note.transpose(note, '-8P');

  return {
    id: 'organ',
    isLoaded: () => true,
    loaded: Promise.resolve(),
    noteOn: (note, velocity = 0.8, time) => synth.triggerAttack(sub(note), time, velocity),
    noteOff: (note, time) => synth.triggerRelease(sub(note), time),
    play: (note, duration, time, velocity = 0.8) => synth.triggerAttackRelease(sub(note), duration, time, velocity),
    releaseAll: () => synth.releaseAll(),
    setDrawbars: (setting) => synth.set({ oscillator: { type: 'custom', partials: drawbarPartials(setting) } }),
    dispose: () => {
      synth.dispose();
      vibrato.dispose();
      leslie.dispose();
      output.dispose();
    },
  };
}
