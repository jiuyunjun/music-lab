import * as Tone from 'tone';
import { getMasterBus } from '../engine';
import type { Instrument } from './types';

/** Salamander Grand Piano subset, one sample every 3 semitones (see public/samples/LICENSES.md). */
const SAMPLE_NOTES = [
  'A1', 'C2', 'D#2', 'F#2', 'A2', 'C3', 'D#3', 'F#3', 'A3', 'C4', 'D#4',
  'F#4', 'A4', 'C5', 'D#5', 'F#5', 'A5', 'C6', 'D#6', 'F#6', 'A6', 'C7',
];

function sampleUrls(): Record<string, string> {
  return Object.fromEntries(SAMPLE_NOTES.map((n) => [n, `${n.replace('#', 's')}.mp3`]));
}

export function createPiano(): Instrument {
  const output = new Tone.Volume(4).connect(getMasterBus());
  let loaded = false;
  let resolveLoaded!: () => void;
  const loadedPromise = new Promise<void>((resolve) => (resolveLoaded = resolve));

  // Plays instantly while samples download so the first tap always makes a sound.
  const fallback = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.6, sustain: 0.15, release: 0.8 },
    volume: -8,
  }).connect(output);

  const sampler = new Tone.Sampler({
    urls: sampleUrls(),
    baseUrl: `${import.meta.env.BASE_URL}samples/salamander/`,
    release: 1,
    onload: () => {
      loaded = true;
      resolveLoaded();
    },
  }).connect(output);

  const voice = () => (loaded ? sampler : fallback);

  return {
    id: 'piano',
    isLoaded: () => loaded,
    loaded: loadedPromise,
    noteOn: (note, velocity = 0.8, time) => voice().triggerAttack(note, time, velocity),
    noteOff: (note, time) => {
      // Release on both in case the note started on the fallback before loading finished.
      sampler.triggerRelease(note, time);
      fallback.triggerRelease(note, time);
    },
    play: (note, duration, time, velocity = 0.8) => voice().triggerAttackRelease(note, duration, time, velocity),
    releaseAll: () => {
      sampler.releaseAll();
      fallback.releaseAll();
    },
    dispose: () => {
      sampler.dispose();
      fallback.dispose();
      output.dispose();
    },
  };
}
