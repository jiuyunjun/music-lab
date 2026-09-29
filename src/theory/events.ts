import { Interval, Note } from 'tonal';
import { modeIntervals, type Degree, type ModeId } from './modes';

/** A note scheduled in Tone.js transport time ("bars:quarters:sixteenths"). */
export interface NoteEvent {
  time: string;
  note: string;
  duration: string;
  velocity: number;
  /** Extra delay in seconds after `time`, e.g. the spread between strings in a strum. */
  offset?: number;
}

/**
 * One step of a degree-based melody: [degree, octaveShift, lengthIn16ths].
 * degree 0 is a rest. Writing melodies as degrees lets the same phrase be
 * played in any root and any mode.
 */
export type MelodyStep = readonly [degree: Degree | 0, octave: number, sixteenths: number];

export function sixteenths(n: number): string {
  return `0:0:${n}`;
}

/** Note for a scale degree above `tonic` (a note with octave, e.g. "D4"). */
export function degreeToNote(tonic: string, mode: ModeId, degree: Degree, octaveShift = 0): string {
  const interval = modeIntervals(mode)[degree - 1];
  if (!interval) throw new Error(`Invalid degree ${degree}`);
  const octave = Interval.fromSemitones(12 * octaveShift);
  return Note.transpose(Note.transpose(tonic, interval), octave);
}

export function melodyToEvents(tonic: string, mode: ModeId, steps: readonly MelodyStep[]): NoteEvent[] {
  const events: NoteEvent[] = [];
  let cursor = 0;
  for (const [degree, octave, length] of steps) {
    if (degree !== 0) {
      events.push({
        time: sixteenths(cursor),
        note: degreeToNote(tonic, mode, degree, octave),
        duration: sixteenths(length),
        // Phrase-like dynamics: strong downbeats, lighter off-beats.
        velocity: cursor % 16 === 0 ? 0.85 : cursor % 4 === 0 ? 0.75 : 0.62,
      });
    }
    cursor += length;
  }
  return events;
}

/** Evenly spaced notes, e.g. a scale run in eighth notes. */
export function runToEvents(notes: readonly string[], stepSixteenths = 2): NoteEvent[] {
  return notes.map((note, i) => ({
    time: sixteenths(i * stepSixteenths),
    note,
    duration: sixteenths(stepSixteenths),
    velocity: 0.75,
  }));
}
