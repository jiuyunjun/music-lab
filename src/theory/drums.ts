import { sixteenths } from './events';

export const DRUM_PIECES = ['crash', 'openHat', 'hat', 'tomHigh', 'tomLow', 'clap', 'snare', 'kick'] as const;
export type DrumPiece = (typeof DRUM_PIECES)[number];

export const STEPS = 16;

/**
 * One bar of 16 sixteenth-note steps per piece:
 * "X" = accent, "x" = normal hit, "." = rest.
 */
export type DrumPattern = Partial<Record<DrumPiece, string>>;

export interface DrumEvent {
  time: string;
  piece: DrumPiece;
  velocity: number;
  step: number;
}

export function emptyPattern(): Record<DrumPiece, string> {
  return Object.fromEntries(DRUM_PIECES.map((p) => [p, '.'.repeat(STEPS)])) as Record<DrumPiece, string>;
}

/** Fill in missing rows and pad/cut every row to exactly 16 steps. */
export function normalizePattern(pattern: DrumPattern): Record<DrumPiece, string> {
  const full = emptyPattern();
  for (const piece of DRUM_PIECES) {
    const row = pattern[piece];
    if (row) full[piece] = row.padEnd(STEPS, '.').slice(0, STEPS);
  }
  return full;
}

export function hitVelocity(cell: string): number {
  if (cell === 'X') return 1;
  if (cell === 'x') return 0.72;
  return 0;
}

/** Cycle a cell: rest -> hit -> accent -> rest. */
export function toggleCell(row: string, step: number): string {
  const next: Record<string, string> = { '.': 'x', x: 'X', X: '.' };
  return row.slice(0, step) + (next[row[step] ?? '.'] ?? '.') + row.slice(step + 1);
}

/** Every hit in one step, for a step-by-step player. */
export function hitsAt(pattern: DrumPattern, step: number): { piece: DrumPiece; velocity: number }[] {
  const full = normalizePattern(pattern);
  return DRUM_PIECES.flatMap((piece) => {
    const velocity = hitVelocity(full[piece][step % STEPS] ?? '.');
    return velocity ? [{ piece, velocity }] : [];
  });
}

/** All hits of `bars` bars as timed events. */
export function drumEvents(pattern: DrumPattern, bars = 1): DrumEvent[] {
  const events: DrumEvent[] = [];
  for (let step = 0; step < STEPS * bars; step++) {
    for (const hit of hitsAt(pattern, step)) events.push({ time: sixteenths(step), step: step % STEPS, ...hit });
  }
  return events;
}
