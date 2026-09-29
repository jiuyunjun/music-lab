import { useEffect, useRef, useState } from 'react';
import { Chord } from 'tonal';
import { getInstrument } from '../../audio/instruments';
import { playEvents, stopPhrase } from '../../audio/sequencer';
import { strumNow } from '../../audio/strum';
import { withAudio } from '../../audio/engine';
import { Fretboard } from '../../components/Fretboard';
import { CHORDS_COPY } from '../../content/chords';
import { GUITAR_COPY as COPY, OPEN_CHORD_NAMES, STRUM_PATTERN_COPY } from '../../content/guitar';
import { useAppStore } from '../../store';
import { buildChord, diatonicChords, displayRoman, voiceChord, type ChordInfo } from '../../theory/chords';
import { guitarShape } from '../../theory/guitar';
import { degreeOf, simplestRoot } from '../../theory/modes';
import { STRUM_PATTERNS, accompany } from '../../theory/patterns';
import { InstrumentTabs } from './InstrumentTabs';
import styles from './GuitarPage.module.css';

function parseChordName(name: string): ChordInfo {
  const tonic = Chord.get(name).tonic ?? name[0] ?? 'C';
  return buildChord(tonic, name.slice(tonic.length));
}

const OPEN_CHORDS = OPEN_CHORD_NAMES.map(parseChordName);

export function GuitarPage() {
  const keyChroma = useAppStore((s) => s.keyChroma);
  const keyMode = useAppStore((s) => s.keyMode);
  const bpm = useAppStore((s) => s.bpm);
  const setBpm = useAppStore((s) => s.setBpm);

  const root = simplestRoot(keyChroma, keyMode);
  const keyChords = diatonicChords(root, keyMode);
  const [selected, setSelected] = useState<ChordInfo>(() => keyChords[0] ?? OPEN_CHORDS[0]!);
  const [showScale, setShowScale] = useState(false);
  const [rhythm, setRhythm] = useState<string>(STRUM_PATTERNS[0].id);
  const [looping, setLooping] = useState(false);
  const [ringing, setRinging] = useState<ReadonlySet<number>>(new Set());
  const ringTimer = useRef<number | undefined>(undefined);

  const guitar = getInstrument('guitar');
  const shape = guitarShape(selected);
  const notes = shape?.notes ?? voiceChord(selected.notes);

  const flash = (down: boolean) => {
    const strings = shape ? shape.frets.flatMap((f, i) => (f === null ? [] : [i])) : [0, 1, 2, 3, 4, 5];
    setRinging(new Set(down ? strings : strings.slice(-4)));
    window.clearTimeout(ringTimer.current);
    ringTimer.current = window.setTimeout(() => setRinging(new Set()), 250);
  };

  const strum = (down: boolean) => {
    strumNow(guitar, notes, down);
    flash(down);
  };

  const startLoop = (chord: ChordInfo, rhythmId: string) => {
    const pattern = STRUM_PATTERNS.find((p) => p.id === rhythmId)?.value;
    const events = accompany([chord], { pattern: 'strum', strumPattern: pattern, bass: false });
    setLooping(true);
    void playEvents(events, () => guitar, { bpm, loop: true, length: '1m' });
  };

  const stopLoop = () => {
    stopPhrase();
    setLooping(false);
  };

  const choose = (chord: ChordInfo) => {
    setSelected(chord);
    if (looping) startLoop(chord, rhythm);
    else {
      const s = guitarShape(chord);
      strumNow(guitar, s?.notes ?? voiceChord(chord.notes), true);
    }
  };

  // Arrow keys strum: ↓ down, ↑ up.
  const strumRef = useRef(strum);
  useEffect(() => {
    strumRef.current = strum;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      e.preventDefault();
      strumRef.current(e.key === 'ArrowDown');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => stopPhrase, []);

  const chordButton = (chord: ChordInfo, label?: string) => (
    <button
      key={`${label ?? ''}${chord.symbol}`}
      className={styles.chord}
      aria-pressed={selected.symbol === chord.symbol}
      onClick={() => choose(chord)}
    >
      {label && <small>{label}</small>}
      <strong>{chord.symbol}</strong>
    </button>
  );

  return (
    <>
      <InstrumentTabs />
      <h1>{COPY.title}</h1>
      <p className="muted">{COPY.intro}</p>

      <section className={`card ${styles.section}`}>
        <div className={styles.label}>{COPY.keyChords(`${root} ${keyMode === 'ionian' ? CHORDS_COPY.major : CHORDS_COPY.minor}`)}</div>
        <div className={styles.chords}>{keyChords.map((c) => chordButton(c, displayRoman(c.roman)))}</div>
        <div className={styles.label} style={{ marginTop: 14 }}>
          {COPY.openChords}
        </div>
        <div className={styles.chords}>{OPEN_CHORDS.map((c) => chordButton(c))}</div>
      </section>

      <section className={`card ${styles.section}`}>
        <div className={styles.header}>
          <h2>{selected.symbol}</h2>
          <span className="muted">{selected.notes.join(' · ')}</span>
          <label className={styles.check}>
            <input type="checkbox" checked={showScale} onChange={(e) => setShowScale(e.target.checked)} />
            {COPY.showScale}
          </label>
        </div>
        <Fretboard
          shape={shape?.frets}
          degreeFor={(n) => degreeOf(n, root, keyMode)}
          showScale={showScale}
          ringing={ringing}
          onPluck={(note, string) => {
            withAudio(() => guitar.play(note, '1n', undefined, 0.85));
            setRinging(new Set([string]));
          }}
        />
        <p className={styles.help}>{shape ? COPY.fretboardHelp : COPY.noShape}</p>

        <div className={styles.strum}>
          <button className={`button primary ${styles.big}`} onClick={() => strum(true)}>
            {COPY.strumDown}
          </button>
          <button className={`button ${styles.big}`} onClick={() => strum(false)}>
            {COPY.strumUp}
          </button>
          <span className="muted">{COPY.strumHint}</span>
        </div>
      </section>

      <section className={`card ${styles.section}`}>
        <div className={styles.label}>{COPY.rhythm}</div>
        <div className="row">
          {STRUM_PATTERNS.map((p) => (
            <button
              key={p.id}
              className="button"
              aria-pressed={rhythm === p.id}
              onClick={() => {
                setRhythm(p.id);
                if (looping) startLoop(selected, p.id);
              }}
            >
              {STRUM_PATTERN_COPY[p.id]?.name}
              <code className={styles.code}>{p.value}</code>
            </button>
          ))}
        </div>
        <p className={styles.help}>
          {STRUM_PATTERN_COPY[rhythm]?.help} {COPY.rhythmHelp}
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          {looping ? (
            <button className="button" onClick={stopLoop}>
              {COPY.stop}
            </button>
          ) : (
            <button className="button primary" onClick={() => startLoop(selected, rhythm)}>
              {COPY.play}
            </button>
          )}
          <label className={styles.check}>
            {CHORDS_COPY.bpm} {bpm}
            <input
              type="range"
              min={50}
              max={160}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              onPointerUp={() => looping && startLoop(selected, rhythm)}
            />
          </label>
        </div>
      </section>
    </>
  );
}
