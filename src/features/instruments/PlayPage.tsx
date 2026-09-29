import { useEffect, useState } from 'react';
import { getInstrument, type InstrumentId } from '../../audio/instruments';
import { DRAWBARS, parseDrawbars } from '../../audio/instruments/organ';
import { PianoKeyboard } from '../../components/PianoKeyboard';
import { useComputerKeyboard } from '../../components/useComputerKeyboard';
import { useInstrument } from '../../components/useInstrument';
import { INSTRUMENT_COPY, PLAY_COPY } from '../../content/ui';
import { useAppStore } from '../../store';
import { InstrumentTabs } from './InstrumentTabs';
import styles from './PlayPage.module.css';

const INSTRUMENT_IDS: InstrumentId[] = ['piano', 'epiano', 'organ', 'pad', 'bass'];

export function PlayPage() {
  const instrumentId = useAppStore((s) => s.instrument);
  const setInstrument = useAppStore((s) => s.setInstrument);
  const octave = useAppStore((s) => s.octave);
  const setOctave = useAppStore((s) => s.setOctave);
  const { noteOn, noteOff, loaded } = useInstrument(instrumentId);
  const held = useComputerKeyboard({ octave, onNoteOn: noteOn, onNoteOff: noteOff, onOctaveChange: setOctave });

  return (
    <>
      <InstrumentTabs />
      <h1>{PLAY_COPY.title}</h1>

      <section className={`card ${styles.controls}`}>
        <div>
          <div className={styles.label}>{PLAY_COPY.instrument}</div>
          <div className="row">
            {INSTRUMENT_IDS.map((id) => (
              <button
                key={id}
                className="button"
                aria-pressed={id === instrumentId}
                onClick={() => setInstrument(id)}
              >
                {INSTRUMENT_COPY[id].name}
              </button>
            ))}
          </div>
          <p className="muted">{INSTRUMENT_COPY[instrumentId].blurb}</p>
          {!loaded && <p className={styles.loading}>{PLAY_COPY.loading}</p>}
        </div>

        <div>
          <div className={styles.label}>{PLAY_COPY.octave}</div>
          <div className="row">
            <button className="button" onClick={() => setOctave(octave - 1)} aria-label="降低八度">
              −
            </button>
            <strong className={styles.octave}>C{octave}</strong>
            <button className="button" onClick={() => setOctave(octave + 1)} aria-label="升高八度">
              +
            </button>
          </div>
          <p className="muted">{PLAY_COPY.octaveHelp}</p>
        </div>
      </section>

      {instrumentId === 'organ' && <DrawbarPanel />}

      <PianoKeyboard
        low={`C${octave - 1}`}
        high={`C${octave + 2}`}
        activeNotes={held}
        onNoteOn={noteOn}
        onNoteOff={noteOff}
      />
    </>
  );
}

function DrawbarPanel() {
  const [setting, setSetting] = useState(() => parseDrawbars(PLAY_COPY.organPresets[0]!.value));

  useEffect(() => {
    getInstrument('organ').setDrawbars(setting);
  }, [setting]);

  return (
    <section className={`card ${styles.drawbars}`}>
      <div className={styles.label}>{PLAY_COPY.drawbars}</div>
      <p className="muted">{PLAY_COPY.drawbarsHelp}</p>
      <div className={styles.bars}>
        {DRAWBARS.map((bar, i) => (
          <label key={bar.footage} className={styles.bar}>
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={setting[i] ?? 0}
              onChange={(e) => setSetting(setting.map((v, j) => (j === i ? Number(e.target.value) : v)))}
              aria-label={bar.footage}
            />
            <span>{bar.footage}</span>
          </label>
        ))}
      </div>
      <div className="row">
        <span className="muted">{PLAY_COPY.presets}</span>
        {PLAY_COPY.organPresets.map((preset) => (
          <button
            key={preset.value}
            className="button"
            aria-pressed={setting.join('') === preset.value}
            onClick={() => setSetting(parseDrawbars(preset.value))}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </section>
  );
}
