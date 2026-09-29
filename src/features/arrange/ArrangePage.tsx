import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { drumsAsInstrument } from '../../audio/drums';
import { getInstrument, type Instrument } from '../../audio/instruments';
import { playEvents, stopPhrase } from '../../audio/sequencer';
import {
  ARRANGE_COPY as COPY,
  ARRANGE_TEMPLATES,
  BASS_STYLE_COPY,
  LANE_COPY,
  MELODY_STYLE_COPY,
  TRICK_COPY,
} from '../../content/arrange';
import { PATTERN_COPY, PROGRESSIONS } from '../../content/chords';
import { DRUM_PRESETS } from '../../content/drums';
import { STRUM_PATTERN_COPY } from '../../content/guitar';
import { MODE_COPY } from '../../content/modes';
import { INSTRUMENT_COPY } from '../../content/ui';
import { BASS_STYLES } from '../../theory/bass';
import { diatonicChords, displayRoman, reharmonize, romanToChord } from '../../theory/chords';
import { sixteenths } from '../../theory/events';
import { MODE_IDS, simplestRoot, type ModeId } from '../../theory/modes';
import { PATTERN_IDS, STRUM_PATTERNS } from '../../theory/patterns';
import { buildSong, type SongEvent } from '../../theory/song';
import {
  DEFAULT_PROJECT,
  HARMONY_INSTRUMENTS,
  MELODY_INSTRUMENTS,
  decodeProject,
  drumPreset,
  encodeProject,
  laneOf,
  loadSaved,
  projectTonic,
  save,
  toSpec,
  type Lane,
  type Project,
} from './project';
import { Timeline } from './Timeline';
import styles from './ArrangePage.module.css';

const CHROMAS = Array.from({ length: 12 }, (_, i) => i);

export function ArrangePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [project, setProject] = useState<Project>(() => loadSaved() ?? DEFAULT_PROJECT);
  const [notice, setNotice] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState<{ cycle: number; step: number } | null>(null);
  const [solo, setSolo] = useState<Lane | null>(null);

  // Mixer changes apply live through refs; everything else rebuilds the song.
  const mixerRef = useRef(project.mixer);
  const soloRef = useRef(solo);
  const positionKey = useRef(-1);
  useEffect(() => {
    mixerRef.current = project.mixer;
    soloRef.current = solo;
  });

  useEffect(() => save(project), [project]);

  // A shared link (?p=...) can arrive on first load or while the page is open.
  // Load it, then drop it from the URL so later edits aren't overwritten on reload.
  useEffect(() => {
    const shared = searchParams.get('p');
    if (shared === null) return;
    const fromLink = decodeProject(shared);
    /* eslint-disable react-hooks/set-state-in-effect -- syncing from the URL, an external system */
    if (fromLink) setProject(fromLink);
    setNotice(fromLink ? COPY.loadedFromLink : COPY.badLink);
    /* eslint-enable react-hooks/set-state-in-effect */
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const tonic = projectTonic(project);
  const song = buildSong(toSpec(project));
  const chordLength = project.beatsPerChord * 4;
  const update = (patch: Partial<Project>) => setProject((p) => ({ ...p, ...patch }));
  const audible = (lane: Lane) => !project.mixer[lane].muted && (!solo || solo === lane) && project[lane].on;

  const schedule = useEffectEvent(() => {
    const melody = getInstrument(project.melody.instrument);
    const band: Record<SongEvent['track'], Instrument> = {
      melody,
      counter: melody,
      chords: getInstrument(project.harmony.instrument),
      bass: getInstrument('bass'),
      drums: drumsAsInstrument(),
    };
    const preset = drumPreset(project.drums.preset);
    positionKey.current = -1;
    void playEvents(song.events, (e) => band[e.track], {
      bpm: project.bpm,
      loop: true,
      length: sixteenths(song.length),
      swing: project.drums.on ? preset.swing : 0,
      swingSubdivision: preset.swingSubdivision,
      gainFor: (e) => {
        const lane = laneOf(e.track);
        const mix = mixerRef.current[lane];
        if (mix.muted || (soloRef.current && soloRef.current !== lane)) return 0;
        return mix.volume;
      },
      onNote: (e) => {
        if (e.track === 'drums') return;
        const key = e.cycle * 1000 + e.step;
        if (key === positionKey.current) return;
        positionKey.current = key;
        setPosition({ cycle: e.cycle, step: e.step });
      },
    });
  });

  // Rebuild and restart whenever anything but the mixer changes while playing.
  const generative = JSON.stringify({ ...project, mixer: null });
  useEffect(() => {
    if (playing) schedule();
  }, [generative, playing]);

  useEffect(() => stopPhrase, []);

  const stop = () => {
    stopPhrase();
    setPlaying(false);
    setPosition(null);
  };

  const share = async () => {
    const url = `${location.origin}${location.pathname}#/arrange?p=${encodeProject(project)}`;
    try {
      await navigator.clipboard.writeText(url);
      setNotice(COPY.copied);
    } catch {
      window.history.replaceState(null, '', url);
      setNotice(COPY.copyFailed);
    }
  };

  const setLane = <L extends Lane>(lane: L, patch: Partial<Project[L]>) =>
    setProject((p) => ({ ...p, [lane]: { ...p[lane], ...patch } }));
  const setMix = (lane: Lane, patch: Partial<Project['mixer'][Lane]>) =>
    setProject((p) => ({ ...p, mixer: { ...p.mixer, [lane]: { ...p.mixer[lane], ...patch } } }));

  const chooseMode = (mode: ModeId) =>
    setProject((p) => ({ ...p, mode, progression: reharmonize(p.progression, mode) }));

  const slotOptions = [...diatonicChords(tonic, project.mode), ...diatonicChords(tonic, project.mode, true)];

  const laneHeader = (lane: Lane) => (
    <header className={styles.laneHeader}>
      <label className={styles.laneTitle}>
        <input type="checkbox" checked={project[lane].on} onChange={(e) => setLane(lane, { on: e.target.checked })} />
        <span>{LANE_COPY[lane].icon}</span>
        <strong>{LANE_COPY[lane].name}</strong>
      </label>
      <button
        className={styles.small}
        aria-pressed={project.mixer[lane].muted}
        onClick={() => setMix(lane, { muted: !project.mixer[lane].muted })}
      >
        {COPY.mute}
      </button>
      <button className={styles.small} aria-pressed={solo === lane} onClick={() => setSolo(solo === lane ? null : lane)}>
        {COPY.solo}
      </button>
      <input
        className={styles.volume}
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={project.mixer[lane].volume}
        aria-label={`${LANE_COPY[lane].name} ${COPY.volume}`}
        onChange={(e) => setMix(lane, { volume: Number(e.target.value) })}
      />
    </header>
  );

  const instrumentSelect = (value: string, options: typeof MELODY_INSTRUMENTS, onChange: (v: Project['melody']['instrument']) => void) => (
    <select value={value} onChange={(e) => onChange(e.target.value as Project['melody']['instrument'])}>
      {options.map((id) => (
        <option key={id} value={id}>
          {INSTRUMENT_COPY[id].name}
        </option>
      ))}
    </select>
  );

  return (
    <>
      <h1>{COPY.title}</h1>
      <p className="muted">{COPY.intro}</p>
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      <section className={styles.templates} aria-label={COPY.templates}>
        {ARRANGE_TEMPLATES.map((t) => (
          <button key={t.id} className={styles.template} onClick={() => setProject(t.project)}>
            <strong>{t.name}</strong>
            <small>{t.blurb}</small>
          </button>
        ))}
      </section>

      <div className={styles.transport}>
        {playing ? (
          <button className="button" onClick={stop}>
            {COPY.stop}
          </button>
        ) : (
          <button className="button primary" onClick={() => setPlaying(true)}>
            {COPY.play}
          </button>
        )}
        <div className={styles.strip}>
          {project.progression.map((roman, i) => (
            <span key={i} data-active={position?.step === i}>
              {romanToChord(tonic, roman).symbol}
            </span>
          ))}
        </div>
        {position && <span className="muted">{COPY.position(position.cycle + 1, project.cycles)}</span>}
        <span className={styles.spacer} />
        <button className="button" onClick={share}>
          {COPY.share}
        </button>
        <button className="button" onClick={() => setProject(DEFAULT_PROJECT)}>
          {COPY.reset}
        </button>
      </div>

      <section className={`card ${styles.section}`}>
        <h2>{COPY.timeline}</h2>
        <Timeline
          song={song}
          playhead={position ? position.cycle * song.cycleLength + position.step * chordLength : null}
          chordLength={chordLength}
          audible={audible}
        />
        <p className={styles.help}>{COPY.timelineHelp}</p>
      </section>

      <section className={`card ${styles.section}`}>
        <h2>{COPY.song}</h2>
        <div className={styles.fields}>
          <label>
            {COPY.key}
            <select value={project.keyChroma} onChange={(e) => update({ keyChroma: Number(e.target.value) })}>
              {CHROMAS.map((c) => (
                <option key={c} value={c}>
                  {simplestRoot(c, project.mode)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {COPY.mode}
            <select value={project.mode} onChange={(e) => chooseMode(e.target.value as ModeId)}>
              {MODE_IDS.map((m) => (
                <option key={m} value={m}>
                  {MODE_COPY[m].name} · {MODE_COPY[m].zh}
                </option>
              ))}
            </select>
          </label>
          <label>
            {COPY.bpm} {project.bpm}
            <input type="range" min={50} max={170} value={project.bpm} onChange={(e) => update({ bpm: Number(e.target.value) })} />
          </label>
          <label>
            {COPY.beatsPerChord}
            <select value={project.beatsPerChord} onChange={(e) => update({ beatsPerChord: Number(e.target.value) as 2 | 4 })}>
              {[2, 4].map((n) => (
                <option key={n} value={n}>
                  {COPY.beats(n)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {COPY.cycles}
            <select value={project.cycles} onChange={(e) => update({ cycles: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {COPY.times(n)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className={styles.help}>{COPY.modeHelp}</p>

        <div className={styles.label}>{COPY.progression}</div>
        <div className={styles.slots}>
          {project.progression.map((roman, i) => (
            <select
              key={i}
              className={styles.slot}
              data-active={position?.step === i}
              value={roman}
              onChange={(e) => update({ progression: project.progression.map((r, j) => (j === i ? e.target.value : r)) })}
            >
              {!slotOptions.some((c) => c.roman === roman) && (
                <option value={roman}>
                  {displayRoman(roman)} · {romanToChord(tonic, roman).symbol}
                </option>
              )}
              {slotOptions.map((c) => (
                <option key={c.roman} value={c.roman}>
                  {displayRoman(c.roman)} · {c.symbol}
                </option>
              ))}
            </select>
          ))}
          <button
            className={styles.small}
            disabled={project.progression.length >= 8}
            onClick={() => update({ progression: [...project.progression, project.progression[0] ?? 'I'] })}
          >
            {COPY.addChord}
          </button>
          <button
            className={styles.small}
            disabled={project.progression.length <= 1}
            onClick={() => update({ progression: project.progression.slice(0, -1) })}
          >
            {COPY.removeChord}
          </button>
          <select
            value=""
            onChange={(e) => {
              const preset = PROGRESSIONS.find((p) => p.id === e.target.value);
              if (preset) update({ progression: preset.romans, beatsPerChord: preset.beatsPerChord === 2 ? 2 : 4 });
            }}
          >
            <option value="">{COPY.loadProgression}</option>
            {PROGRESSIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <p className={styles.help}>{COPY.progressionHelp}</p>
      </section>

      <h2>{COPY.tracks}</h2>
      <div className={styles.lanes}>
        <section className={`card ${styles.lane}`} data-lane="drums">
          {laneHeader('drums')}
          <p className={styles.help}>{LANE_COPY.drums.help}</p>
          <div className={styles.choices}>
            {DRUM_PRESETS.map((p) => (
              <button
                key={p.id}
                className="button"
                aria-pressed={project.drums.preset === p.id}
                onClick={() => setLane('drums', { preset: p.id, on: true })}
              >
                {p.name}
              </button>
            ))}
          </div>
        </section>

        <section className={`card ${styles.lane}`} data-lane="bass">
          {laneHeader('bass')}
          <div className={styles.choices}>
            {BASS_STYLES.map((s) => (
              <button
                key={s}
                className="button"
                aria-pressed={project.bass.style === s}
                onClick={() => setLane('bass', { style: s, on: true })}
              >
                {BASS_STYLE_COPY[s].name}
              </button>
            ))}
          </div>
          <p className={styles.help}>{BASS_STYLE_COPY[project.bass.style].help}</p>
        </section>

        <section className={`card ${styles.lane}`} data-lane="harmony">
          {laneHeader('harmony')}
          <div className={styles.inline}>
            {COPY.instrument}
            {instrumentSelect(project.harmony.instrument, HARMONY_INSTRUMENTS, (v) => setLane('harmony', { instrument: v }))}
          </div>
          <div className={styles.choices}>
            {PATTERN_IDS.map((id) => (
              <button
                key={id}
                className="button"
                aria-pressed={project.harmony.pattern === id}
                onClick={() => setLane('harmony', { pattern: id, on: true })}
              >
                {PATTERN_COPY[id].name}
              </button>
            ))}
          </div>
          {project.harmony.pattern === 'strum' && (
            <div className={styles.choices}>
              {STRUM_PATTERNS.map((p) => (
                <button
                  key={p.id}
                  className={styles.small}
                  aria-pressed={project.harmony.strum === p.id}
                  onClick={() => setLane('harmony', { strum: p.id })}
                >
                  {STRUM_PATTERN_COPY[p.id]?.name}
                </button>
              ))}
            </div>
          )}
          <p className={styles.help}>{PATTERN_COPY[project.harmony.pattern].help}</p>
        </section>

        <section className={`card ${styles.lane}`} data-lane="melody">
          {laneHeader('melody')}
          <div className={styles.inline}>
            {COPY.instrument}
            {instrumentSelect(project.melody.instrument, MELODY_INSTRUMENTS, (v) => setLane('melody', { instrument: v }))}
          </div>
          <div className={styles.choices}>
            {(['generated', 'canon'] as const).map((s) => (
              <button
                key={s}
                className="button"
                aria-pressed={project.melody.style === s}
                onClick={() => setLane('melody', { style: s, on: true })}
              >
                {MELODY_STYLE_COPY[s].name}
              </button>
            ))}
            <button className="button" onClick={() => setLane('melody', { seed: (project.melody.seed * 7 + 13) % 100000, on: true })}>
              {COPY.reroll}
            </button>
            <label className={styles.inline} title={COPY.doubleHelp}>
              <input
                type="checkbox"
                checked={project.melody.double}
                onChange={(e) => setLane('melody', { double: e.target.checked })}
              />
              {COPY.double}
            </label>
          </div>
          <p className={styles.help}>{MELODY_STYLE_COPY[project.melody.style].help}</p>
        </section>
      </div>

      <section className={`card ${styles.section}`}>
        <h2>{COPY.tricks}</h2>
        <div className={styles.tricks}>
          {(['build', 'fill', 'lift'] as const).map((trick) => (
            <label key={trick} className={styles.trick} data-on={project.tricks[trick]}>
              <input
                type="checkbox"
                checked={project.tricks[trick]}
                onChange={(e) => update({ tricks: { ...project.tricks, [trick]: e.target.checked } })}
              />
              <strong>{TRICK_COPY[trick].name}</strong>
              <small>{TRICK_COPY[trick].help}</small>
            </label>
          ))}
        </div>
      </section>
    </>
  );
}
