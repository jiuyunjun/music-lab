import { Link } from 'react-router-dom';
import { PianoKeyboard } from '../../components/PianoKeyboard';
import { useComputerKeyboard } from '../../components/useComputerKeyboard';
import { useInstrument } from '../../components/useInstrument';
import { APP_COPY, HOME_COPY } from '../../content/ui';
import { useAppStore } from '../../store';
import styles from './HomePage.module.css';

export function HomePage() {
  const instrumentId = useAppStore((s) => s.instrument);
  const octave = useAppStore((s) => s.octave);
  const setOctave = useAppStore((s) => s.setOctave);
  const { noteOn, noteOff } = useInstrument(instrumentId);
  const held = useComputerKeyboard({ octave, onNoteOn: noteOn, onNoteOff: noteOff, onOctaveChange: setOctave });

  return (
    <>
      <section className={styles.hero}>
        <h1>{HOME_COPY.heroTitle}</h1>
        <p className="muted">{HOME_COPY.heroBody}</p>
      </section>

      <PianoKeyboard low="C3" high="C6" activeNotes={held} onNoteOn={noteOn} onNoteOff={noteOff} />

      <section className={styles.cards}>
        {HOME_COPY.cards.map((card) => (
          <Link key={card.to} to={card.to} className={`card ${styles.cardLink}`}>
            <h3>
              {card.title}
              {!card.ready && <span className={styles.soon}>{APP_COPY.comingSoon}</span>}
            </h3>
            <p className="muted">{card.body}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
