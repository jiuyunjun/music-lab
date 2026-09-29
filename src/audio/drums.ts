import * as Tone from 'tone';
import type { DrumPiece } from '../theory/drums';
import { getMasterBus } from './engine';

export interface DrumKit {
  hit(piece: DrumPiece, time?: number, velocity?: number): void;
  dispose(): void;
}

/** A fully synthesized kit: no samples, so nothing to license or download. */
function createKit(): DrumKit {
  const output = new Tone.Volume(-4).connect(getMasterBus());

  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.045,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.45, sustain: 0, release: 0.1 },
  }).connect(output);

  const snareBody = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 2,
    envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
    volume: -8,
  }).connect(output);
  const snareFilter = new Tone.Filter(1800, 'highpass').connect(output);
  const snareNoise = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
    volume: -4,
  }).connect(snareFilter);

  const clapFilter = new Tone.Filter({ frequency: 1300, type: 'bandpass', Q: 1.2 }).connect(output);
  const clap = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.001, decay: 0.16, sustain: 0 },
    volume: 12,
  }).connect(clapFilter);

  const hatFilter = new Tone.Filter(8000, 'highpass').connect(output);
  const hat = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.045, sustain: 0 },
    volume: -8,
  }).connect(hatFilter);
  const openHat = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.05 },
    volume: -10,
  }).connect(hatFilter);

  const crashFilter = new Tone.Filter(5000, 'highpass').connect(output);
  const crash = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.002, decay: 1.4, sustain: 0 },
    volume: -8,
  }).connect(crashFilter);

  const tom = new Tone.MembraneSynth({
    pitchDecay: 0.08,
    octaves: 3,
    envelope: { attack: 0.001, decay: 0.35, sustain: 0 },
    volume: -4,
  }).connect(output);

  const nodes = [kick, snareBody, snareFilter, snareNoise, clapFilter, clap, hatFilter, hat, openHat, crashFilter, crash, tom, output];

  return {
    hit(piece, time, velocity = 0.8) {
      const t = time ?? Tone.now();
      switch (piece) {
        case 'kick':
          kick.triggerAttackRelease('C1', '8n', t, velocity);
          break;
        case 'snare':
          snareBody.triggerAttackRelease('G2', '16n', t, velocity);
          snareNoise.triggerAttackRelease('16n', t, velocity);
          break;
        case 'clap':
          // A clap is a few hands a few milliseconds apart.
          [0, 0.011, 0.023].forEach((d, i) => clap.triggerAttackRelease('32n', t + d, velocity * (i === 2 ? 1 : 0.6)));
          break;
        case 'hat':
          openHat.triggerRelease(t); // closing the hat chokes the open one
          hat.triggerAttackRelease('32n', t, velocity);
          break;
        case 'openHat':
          openHat.triggerAttackRelease('8n', t, velocity);
          break;
        case 'tomHigh':
          tom.triggerAttackRelease('D3', '8n', t, velocity);
          break;
        case 'tomLow':
          tom.triggerAttackRelease('G2', '8n', t, velocity);
          break;
        case 'crash':
          crash.triggerAttackRelease('1n', t, velocity);
          break;
      }
    },
    dispose() {
      nodes.forEach((n) => n.dispose());
    },
  };
}

let kit: DrumKit | null = null;

export function getDrumKit(): DrumKit {
  kit ??= createKit();
  return kit;
}
