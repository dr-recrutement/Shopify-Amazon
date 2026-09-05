import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import { LanguageProvider } from './lib/i18n';
import { initSentry } from './lib/sentry';
import './index.css';

initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Une erreur inattendue est survenue.</h1>
          <p style={{ color: '#6b7280', maxWidth: '28rem' }}>L'incident a été signalé automatiquement à notre équipe. Vous pouvez réessayer ou recharger la page.</p>
          <button
            onClick={resetError}
            style={{ padding: '0.625rem 1.5rem', background: '#3B5FE3', color: 'white', borderRadius: '9999px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            Réessayer
          </button>
        </div>
      )}
    >
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>
);
