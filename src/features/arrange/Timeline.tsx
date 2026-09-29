import { Note } from 'tonal';
import { LANE_COPY } from '../../content/arrange';
import { DRUM_PIECES, type DrumPiece } from '../../theory/drums';
import { parseSixteenths } from '../../theory/events';
import type { Song } from '../../theory/song';
import { LANES, laneOf, type Lane } from './project';
import styles from './Timeline.module.css';

const LANE_HEIGHT = 36;
const LANE_GAP = 6;

interface Props {
  song: Song;
  /** Sixteenth where the currently playing chord starts. */
  playhead: number | null;
  chordLength: number;
  audible: (lane: Lane) => boolean;
}

/** A mini piano roll of the whole song: one row per lane, cycles marked. */
export function Timeline({ song, playhead, chordLength, audible }: Props) {
  const pitchRange = new Map<Lane, [number, number]>();
  for (const e of song.events) {
    const lane = laneOf(e.track);
    if (lane === 'drums') continue;
    const m = Note.midi(e.note) ?? 60;
    const [lo, hi] = pitchRange.get(lane) ?? [m, m];
    pitchRange.set(lane, [Math.min(lo, m), Math.max(hi, m)]);
  }

  const yFor = (lane: Lane, note: string) => {
    const top = LANES.indexOf(lane) * (LANE_HEIGHT + LANE_GAP);
    if (lane === 'drums') {
      const i = DRUM_PIECES.indexOf(note as DrumPiece);
      return top + (i / (DRUM_PIECES.length - 1)) * (LANE_HEIGHT - 3);
    }
    const [lo, hi] = pitchRange.get(lane) ?? [0, 1];
    const m = Note.midi(note) ?? lo;
    return top + (1 - (m - lo) / Math.max(1, hi - lo)) * (LANE_HEIGHT - 3);
  };

  const height = LANES.length * (LANE_HEIGHT + LANE_GAP);
  const cycles = Math.round(song.length / song.cycleLength);

  return (
    <div className={styles.wrap}>
      <div className={styles.labels}>
        {LANES.map((lane) => (
          <span key={lane} style={{ height: LANE_HEIGHT, marginBottom: LANE_GAP }} data-muted={!audible(lane)}>
            {LANE_COPY[lane].icon} {LANE_COPY[lane].name}
          </span>
        ))}
      </div>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${song.length} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="整首歌的轨道一览"
      >
        {Array.from({ length: cycles }, (_, c) => (
          <rect
            key={c}
            x={c * song.cycleLength}
            y={0}
            width={song.cycleLength}
            height={height}
            className={c % 2 ? styles.cycleOdd : styles.cycleEven}
          />
        ))}
        {playhead !== null && (
          <rect x={playhead} y={0} width={chordLength} height={height} className={styles.playhead} />
        )}
        {song.events.map((e, i) => {
          const lane = laneOf(e.track);
          const x = parseSixteenths(e.time);
          const w = lane === 'drums' ? 0.6 : Math.max(0.6, parseSixteenths(e.duration) - 0.15);
          return (
            <rect
              key={i}
              x={x}
              y={yFor(lane, e.note)}
              width={w}
              height={3}
              className={styles[lane]}
              data-counter={e.track === 'counter'}
              data-muted={!audible(lane)}
            />
          );
        })}
      </svg>
    </div>
  );
}
