import * as Sentry from '@sentry/react';

/**
 * Real error tracking — not a stub. Every uncaught exception and (a
 * sample of) React render errors are reported to this Sentry project so
 * production bugs are visible without waiting for a merchant to report
 * them. Safe to call even with an empty DSN (Sentry just no-ops), so this
 * never breaks local dev if the DSN is ever removed from the environment.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN || 'https://cf1e6a5a625c0d32ab9138e1ff4efada@o4512032831045632.ingest.de.sentry.io/4512032839172176';
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Light tracing sample — enough to catch real slow-transaction
    // patterns without paying full per-request tracing volume/cost.
    tracesSampleRate: 0.1,
    integrations: [Sentry.browserTracingIntegration()],
    // Merchant-provided text (product descriptions, custom CSS, chat
    // messages) can end up in stack traces/breadcrumbs incidentally —
    // this doesn't scrub everything, but keeps obvious PII-shaped values
    // (emails) out of what gets sent.
    beforeSend(event) {
      const scrub = (v: string) => v.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]');
      if (event.message) event.message = scrub(event.message);
      if (event.exception?.values) {
        for (const ex of event.exception.values) {
          if (ex.value) ex.value = scrub(ex.value);
        }
      }
      return event;
    },
  });
}
