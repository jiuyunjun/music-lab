import type { CSSProperties } from 'react';
import { Note } from 'tonal';
import { FRET_COUNT, STANDARD_TUNING, noteAt, type Frets } from '../theory/guitar';
import type { Degree } from '../theory/modes';
import styles from './Fretboard.module.css';

interface Props {
  /** Chord shape to show (low E first). */
  shape?: Frets | null;
  /** Scale degree of a note in the current key, for colouring. */
  degreeFor?: (note: string) => Degree | null;
  /** Also show every in-key note, not just the chord. */
  showScale?: boolean;
  /** Strings currently sounding, by string index, for a flash on strum. */
  ringing?: ReadonlySet<number>;
  onPluck: (note: string, string: number, fret: number) => void;
}

const INLAYS = new Set([3, 5, 7, 9, 12]);
const FRETS = Array.from({ length: FRET_COUNT + 1 }, (_, i) => i);
// Tab order: high e on top, low E at the bottom.
const STRINGS = STANDARD_TUNING.map((_, i) => i).reverse();

export function Fretboard({ shape, degreeFor, showScale, ringing, onPluck }: Props) {
  return (
    <div className={styles.scroller}>
      <div className={styles.board} role="group" aria-label="吉他指板">
        {STRINGS.map((string) => {
          const chordFret = shape?.[string];
          return (
            <div key={string} className={styles.string} data-ringing={ringing?.has(string) ?? false}>
              <span className={styles.marker}>{shape ? (chordFret === null ? 'x' : chordFret === 0 ? 'o' : '') : ''}</span>
              {FRETS.map((fret) => {
                const note = noteAt(string, fret);
                const degree = degreeFor?.(note) ?? null;
                const inChord = chordFret === fret && fret > 0;
                const inScale = showScale && degree !== null;
                return (
                  <button
                    key={fret}
                    className={fret === 0 ? styles.nut : styles.fret}
                    onClick={() => onPluck(note, string, fret)}
                    aria-label={Note.pitchClass(note)}
                  >
                    {(inChord || (inScale && !(chordFret === fret))) && (
                      <span
                        className={inChord ? styles.dot : styles.scaleDot}
                        style={degree ? ({ '--c': `var(--deg-${degree})` } as CSSProperties) : undefined}
                      >
                        {Note.pitchClass(note)}
                      </span>
                    )}
                    {fret === 0 && chordFret === 0 && (
                      <span className={styles.open} style={degree ? ({ '--c': `var(--deg-${degree})` } as CSSProperties) : undefined}>
                        {Note.pitchClass(note)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
        <div className={styles.numbers}>
          <span />
          {FRETS.map((fret) => (
            <span key={fret}>{INLAYS.has(fret) ? (fret === 12 ? '••' : '•') : ''}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
