import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { pianoKeys } from '../theory/keyboard';
import type { Degree } from '../theory/modes';
import styles from './PianoKeyboard.module.css';

export interface KeyMark {
  degree: Degree | null;
  /** Ring the key: the mode's characteristic note. */
  highlight?: boolean;
  label?: string;
}

interface Props {
  low: string;
  high: string;
  /** Notes lit from outside (computer keyboard, playback). Sharp spelling, e.g. "C#4". */
  activeNotes?: ReadonlySet<string>;
  /** Per-key colouring by scale degree. Without it the keyboard is plain. */
  markFor?: (note: string) => KeyMark;
  /** Out-of-scale keys can't be played (safe "everything sounds good" mode). */
  lockToScale?: boolean;
  onNoteOn: (note: string) => void;
  onNoteOff: (note: string) => void;
}

function noteAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-note]');
  if (!el || el.dataset.disabled === 'true') return null;
  return el.dataset.note ?? null;
}

export function PianoKeyboard({ low, high, activeNotes, markFor, lockToScale, onNoteOn, onNoteOff }: Props) {
  const keys = useMemo(() => pianoKeys(low, high), [low, high]);
  const whiteCount = keys.filter((k) => !k.isBlack).length;
  const pointers = useRef(new Map<number, string>());
  const [pressed, setPressed] = useState<ReadonlySet<string>>(new Set());

  const sync = () => setPressed(new Set(pointers.current.values()));

  const press = (pointerId: number, note: string | null) => {
    const previous = pointers.current.get(pointerId);
    if (previous === note) return;
    if (previous) onNoteOff(previous);
    if (note) {
      onNoteOn(note); // sound first, render after
      pointers.current.set(pointerId, note);
    } else {
      pointers.current.delete(pointerId);
    }
    sync();
  };

  const handleDown = (e: PointerEvent<HTMLDivElement>) => {
    const note = noteAt(e.clientX, e.clientY);
    if (!note) return;
    e.preventDefault();
    // Let pointermove hit-test freely so dragging glides across keys.
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    press(e.pointerId, note);
  };

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    press(e.pointerId, noteAt(e.clientX, e.clientY));
  };

  const handleUp = (e: PointerEvent<HTMLDivElement>) => press(e.pointerId, null);

  let whiteIndex = 0;
  const whiteWidth = 100 / whiteCount;

  return (
    <div className={styles.scroller}>
      <div
        className={styles.keyboard}
        style={{ minWidth: `${whiteCount * 34}px` }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onPointerLeave={handleUp}
        onContextMenu={(e) => e.preventDefault()}
        role="group"
        aria-label="钢琴键盘"
      >
        {keys.map((key) => {
          const mark = markFor?.(key.note);
          const inScale = !mark || mark.degree !== null;
          const disabled = Boolean(lockToScale && !inScale);
          const active = pressed.has(key.note) || activeNotes?.has(key.note);
          const left = key.isBlack ? whiteIndex * whiteWidth - whiteWidth * 0.3 : whiteIndex * whiteWidth;
          if (!key.isBlack) whiteIndex++;
          const className = [
            key.isBlack ? styles.black : styles.white,
            mark?.degree ? styles.inScale : '',
            mark && !inScale ? styles.outOfScale : '',
            mark?.highlight ? styles.characteristic : '',
            active ? styles.active : '',
          ].join(' ');
          return (
            <div
              key={key.midi}
              className={className}
              data-note={key.note}
              data-disabled={disabled}
              style={{
                left: `${left}%`,
                width: `${key.isBlack ? whiteWidth * 0.6 : whiteWidth}%`,
                ...(mark?.degree ? ({ '--key-color': `var(--deg-${mark.degree})` } as CSSProperties) : {}),
              }}
            >
              {(mark?.label ?? (key.note.startsWith('C') && !key.isBlack ? key.note : '')) && (
                <span className={styles.label}>{mark?.label ?? key.note}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
