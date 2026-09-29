import { NavLink } from 'react-router-dom';
import { INSTRUMENT_TABS } from '../../content/guitar';
import styles from './InstrumentTabs.module.css';

export function InstrumentTabs() {
  return (
    <nav className={styles.tabs}>
      {INSTRUMENT_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => (isActive ? `${styles.tab} ${styles.active}` : styles.tab)}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
