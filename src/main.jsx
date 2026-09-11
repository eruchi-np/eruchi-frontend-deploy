import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { attachCsrf, ensureCsrfToken, installCsrfFetch } from './utils/csrf';

attachCsrf(axios);
installCsrfFetch();
ensureCsrfToken().catch(() => {});

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)