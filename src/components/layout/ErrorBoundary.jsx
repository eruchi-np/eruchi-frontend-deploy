import React from 'react';
import { useLocation } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-medium text-neutral-900 mb-3">Something went wrong</h1>
          <p className="text-neutral-600 mb-8">
            The page hit an unexpected error. You can reload or go back home.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full px-6 py-3 text-sm font-medium text-white"
              style={{ backgroundColor: '#134074' }}
            >
              Reload
            </button>
            <a
              href="/"
              className="rounded-full px-6 py-3 text-sm font-medium border border-neutral-200 text-neutral-800"
            >
              Home
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

export function RouteErrorBoundary({ children }) {
  const { pathname } = useLocation();
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>;
}
