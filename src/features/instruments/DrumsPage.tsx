import { useEffect, useRef, useState } from 'react';
import { getDrumKit } from '../../audio/drums';
import { withAudio } from '../../audio/engine';
import { setSwing, setTempo, startStepLoop, stopPhrase } from '../../audio/sequencer';
import { DRUM_PIECE_COPY, DRUM_PRESETS, DRUMS_COPY as COPY, type DrumPreset } from '../../content/drums';
import { useAppStore } from '../../store';
import { DRUM_PIECES, STEPS, emptyPattern, hitsAt, normalizePattern, toggleCell, type DrumPiece } from '../../theory/drums';
import { InstrumentTabs } from './InstrumentTabs';
import styles from './DrumsPage.module.css';

/** Pads follow the keyboard keys A S D F G H J K: kick first. */
const PAD_ORDER = [...DRUM_PIECES].reverse();
const STEP_INDEXES = Array.from({ length: STEPS }, (_, i) => i);
const KEY_TO_PIECE = Object.fromEntries(DRUM_PIECES.map((p) => [DRUM_PIECE_COPY[p].key.toLowerCase(), p])) as Record<
  string,
  DrumPiece
>;

export function DrumsPage() {
  const bpm = useAppStore((s) => s.bpm);
  const setBpm = useAppStore((s) => s.setBpm);
  const [preset, setPreset] = useState<DrumPreset>(DRUM_PRESETS[0]!);
  const [pattern, setPattern] = useState(() => normalizePattern(DRUM_PRESETS[0]!.pattern));
  const [swing, setSwingState] = useState(preset.swing);
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [flashing, setFlashing] = useState<ReadonlySet<DrumPiece>>(new Set());

  // The loop reads the pattern live, so edits are heard on the next pass.
  const patternRef = useRef(pattern);
  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  const kit = getDrumKit();

  const flash = (piece: DrumPiece) => {
    setFlashing((s) => new Set([...s, piece]));
    window.setTimeout(
      () =>
        setFlashing((s) => {
          const next = new Set(s);
          next.delete(piece);
          return next;
        }),
      120,
    );
  };

  const hit = (piece: DrumPiece) => {
    withAudio(() => kit.hit(piece));
    flash(piece);
  };

  const start = (p: DrumPreset, tempo: number, swingAmount: number) => {
    setPlaying(true);
    void startStepLoop(
      (step, time) => hitsAt(patternRef.current, step).forEach((h) => kit.hit(h.piece, time, h.velocity)),
      { bpm: tempo, swing: swingAmount, swingSubdivision: p.swingSubdivision, onStepDraw: setPlayhead },
    );
  };

  const stop = () => {
    stopPhrase();
    setPlaying(false);
    setPlayhead(null);
  };

  const choosePreset = (p: DrumPreset) => {
    setPreset(p);
    setPattern(normalizePattern(p.pattern));
    setBpm(p.bpm);
    setSwingState(p.swing);
    if (playing) {
      setTempo(p.bpm);
      setSwing(p.swing, p.swingSubdivision);
    } else {
      start(p, p.bpm, p.swing);
    }
  };

  // Computer keyboard: A S D F G H J K play the pads.
  const hitRef = useRef(hit);
  useEffect(() => {
    hitRef.current = hit;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const piece = KEY_TO_PIECE[e.key.toLowerCase()];
      if (piece) hitRef.current(piece);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => stopPhrase, []);

  return (
    <>
      <InstrumentTabs />
      <h1>{COPY.title}</h1>
      <p className="muted">{COPY.intro}</p>

      <section className={`card ${styles.section}`}>
        <div className={styles.label}>{COPY.presets}</div>
        <div className="row">
          {DRUM_PRESETS.map((p) => (
            <button key={p.id} className="button" aria-pressed={preset.id === p.id} onClick={() => choosePreset(p)}>
              {p.name}
            </button>
          ))}
        </div>
        <p className={styles.help}>{preset.help}</p>

        <div className={styles.transport}>
          {playing ? (
            <button className="button" onClick={stop}>
              {COPY.stop}
            </button>
          ) : (
            <button className="button primary" onClick={() => start(preset, bpm, swing)}>
              {COPY.play}
            </button>
          )}
          <button className="button" onClick={() => setPattern(emptyPattern())}>
            {COPY.clear}
          </button>
          <label className={styles.slider}>
            {COPY.bpm} {bpm}
            <input
              type="range"
              min={60}
              max={180}
              value={bpm}
              onChange={(e) => {
                setBpm(Number(e.target.value));
                setTempo(Number(e.target.value));
              }}
            />
          </label>
          <label className={styles.slider} title={COPY.swingHelp}>
            {COPY.swing} {Math.round(swing * 100)}%
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={swing}
              onChange={(e) => {
                setSwingState(Number(e.target.value));
                setSwing(Number(e.target.value), preset.swingSubdivision);
              }}
            />
          </label>
        </div>
      </section>

      <section className={`card ${styles.gridCard}`}>
        <div className={styles.grid}>
          {DRUM_PIECES.map((piece) => (
            <div key={piece} className={styles.row}>
              <button className={styles.rowLabel} onClick={() => hit(piece)} title={DRUM_PIECE_COPY[piece].help}>
                {DRUM_PIECE_COPY[piece].name}
              </button>
              {STEP_INDEXES.map((step) => {
                const cell = pattern[piece][step] ?? '.';
                return (
                  <button
                    key={step}
                    className={styles.cell}
                    data-cell={cell === '.' ? 'rest' : cell === 'X' ? 'accent' : 'hit'}
                    data-beat={step % 4 === 0}
                    data-group={Math.floor(step / 4) % 2}
                    data-playhead={playhead === step}
                    aria-label={`${DRUM_PIECE_COPY[piece].name} ${step + 1}`}
                    onClick={() => {
                      const row = toggleCell(pattern[piece], step);
                      setPattern({ ...pattern, [piece]: row });
                      if (row[step] !== '.') hit(piece);
                    }}
                  />
                );
              })}
            </div>
          ))}
          <div className={styles.row}>
            <span />
            {STEP_INDEXES.map((step) => (
              <span key={step} className={styles.beatNumber}>
                {step % 4 === 0 ? step / 4 + 1 : ''}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className={`card ${styles.section}`}>
        <div className={styles.label}>{COPY.pads}</div>
        <div className={styles.pads}>
          {PAD_ORDER.map((piece) => (
            <button
              key={piece}
              className={styles.pad}
              data-flash={flashing.has(piece)}
              onPointerDown={(e) => {
                e.preventDefault();
                hit(piece);
              }}
            >
              <strong>{DRUM_PIECE_COPY[piece].name}</strong>
              <kbd>{DRUM_PIECE_COPY[piece].key}</kbd>
              <small>{DRUM_PIECE_COPY[piece].help}</small>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
