import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Note } from 'tonal';
import { withAudio } from '../../audio/engine';
import { getInstrument, type InstrumentId } from '../../audio/instruments';
import { playEvents, setTempo, stopPhrase } from '../../audio/sequencer';
import { PianoKeyboard, type KeyMark } from '../../components/PianoKeyboard';
import { useComputerKeyboard } from '../../components/useComputerKeyboard';
import { useInstrument } from '../../components/useInstrument';
import {
  CHORD_COLOURS,
  CHORDS_COPY as COPY,
  FUNCTION_COPY,
  PATTERN_COPY,
  PROGRESSIONS,
  type ProgressionPreset,
} from '../../content/chords';
import { INSTRUMENT_COPY } from '../../content/ui';
import { useAppStore, type KeyMode } from '../../store';
import {
  bassNote,
  buildChord,
  diatonicChords,
  displayRoman,
  harmonicFunctions,
  romanToChord,
  voiceChord,
  type ChordInfo,
} from '../../theory/chords';
import { keyId } from '../../theory/keyboard';
import { degreeOf, simplestRoot } from '../../theory/modes';
import { PATTERN_IDS, accompany, progressionLength, type PatternId } from '../../theory/patterns';
import styles from './ChordsPage.module.css';

const CHROMAS = Array.from({ length: 12 }, (_, i) => i);
const CHORD_INSTRUMENTS: InstrumentId[] = ['piano', 'epiano', 'organ', 'pad'];

interface Playback {
  preset: ProgressionPreset;
  pattern: PatternId;
  root: string;
  instrumentId: InstrumentId;
}

export function ChordsPage() {
  const keyChroma = useAppStore((s) => s.keyChroma);
  const keyMode = useAppStore((s) => s.keyMode);
  const setKey = useAppStore((s) => s.setKey);
  const bpm = useAppStore((s) => s.bpm);
  const setBpm = useAppStore((s) => s.setBpm);
  const octave = useAppStore((s) => s.octave);
  const setOctave = useAppStore((s) => s.setOctave);

  const [instrumentId, setInstrumentId] = useState<InstrumentId>('piano');
  const [sevenths, setSevenths] = useState(false);
  const [selected, setSelected] = useState<ChordInfo | null>(null);
  const [preset, setPreset] = useState<ProgressionPreset | null>(null);
  const [pattern, setPattern] = useState<PatternId>('block');
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState<number | null>(null);
  const [lit, setLit] = useState<ReadonlySet<string>>(new Set());
  const lastVoicing = useRef<string[] | undefined>(undefined);
  const stepRef = useRef<number | null>(null);

  const root = simplestRoot(keyChroma, keyMode);
  const chords = diatonicChords(root, keyMode, sevenths);
  const functions = harmonicFunctions(keyMode);
  const { instrument, noteOn, noteOff } = useInstrument(instrumentId);
  const held = useComputerKeyboard({ octave, onNoteOn: noteOn, onNoteOff: noteOff, onOctaveChange: setOctave });

  const stop = () => {
    stopPhrase();
    setPlaying(false);
    setStep(null);
    stepRef.current = null;
    setLit(new Set());
  };

  useEffect(() => stopPhrase, []);

  const playChord = (chord: ChordInfo) => {
    if (playing) stop();
    setSelected(chord);
    const voicing = voiceChord(chord.notes, lastVoicing.current);
    lastVoicing.current = voicing;
    setLit(new Set(voicing.map(keyId)));
    const bass = getInstrument('bass');
    withAudio(() => {
      voicing.forEach((n) => instrument.play(n, '2n', undefined, 0.5));
      bass.play(bassNote(chord.root), '2n', undefined, 0.6);
    });
  };

  const start = ({ preset: p, pattern: pat, root: r, instrumentId: id }: Playback) => {
    const progression = p.romans.map((roman) => romanToChord(r, roman));
    const events = accompany(progression, { pattern: pat, beatsPerChord: p.beatsPerChord });
    const voicings = progression.map(
      (_, i) => new Set(events.filter((e) => e.track === 'chords' && e.step === i).map((e) => keyId(e.note))),
    );
    const band = { chords: getInstrument(id), bass: getInstrument('bass') };
    setPlaying(true);
    setSelected(null);
    void playEvents(events, (e) => (e.track === 'bass' ? band.bass : band.chords), {
      bpm,
      loop: true,
      length: progressionLength(progression.length, p.beatsPerChord),
      onNote: (e) => {
        if (e.step === stepRef.current) return;
        stepRef.current = e.step;
        setStep(e.step);
        setLit(voicings[e.step] ?? new Set());
      },
    });
  };

  /** Apply a change and, if a progression is looping, restart it with the new settings. */
  const restartIfPlaying = (next: Partial<Playback>) => {
    if (!playing || !preset) return;
    start({ preset, pattern, root, instrumentId, ...next });
  };

  const choosePreset = (p: ProgressionPreset) => {
    const chroma = Note.chroma(p.key) ?? 0;
    setKey(chroma, p.mode);
    setBpm(p.bpm);
    setTempo(p.bpm);
    setPreset(p);
    setPattern(p.pattern);
    start({ preset: p, pattern: p.pattern, root: simplestRoot(chroma, p.mode), instrumentId });
  };

  const changeKey = (chroma: number, mode: KeyMode) => {
    setKey(chroma, mode);
    lastVoicing.current = undefined;
    restartIfPlaying({ root: simplestRoot(chroma, mode) });
  };

  const markFor = (note: string): KeyMark => {
    const degree = degreeOf(note, root, keyMode);
    return { degree, label: degree === 1 ? Note.pitchClass(note) : undefined };
  };

  const colourRoot = selected?.root ?? root;

  return (
    <>
      <h1>{COPY.title}</h1>
      <p className="muted">{COPY.intro}</p>

      <section className={`card ${styles.keyBar}`}>
        <div>
          <div className={styles.label}>{COPY.key}</div>
          <div className={styles.roots}>
            {CHROMAS.map((c) => (
              <button
                key={c}
                className="button"
                aria-pressed={c === keyChroma}
                onClick={() => changeKey(c, keyMode)}
              >
                {simplestRoot(c, keyMode)}
              </button>
            ))}
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            {(['ionian', 'aeolian'] as const).map((m) => (
              <button key={m} className="button" aria-pressed={keyMode === m} onClick={() => changeKey(keyChroma, m)}>
                {m === 'ionian' ? COPY.major : COPY.minor}
              </button>
            ))}
          </div>
          <p className={styles.help}>{COPY.keyHelp}</p>
        </div>
        <div>
          <div className={styles.label}>
            {COPY.bpm}：{bpm} {COPY.bpmUnit}
          </div>
          <input
            className={styles.slider}
            type="range"
            min={40}
            max={180}
            value={bpm}
            onChange={(e) => {
              setBpm(Number(e.target.value));
              setTempo(Number(e.target.value));
            }}
          />
          <div className={styles.label} style={{ marginTop: 16 }}>
            {COPY.instrument}
          </div>
          <div className="row">
            {CHORD_INSTRUMENTS.map((id) => (
              <button
                key={id}
                className="button"
                aria-pressed={id === instrumentId}
                onClick={() => {
                  setInstrumentId(id);
                  restartIfPlaying({ instrumentId: id });
                }}
              >
                {INSTRUMENT_COPY[id].name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={`card ${styles.section}`}>
        <h2>
          {COPY.diatonicTitle}（{root} {keyMode === 'ionian' ? COPY.major : COPY.minor}）
        </h2>
        <p className={styles.help}>{COPY.diatonicHelp}</p>
        <div className={styles.diatonic}>
          {chords.map((chord, i) => {
            const fn = functions?.[i];
            return (
              <button
                key={chord.roman}
                className={styles.chord}
                aria-pressed={selected?.symbol === chord.symbol}
                style={{ '--c': `var(--deg-${i + 1})` } as CSSProperties}
                onClick={() => playChord(chord)}
              >
                <span className={styles.roman}>{displayRoman(chord.roman)}</span>
                <span className={styles.symbol}>{chord.symbol}</span>
                {fn && (
                  <span className={styles.fn} data-fn={fn}>
                    {FUNCTION_COPY[fn].name}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className={styles.legendRow}>
          <label className={styles.check}>
            <input type="checkbox" checked={sevenths} onChange={(e) => setSevenths(e.target.checked)} />
            {COPY.sevenths}
          </label>
          {functions && (
            <span className={styles.legend}>
              {COPY.functionLegend}：
              {(['T', 'SD', 'D'] as const).map((fn) => (
                <span key={fn}>
                  <span className={styles.fn} data-fn={fn}>
                    {FUNCTION_COPY[fn].name}
                  </span>
                  {FUNCTION_COPY[fn].help}
                </span>
              ))}
            </span>
          )}
        </div>
      </section>

      <section className={`card ${styles.section}`}>
        <h2>{COPY.colourTitle}</h2>
        <p className={styles.help}>{COPY.colourHelp(colourRoot)}</p>
        <div className={styles.colours}>
          {CHORD_COLOURS.map((colour) => {
            const chord = buildChord(colourRoot, colour.type);
            return (
              <button
                key={colour.type}
                className={styles.colour}
                aria-pressed={selected?.symbol === chord.symbol}
                onClick={() => playChord(chord)}
              >
                <strong>{chord.symbol}</strong>
                <span>{colour.name}</span>
                <small>{colour.mood}</small>
              </button>
            );
          })}
        </div>
        {selected && <p className={styles.notes}>{selected.notes.join(' · ')}</p>}
      </section>

      <section className={`card ${styles.section}`}>
        <h2>{COPY.progressionsTitle}</h2>
        <p className={styles.help}>{COPY.progressionsHelp}</p>
        <div className={styles.presets}>
          {PROGRESSIONS.map((p) => (
            <button
              key={p.id}
              className={styles.preset}
              aria-pressed={preset?.id === p.id}
              onClick={() => choosePreset(p)}
            >
              <strong>{p.name}</strong>
              <span className={styles.romans}>{p.romans.map(displayRoman).join(' – ')}</span>
            </button>
          ))}
        </div>

        {preset && (
          <div className={styles.player}>
            <div className={styles.strip}>
              {preset.romans.map((roman, i) => (
                <span key={i} className={styles.stripChord} data-active={step === i}>
                  <strong>{romanToChord(root, roman).symbol}</strong>
                  <small>{displayRoman(roman)}</small>
                </span>
              ))}
            </div>
            <p>{preset.story}</p>
            <p className={styles.help}>
              {COPY.heardIn}：{preset.heardIn}
            </p>

            <div className={styles.label}>{COPY.pattern}</div>
            <div className="row">
              {PATTERN_IDS.map((id) => (
                <button
                  key={id}
                  className="button"
                  aria-pressed={pattern === id}
                  title={PATTERN_COPY[id].help}
                  onClick={() => {
                    setPattern(id);
                    restartIfPlaying({ pattern: id });
                  }}
                >
                  {PATTERN_COPY[id].name}
                </button>
              ))}
            </div>
            <p className={styles.help}>
              {PATTERN_COPY[pattern].help} {COPY.patternHelp}
            </p>

            <div className="row" style={{ marginTop: 12 }}>
              {playing ? (
                <button className="button" onClick={stop}>
                  {COPY.stop}
                </button>
              ) : (
                <button
                  className="button primary"
                  onClick={() => start({ preset, pattern, root, instrumentId })}
                >
                  {COPY.play}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <PianoKeyboard
        low="C3"
        high="C6"
        activeNotes={new Set([...held, ...lit])}
        markFor={markFor}
        onNoteOn={noteOn}
        onNoteOff={noteOff}
      />
    </>
  );
}
