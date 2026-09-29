import * as Tone from 'tone';
import type { NoteEvent } from '../theory/events';
import { ensureAudioStarted } from './engine';
import type { Instrument } from './instruments';

let current: Tone.Part<NoteEvent> | null = null;
let endId: number | null = null;

export interface PlayOptions {
  bpm?: number;
  /** Called on the animation frame matching each note, for visual highlights. */
  onNote?: (event: NoteEvent) => void;
  onEnd?: () => void;
}

/** Play a phrase once on the shared transport, replacing whatever was playing. */
export async function playPhrase(instrument: Instrument, events: NoteEvent[], options: PlayOptions = {}): Promise<void> {
  await ensureAudioStarted();
  stopPhrase();
  const transport = Tone.getTransport();
  transport.bpm.value = options.bpm ?? 100;

  current = new Tone.Part<NoteEvent>((time, event) => {
    instrument.play(event.note, event.duration, time, event.velocity);
    if (options.onNote) Tone.getDraw().schedule(() => options.onNote?.(event), time);
  }, events).start(0);

  const end = events.reduce(
    (max, e) => Math.max(max, Tone.Time(e.time).toSeconds() + Tone.Time(e.duration).toSeconds()),
    0,
  );
  endId = transport.scheduleOnce((time) => {
    Tone.getDraw().schedule(() => {
      stopPhrase();
      options.onEnd?.();
    }, time);
  }, end + 0.05);

  transport.position = 0;
  transport.start('+0.05');
}

export function stopPhrase(): void {
  const transport = Tone.getTransport();
  transport.stop();
  if (endId !== null) transport.clear(endId);
  endId = null;
  current?.dispose();
  current = null;
}
