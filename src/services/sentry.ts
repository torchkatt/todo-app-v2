import * as Sentry from '@sentry/react';

// Sentry no filtra correos/teléfonos/direcciones en breadcrumbs ni en el evento del
// usuario — solo el id. Sin VITE_SENTRY_DSN, no se inicializa (captureException en
// ErrorBoundary queda como no-op, sin romper nada).
const PII_KEYS = ['email', 'phone', 'address', 'fullName', 'shippingAddress'];

function scrubPII(obj: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!obj) return obj;
  const clean = { ...obj };
  for (const key of PII_KEYS) delete clean[key];
  return clean;
}

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || !import.meta.env.PROD) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.user) event.user = { id: event.user.id };
      event.breadcrumbs = event.breadcrumbs?.map((b) => ({ ...b, data: scrubPII(b.data) }));
      if (event.request) delete event.request.cookies;
      return event;
    },
  });
}
