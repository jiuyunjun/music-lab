import * as Tone from 'tone';

let master: Tone.Volume | null = null;
let starting: Promise<void> | null = null;
const startListeners = new Set<() => void>();

/**
 * The single master bus: every instrument connects here, never to the destination directly.
 * Chain: volume -> light room reverb -> limiter. A touch of shared reverb puts all
 * instruments "in the same room", which makes even simple phrases sound musical.
 */
export function getMasterBus(): Tone.Volume {
  if (!master) {
    const limiter = new Tone.Limiter(-1).toDestination();
    const room = new Tone.Reverb({ decay: 2.4, preDelay: 0.02, wet: 0.2 }).connect(limiter);
    master = new Tone.Volume(-6).connect(room);
  }
  return master;
}

export function isAudioRunning(): boolean {
  return Tone.getContext().state === 'running';
}

/** Must be called from a user gesture (browsers block audio until then). */
export function ensureAudioStarted(): Promise<void> {
  if (isAudioRunning()) return Promise.resolve();
  starting ??= Tone.start().then(() => {
    starting = null;
    startListeners.forEach((fn) => fn());
  });
  return starting;
}

/** Run `fn` right away when audio is running, otherwise right after it starts. */
export function withAudio(fn: () => void): void {
  if (isAudioRunning()) fn();
  else void ensureAudioStarted().then(fn);
}

export function onAudioStarted(fn: () => void): () => void {
  startListeners.add(fn);
  return () => startListeners.delete(fn);
}

/** Master volume in decibels. */
export function setMasterVolume(db: number): void {
  getMasterBus().volume.rampTo(db, 0.05);
}
