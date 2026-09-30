import * as Tone from 'tone';
import { getMasterBus } from '../engine';
import type { Instrument } from './types';

/**
 * Steel-string acoustic samples (tonejs-instruments, from the University of
 * Iowa recordings; CC-BY 3.0), one every 3 semitones E2-D5.
 */
const SAMPLE_NOTES = ['E2', 'G2', 'A#2', 'C#3', 'E3', 'G3', 'A#3', 'C#4', 'E4', 'G4', 'A#4', 'C#5', 'D5'];

const FALLBACK_VOICES = 12;

/**
 * Acoustic guitar. Sounds instantly through a small Karplus-Strong pluck pool
 * while the real samples download, then switches to the samples.
 */
export function createGuitar(): Instrument {
  const warmth = new Tone.EQ3({ low: 1, mid: 0, high: -2 });
  const output = new Tone.Volume(-8);
  warmth.chain(output, getMasterBus());

  let loaded = false;
  let resolveLoaded!: () => void;
  const loadedPromise = new Promise<void>((resolve) => (resolveLoaded = resolve));

  const urls = Object.fromEntries(SAMPLE_NOTES.map((n) => [n, `${n.replace('#', 's')}.mp3`]));
  const baseUrl = `${import.meta.env.BASE_URL}samples/guitar-acoustic/`;

  const sampler = new Tone.Sampler({
    urls,
    baseUrl,
    release: 0.8,
    onload: () => {
      loaded = true;
      resolveLoaded();
    },
  }).connect(warmth);

  // Palm mute: the same samples, cut off almost at once and darkened, as a resting palm does.
  const muteFilter = new Tone.Filter({ frequency: 900, type: 'lowpass', rolloff: -24 }).connect(warmth);
  let mutedLoaded = false;
  const muted = new Tone.Sampler({ urls, baseUrl, release: 0.04, onload: () => (mutedLoaded = true) }).connect(muteFilter);

  // Harmonics: a nearly pure tone with a quick attack and a long, bell-like decay.
  const harmonic = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'custom', partials: [1, 0, 0.08] },
    envelope: { attack: 0.002, decay: 2.6, sustain: 0, release: 1.6 },
    volume: 4,
  }).connect(warmth);
  harmonic.maxPolyphony = 12;

  // PluckSynth is monophonic and has no velocity: round-robin voices, each with its own gain.
  const voices = Array.from({ length: FALLBACK_VOICES }, () => {
    const gain = new Tone.Gain(0.6).connect(warmth);
    const synth = new Tone.PluckSynth({ attackNoise: 1.2, dampening: 3600, resonance: 0.96, release: 0.6 }).connect(gain);
    return { synth, gain };
  });
  let next = 0;
  const pluck = (note: string, time: number | undefined, velocity: number) => {
    const voice = voices[next]!;
    next = (next + 1) % voices.length;
    const at = time ?? Tone.now();
    voice.gain.gain.setValueAtTime(velocity * 0.7, at);
    voice.synth.triggerAttack(note, at);
  };

  return {
    id: 'guitar',
    isLoaded: () => loaded,
    loaded: loadedPromise,
    noteOn: (note, velocity = 0.8, time) => (loaded ? sampler.triggerAttack(note, time, velocity) : pluck(note, time, velocity)),
    noteOff: (note, time) => sampler.triggerRelease(note, time),
    // A string rings until the next strum mutes it, which the strum pattern encodes as the duration.
    play: (note, duration, time, velocity = 0.8, articulation) => {
      if (articulation === 'harmonic') harmonic.triggerAttackRelease(note, '2n', time, velocity);
      else if (articulation === 'muted' && mutedLoaded) muted.triggerAttackRelease(note, '32n', time, velocity);
      else if (loaded) sampler.triggerAttackRelease(note, duration, time, velocity);
      else pluck(note, time, velocity);
    },
    releaseAll: () => {
      sampler.releaseAll();
      muted.releaseAll();
      harmonic.releaseAll();
    },
    dispose: () => {
      sampler.dispose();
      muted.dispose();
      muteFilter.dispose();
      harmonic.dispose();
      voices.forEach((v) => {
        v.synth.dispose();
        v.gain.dispose();
      });
      warmth.dispose();
      output.dispose();
    },
  };
}
