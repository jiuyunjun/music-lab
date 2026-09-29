import * as Tone from 'tone';

let master: Tone.Volume | null = null;
let starting: Promise<void> | null = null;
const startListeners = new Set<() => void>();

/** The single master bus: every instrument connects here, never to the destination directly. */
export function getMasterBus(): Tone.Volume {
  if (!master) {
    const limiter = new Tone.Limiter(-1).toDestination();
    master = new Tone.Volume(-6).connect(limiter);
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
