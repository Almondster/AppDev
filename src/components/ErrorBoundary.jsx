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
      <main className="min-h-screen flex items-center justify-center p-6 bg-[#080808]">
        <div className="max-w-md w-full bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Something went wrong.</h1>
          <p className="text-zinc-400 mb-6">The page could not render, but the app is still running. Try reloading this view.</p>
          <button 
            type="button" 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors mx-auto"
          >
            <RotateCcw size={16} />
            Reload
          </button>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
