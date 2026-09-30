import type { InstrumentId } from '../audio/instruments';
import type { ModeId } from '../theory/modes';
import type { QuoteNote } from '../theory/song';
import { PACHELBEL_KEY, PACHELBEL_VIOLIN } from './pachelbel';
import { ROMANCE_KEY, ROMANCE_PROGRESSIONS, ROMANCE_SEGMENTS } from './romance';

export const QUOTE_PIECE_IDS = ['pachelbel', 'romance'] as const;
export type QuotePieceId = (typeof QUOTE_PIECE_IDS)[number];

/** A written-out piece the arranger can play as its melody track. */
export interface QuotePiece {
  key: string;
  segments: readonly (readonly QuoteNote[])[];
  /** Chords per segment when sections differ. */
  progressions?: readonly (readonly string[])[];
  /** Earlier segments sounding together (canon voices). */
  voices: number;
  /** Add a closing bar on the home chord. */
  ending: boolean;
  /** Song settings the piece is written for. */
  song: { keyChroma: number; mode: ModeId; progression: string[]; beatsPerChord: 2 | 3 | 4; bpm: number };
  instrument: InstrumentId;
  /** First segment that can start an excerpt (Pachelbel's segment 0 is bass alone). */
  firstSegment: number;
}

export const QUOTE_PIECES: Record<QuotePieceId, QuotePiece> = {
  pachelbel: {
    key: PACHELBEL_KEY,
    segments: PACHELBEL_VIOLIN,
    voices: 2,
    ending: true,
    song: { keyChroma: 2, mode: 'ionian', progression: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'], beatsPerChord: 2, bpm: 104 },
    instrument: 'piano',
    firstSegment: 1,
  },
  romance: {
    key: ROMANCE_KEY,
    segments: ROMANCE_SEGMENTS,
    progressions: ROMANCE_PROGRESSIONS,
    voices: 0,
    ending: false, // the piece already ends on a held E major chord
    song: { keyChroma: 4, mode: 'aeolian', progression: [...ROMANCE_PROGRESSIONS[0]!], beatsPerChord: 3, bpm: 84 },
    instrument: 'guitar',
    firstSegment: 0,
  },
};

/** Last segment an excerpt of `piece` can start on. */
export function lastSegment(piece: QuotePieceId): number {
  return QUOTE_PIECES[piece].segments.length - 1;
}
