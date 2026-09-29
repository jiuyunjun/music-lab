import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ensureAudioStarted, isAudioRunning, onAudioStarted, setMasterVolume } from '../../audio/engine';
import { APP_COPY } from '../../content/ui';
import { useAppStore } from '../../store';
import styles from './Layout.module.css';

const NAV = [
  { to: '/', label: APP_COPY.nav.home, end: true },
  { to: '/play', label: APP_COPY.nav.play },
  { to: '/scales', label: APP_COPY.nav.scales },
  { to: '/chords', label: APP_COPY.nav.chords },
  { to: '/arrange', label: APP_COPY.nav.arrange },
];

export function Layout() {
  const volumeDb = useAppStore((s) => s.volumeDb);
  const setVolumeDb = useAppStore((s) => s.setVolumeDb);
  const [audioOn, setAudioOn] = useState(isAudioRunning);

  useEffect(() => onAudioStarted(() => setAudioOn(true)), []);

  // Any first gesture anywhere unlocks audio.
  useEffect(() => {
    if (audioOn) return;
    const unlock = () => void ensureAudioStarted();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [audioOn]);

  useEffect(() => setMasterVolume(volumeDb), [volumeDb]);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <NavLink to="/" className={styles.brand}>
          <span>{APP_COPY.brand}</span>
          <small>{APP_COPY.brandSub}</small>
        </NavLink>
        <nav className={styles.nav}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? `${styles.link} ${styles.activeLink}` : styles.link)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <label className={styles.volume}>
          <span>{APP_COPY.volume}</span>
          <input
            type="range"
            min={-40}
            max={0}
            step={1}
            value={volumeDb}
            onChange={(e) => setVolumeDb(Number(e.target.value))}
          />
        </label>
      </header>

      {!audioOn && <div className={styles.gate}>{APP_COPY.audioGate}</div>}

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>{APP_COPY.footer}</footer>
    </div>
  );
}
