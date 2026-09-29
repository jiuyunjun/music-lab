import { Component, type ReactNode } from 'react';
import { APP_COPY } from '../../content/ui';

interface Props {
  children: ReactNode;
  /** Changing this (e.g. the route) clears the error. */
  resetKey: string;
}

interface State {
  error: Error | null;
  resetKey: string;
}

/** Keeps one broken page from blanking the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="card">
        <h2>{APP_COPY.errorTitle}</h2>
        <p className="muted">{APP_COPY.errorBody}</p>
        <pre className="muted" style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
          {this.state.error.message}
        </pre>
        <button className="button primary" onClick={() => this.setState({ error: null })}>
          {APP_COPY.errorRetry}
        </button>
      </div>
    );
  }
}
