import { createEPiano } from './epiano';
import { createOrgan, type OrganInstrument } from './organ';
import { createPad } from './pad';
import { createPiano } from './piano';
import type { Instrument, InstrumentId } from './types';

export type { Instrument, InstrumentId } from './types';
export type { OrganInstrument } from './organ';

const factories: Record<InstrumentId, () => Instrument> = {
  piano: createPiano,
  epiano: createEPiano,
  organ: createOrgan,
  pad: createPad,
};

const cache = new Map<InstrumentId, Instrument>();

/** Lazily created, shared instrument instances (one per id). */
export function getInstrument(id: 'organ'): OrganInstrument;
export function getInstrument(id: InstrumentId): Instrument;
export function getInstrument(id: InstrumentId): Instrument {
  let instrument = cache.get(id);
  if (!instrument) {
    instrument = factories[id]();
    cache.set(id, instrument);
  }
  return instrument;
}
