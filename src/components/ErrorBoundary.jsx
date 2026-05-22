import React from 'react';
import { RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('UI render failed:', error, info);
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="route-error">
        <div className="route-error__panel">
          <h1>Something went wrong.</h1>
          <p>The page could not render, but the app is still running. Try reloading this view.</p>
          <button type="button" onClick={() => window.location.reload()}>
            <RotateCcw size={16} />
            Reload
          </button>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
