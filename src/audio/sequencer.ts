import * as Tone from 'tone';
import type { NoteEvent } from '../theory/events';
import { ensureAudioStarted } from './engine';
import type { Instrument } from './instruments';

let current: Tone.Part<NoteEvent> | null = null;
let endId: number | null = null;

export interface PlayOptions<E extends NoteEvent> {
  bpm?: number;
  /** Loop the phrase until stopPhrase(); `length` sets the loop point. */
  loop?: boolean;
  /** Total length in transport time; defaults to the end of the last note. */
  length?: string;
  /** Called on the animation frame matching each note, for visual highlights. */
  onNote?: (event: E) => void;
  onEnd?: () => void;
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
    instrumentFor(event).play(event.note, event.duration, time, event.velocity);
    if (options.onNote) Tone.getDraw().schedule(() => options.onNote?.(event), time);
  }, events);
  current = part;

  const end =
    options.length !== undefined
      ? Tone.Time(options.length).toSeconds()
      : events.reduce((max, e) => Math.max(max, Tone.Time(e.time).toSeconds() + Tone.Time(e.duration).toSeconds()), 0);

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

  transport.position = 0;
  transport.start('+0.05');
}

/** Play a single-instrument phrase once. */
export function playPhrase(instrument: Instrument, events: NoteEvent[], options: PlayOptions<NoteEvent> = {}) {
  return playEvents(events, () => instrument, options);
}

/** Change tempo live, e.g. while a progression loops. */
export function setTempo(bpm: number): void {
  Tone.getTransport().bpm.rampTo(bpm, 0.1);
}

export function stopPhrase(): void {
  const transport = Tone.getTransport();
  transport.stop();
  if (endId !== null) transport.clear(endId);
  endId = null;
  current?.dispose();
  current = null;
}
