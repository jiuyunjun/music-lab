import { MODE_COPY } from '../../content/modes';
import { romanToChord } from '../../theory/chords';
import { melodyToEvents, runToEvents, type NoteEvent } from '../../theory/events';
import { modeNotesInRange, type ModeId } from '../../theory/modes';
import { accompany, type ArrangedEvent } from '../../theory/patterns';

function asMelody(events: NoteEvent[]): ArrangedEvent[] {
  return events.map((e) => ({ ...e, track: 'melody', step: 0 }));
}

export function vampChords(root: string, mode: ModeId) {
  return MODE_COPY[mode].vamp.map((roman) => romanToChord(root, roman));
}

/** Demo melody over the mode's vamp: home / colour / home / colour / home. */
export function modeDemoEvents(root: string, mode: ModeId, backing: boolean): ArrangedEvent[] {
  const melody = asMelody(melodyToEvents(`${root}4`, mode, MODE_COPY[mode].demo));
  if (!backing) return melody;
  const [home, colour] = vampChords(root, mode);
  if (!home || !colour) return melody;
  return [...accompany([home, colour, home, colour, home], { pattern: 'pad' }), ...melody];
}

/** Scale up and down in eighths, over the home chord held for two bars. */
export function scaleRunEvents(root: string, mode: ModeId, backing: boolean): ArrangedEvent[] {
  const up = modeNotesInRange(root, mode, `${root}4`, `${root}5`);
  const melody = asMelody(runToEvents([...up, ...up.slice(0, -1).reverse()]));
  const [home] = vampChords(root, mode);
  if (!backing || !home) return melody;
  return [...accompany([home], { pattern: 'pad', beatsPerChord: 8 }), ...melody];
}
