import * as Tone from 'tone';
import type { NoteEvent } from '../theory/events';
import { ensureAudioStarted } from './engine';
import type { Instrument } from './instruments';

/** Undo whatever is currently scheduled on the shared transport. */
let cleanup: (() => void) | null = null;

export interface PlayOptions<E extends NoteEvent> {
  bpm?: number;
  /** Loop the phrase until stopPhrase(); `length` sets the loop point. */
  loop?: boolean;
  /** Total length in transport time; defaults to the end of the last note. */
  length?: string;
  /** Called on the animation frame matching each note, for visual highlights. */
  onNote?: (event: E) => void;
  onEnd?: () => void;
  /** Per-event volume multiplier read at play time (mute = 0), so mixer changes apply live. */
  gainFor?: (event: E) => number;
  swing?: number;
  swingSubdivision?: '8n' | '16n';
}

function startTransport(bpm: number, swing = 0, swingSubdivision: '8n' | '16n' = '16n') {
  const transport = Tone.getTransport();
  transport.bpm.value = bpm;
  transport.swing = swing;
  transport.swingSubdivision = swingSubdivision;
  transport.position = 0;
  transport.start('+0.05');
}

/**
 * Play events on the shared transport, replacing whatever was playing.
 * `instrumentFor` picks the instrument per event, so one call can play a
 * melody, chords and bass together.
 */
export async function playEvents<E extends NoteEvent>(
  events: E[],
  instrumentFor: (event: E) => Instrument,
  options: PlayOptions<E> = {},
): Promise<void> {
  await ensureAudioStarted();
  stopPhrase();
  const transport = Tone.getTransport();
  transport.bpm.value = options.bpm ?? 100;

  const part = new Tone.Part<NoteEvent>((time, value) => {
    const event = value as E;
    const gain = options.gainFor ? options.gainFor(event) : 1;
    if (gain > 0) instrumentFor(event).play(event.note, event.duration, time + (event.offset ?? 0), event.velocity * gain);
    if (options.onNote) Tone.getDraw().schedule(() => options.onNote?.(event), time);
  }, events);

  const end =
    options.length !== undefined
      ? Tone.Time(options.length).toSeconds()
      : events.reduce((max, e) => Math.max(max, Tone.Time(e.time).toSeconds() + Tone.Time(e.duration).toSeconds()), 0);

  let endId: number | null = null;
  if (options.loop) {
    part.loop = true;
    part.loopEnd = end;
  } else {
    endId = transport.scheduleOnce((time) => {
      Tone.getDraw().schedule(() => {
        stopPhrase();
        options.onEnd?.();
      }, time);
    }, end + 0.05);
  }
  part.start(0);
  cleanup = () => {
    if (endId !== null) transport.clear(endId);
    part.dispose();
  };

  startTransport(options.bpm ?? 100, options.swing ?? 0, options.swingSubdivision);
}

/** Play a single-instrument phrase once. */
export function playPhrase(instrument: Instrument, events: NoteEvent[], options: PlayOptions<NoteEvent> = {}) {
  return playEvents(events, () => instrument, options);
}

export interface StepLoopOptions {
  bpm: number;
  steps?: number;
  /** 0 = straight, ~0.5-0.7 = shuffle feel. */
  swing?: number;
  swingSubdivision?: '8n' | '16n';
  /** Called on the animation frame of each step, for the playhead. */
  onStepDraw?: (step: number) => void;
}

/**
 * Call `onStep` on every sixteenth note, looping over `steps`. The callback
 * reads the pattern live, so edits take effect on the next pass.
 */
export async function startStepLoop(onStep: (step: number, time: number) => void, options: StepLoopOptions): Promise<void> {
  await ensureAudioStarted();
  stopPhrase();
  const transport = Tone.getTransport();
  const steps = options.steps ?? 16;
  let step = 0;
  const id = transport.scheduleRepeat(
    (time) => {
      const current = step;
      onStep(current, time);
      if (options.onStepDraw) Tone.getDraw().schedule(() => options.onStepDraw?.(current), time);
      step = (step + 1) % steps;
    },
    '16n',
    0,
  );
  cleanup = () => transport.clear(id);
  startTransport(options.bpm, options.swing ?? 0, options.swingSubdivision);
}

/** Change tempo live, e.g. while a progression loops. */
export function setTempo(bpm: number): void {
  Tone.getTransport().bpm.rampTo(bpm, 0.1);
}

export function setSwing(amount: number, subdivision?: '8n' | '16n'): void {
  const transport = Tone.getTransport();
  transport.swing = amount;
  if (subdivision) transport.swingSubdivision = subdivision;
}

export function stopPhrase(): void {
  Tone.getTransport().stop();
  cleanup?.();
  cleanup = null;
}
