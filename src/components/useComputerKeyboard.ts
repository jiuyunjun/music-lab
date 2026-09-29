import { useEffect, useRef, useState } from 'react';
import { computerKeyToNote } from '../theory/keyboard';

interface Options {
  octave: number;
  onNoteOn: (note: string) => void;
  onNoteOff: (note: string) => void;
  onOctaveChange?: (octave: number) => void;
  /** Return false to ignore a note (e.g. out of scale while locked). */
  accept?: (note: string) => boolean;
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

/** Play notes from the computer keyboard; returns the notes currently held. */
export function useComputerKeyboard(options: Options): ReadonlySet<string> {
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });
  const held = useRef(new Map<string, string>()); // key code -> note
  const [active, setActive] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const sync = () => setActive(new Set(held.current.values()));

    const down = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      const { octave, onNoteOn, onOctaveChange, accept } = latest.current;
      const key = e.key.toLowerCase();
      if (key === 'z' || key === 'x') {
        onOctaveChange?.(octave + (key === 'z' ? -1 : 1));
        return;
      }
      const note = computerKeyToNote(key, octave);
      if (!note || held.current.has(e.code) || (accept && !accept(note))) return;
      onNoteOn(note);
      held.current.set(e.code, note);
      sync();
    };

    const up = (e: KeyboardEvent) => {
      const note = held.current.get(e.code);
      if (!note) return;
      latest.current.onNoteOff(note);
      held.current.delete(e.code);
      sync();
    };

    const releaseAll = () => {
      held.current.forEach((note) => latest.current.onNoteOff(note));
      held.current.clear();
      sync();
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', releaseAll);
    return () => {
      releaseAll();
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', releaseAll);
    };
  }, []);

  return active;
}
