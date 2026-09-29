import { useCallback, useEffect, useReducer } from 'react';
import { withAudio } from '../audio/engine';
import { getInstrument, type InstrumentId } from '../audio/instruments';

/** Stable noteOn/noteOff callbacks for an instrument, plus its sample-loading state. */
export function useInstrument(id: InstrumentId) {
  const instrument = getInstrument(id); // cached, so stable per id
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    let alive = true;
    if (!instrument.isLoaded()) void instrument.loaded.then(() => alive && rerender());
    return () => {
      alive = false;
      instrument.releaseAll();
    };
  }, [instrument]);

  const noteOn = useCallback((note: string) => withAudio(() => instrument.noteOn(note)), [instrument]);
  const noteOff = useCallback((note: string) => instrument.noteOff(note), [instrument]);

  return { instrument, loaded: instrument.isLoaded(), noteOn, noteOff };
}
