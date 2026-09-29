import { Link } from 'react-router-dom';
import { APP_COPY } from '../../content/ui';

export function ComingSoon() {
  return (
    <div className="card">
      <h2>{APP_COPY.comingSoon} 🚧</h2>
      <p className="muted">{APP_COPY.comingSoonBody}</p>
      <div className="row">
        <Link className="button primary" to="/play">
          {APP_COPY.nav.play}
        </Link>
        <Link className="button" to="/scales">
          {APP_COPY.nav.scales}
        </Link>
      </div>
    </div>
  );
}
