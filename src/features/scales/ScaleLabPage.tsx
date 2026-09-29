import { useEffect, useState, type CSSProperties } from 'react';
import { Note } from 'tonal';
import { withAudio } from '../../audio/engine';
import { getInstrument } from '../../audio/instruments';
import { playPhrase, stopPhrase } from '../../audio/sequencer';
import { PianoKeyboard, type KeyMark } from '../../components/PianoKeyboard';
import { useComputerKeyboard } from '../../components/useComputerKeyboard';
import { useInstrument } from '../../components/useInstrument';
import { MODE_COPY, SCALE_LAB_COPY as COPY } from '../../content/modes';
import { useAppStore } from '../../store';
import { melodyToEvents, runToEvents } from '../../theory/events';
import { keyId } from '../../theory/keyboard';
import {
  MODES,
  MODES_BY_BRIGHTNESS,
  characteristicNote,
  degreeOf,
  modeNotes,
  modeNotesInRange,
  parentMajor,
  relativeRoot,
  simplestRoot,
  type ModeId,
} from '../../theory/modes';
import styles from './ScaleLabPage.module.css';

type Compare = 'parallel' | 'relative';

const CHROMAS = Array.from({ length: 12 }, (_, i) => i);

function rootFor(chroma: number, mode: ModeId) {
  return simplestRoot(chroma, mode);
}

export function ScaleLabPage() {
  const rootChroma = useAppStore((s) => s.rootChroma);
  const setRootChroma = useAppStore((s) => s.setRootChroma);
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const instrumentId = useAppStore((s) => s.instrument);
  const octave = useAppStore((s) => s.octave);
  const setOctave = useAppStore((s) => s.setOctave);

  const [compare, setCompare] = useState<Compare>('parallel');
  const [drone, setDrone] = useState(false);
  const [lock, setLock] = useState(false);
  const [lit, setLit] = useState<ReadonlySet<string>>(new Set());
  const [playing, setPlaying] = useState(false);

  const root = rootFor(rootChroma, mode);
  const notes = modeNotes(root, mode);
  const colourNote = characteristicNote(root, mode);
  const parent = parentMajor(root, mode);
  const copy = MODE_COPY[mode];

  const { instrument, noteOn, noteOff } = useInstrument(instrumentId);

  const held = useComputerKeyboard({
    octave,
    onNoteOn: noteOn,
    onNoteOff: noteOff,
    onOctaveChange: setOctave,
    accept: (note) => !lock || degreeOf(note, root, mode) !== null,
  });
  const active = new Set([...held, ...lit]);

  const markFor = (note: string): KeyMark => {
    const degree = degreeOf(note, root, mode);
    return {
      degree,
      highlight: degree === MODES[mode].characteristicDegree,
      label: degree === 1 ? Note.pitchClass(note) : degree ? String(degree) : undefined,
    };
  };

  const play = (events: ReturnType<typeof runToEvents>, bpm: number) => {
    setPlaying(true);
    void playPhrase(instrument, events, {
      bpm,
      onNote: (e) => setLit(new Set([keyId(e.note)])),
      onEnd: () => {
        setLit(new Set());
        setPlaying(false);
      },
    });
  };

  const playScale = (r = root, m = mode) => {
    const up = modeNotesInRange(r, m, `${r}4`, `${r}5`);
    play(runToEvents([...up, ...up.slice(0, -1).reverse()]), 120);
  };

  const playDemo = (r = root, m = mode) => play(melodyToEvents(`${r}4`, m, MODE_COPY[m].demo), 96);

  const stop = () => {
    stopPhrase();
    setLit(new Set());
    setPlaying(false);
  };

  const chooseMode = (next: ModeId) => {
    let nextChroma = rootChroma;
    if (compare === 'relative') {
      // Keep the same set of notes, move "home" to where this mode starts.
      nextChroma = Note.chroma(relativeRoot(parent, next)) ?? rootChroma;
      setRootChroma(nextChroma);
    }
    setMode(next);
    playDemo(rootFor(nextChroma, next), next);
  };

  // Drone: the root held in two low octaves under whatever the user plays.
  useEffect(() => {
    if (!drone) return;
    const pad = getInstrument('pad');
    const low = [`${root}2`, `${root}3`];
    withAudio(() => low.forEach((n) => pad.noteOn(n, 0.3)));
    return () => low.forEach((n) => pad.noteOff(n));
  }, [drone, root]);

  useEffect(() => stopPhrase, []);

  return (
    <>
      <h1>{COPY.title}</h1>
      <p className="muted">{COPY.intro}</p>
      <aside className={styles.hint}>💡 {COPY.zeldaHint}</aside>

      <section className={`card ${styles.controls}`}>
        <div>
          <div className={styles.label} title={COPY.rootHelp}>
            {COPY.rootLabel}
          </div>
          <div className={styles.roots}>
            {CHROMAS.map((c) => (
              <button
                key={c}
                className="button"
                aria-pressed={c === rootChroma}
                onClick={() => {
                  setRootChroma(c);
                  playScale(rootFor(c, mode), mode);
                }}
              >
                {rootFor(c, mode)}
              </button>
            ))}
          </div>
          <p className={styles.help}>{COPY.rootHelp}</p>
        </div>

        <div>
          <div className={styles.label}>{COPY.compareLabel}</div>
          <div className="row">
            {(['parallel', 'relative'] as const).map((c) => (
              <button key={c} className="button" aria-pressed={compare === c} onClick={() => setCompare(c)}>
                {COPY[c]}
              </button>
            ))}
          </div>
          <p className={styles.help}>{compare === 'parallel' ? COPY.parallelHelp : COPY.relativeHelp}</p>
        </div>
      </section>

      <section className={styles.dial} aria-label={COPY.brightness}>
        <div className={styles.dialCaption}>
          <span>☀️</span>
          <span className="muted">{COPY.brightness}</span>
          <span>🌑</span>
        </div>
        <div className={styles.modes}>
          {MODES_BY_BRIGHTNESS.map((m) => (
            <button
              key={m}
              className={styles.mode}
              aria-pressed={m === mode}
              onClick={() => chooseMode(m)}
              data-dark={MODES[m].brightness >= 4}
              style={{ '--shade': `${(MODES[m].brightness - 1) / 6}` } as CSSProperties}
            >
              <strong>{MODE_COPY[m].name}</strong>
              <small>{MODE_COPY[m].zh}</small>
            </button>
          ))}
        </div>
      </section>

      <section className={`card ${styles.info}`}>
        <header className={styles.infoHeader}>
          <h2>
            {root} {copy.name}
          </h2>
          <span className="muted">{COPY.sharesKeysWith(parent)}</span>
        </header>

        <div className={styles.degrees}>
          {notes.map((n, i) => (
            <span
              key={n}
              className={styles.degree}
              data-colour={n === colourNote}
              style={{ '--c': `var(--deg-${i + 1})` } as CSSProperties}
            >
              <b>{i + 1}</b>
              {n}
            </span>
          ))}
        </div>

        <dl className={styles.facts}>
          <dt>{COPY.mood}</dt>
          <dd>{copy.mood}</dd>
          <dt>
            {COPY.colourNote}（{colourNote}）
          </dt>
          <dd>{copy.colour}</dd>
          <dt>{COPY.heardIn}</dt>
          <dd>{copy.heardIn}</dd>
        </dl>

        <div className="row">
          <button className="button primary" onClick={() => playScale()}>
            {COPY.playScale}
          </button>
          <button className="button primary" onClick={() => playDemo()}>
            {COPY.playDemo}
          </button>
          {playing && (
            <button className="button" onClick={stop}>
              {COPY.stop}
            </button>
          )}
        </div>
        <p className={styles.help}>{COPY.demoNote}</p>
      </section>

      <section className={`card ${styles.jam}`}>
        <div className="row">
          <button className="button" aria-pressed={drone} onClick={() => setDrone(!drone)}>
            {drone ? COPY.droneOff : COPY.droneOn}
          </button>
          <label className={styles.lock}>
            <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} />
            {COPY.lockLabel}
          </label>
        </div>
        <p className={styles.help}>{COPY.droneHelp}</p>
      </section>

      <PianoKeyboard
        low="C3"
        high="C6"
        activeNotes={active}
        markFor={markFor}
        lockToScale={lock}
        onNoteOn={noteOn}
        onNoteOff={noteOff}
      />
    </>
  );
}
