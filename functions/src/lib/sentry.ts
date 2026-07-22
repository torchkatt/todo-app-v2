import * as Sentry from '@sentry/node';
import { SENTRY_DSN } from '../config';

let initialized = false;

function ensureInit(): void {
  if (initialized) return;
  initialized = true;
  const dsn = SENTRY_DSN.value();
  if (!dsn) return; // Sin DSN, captureException queda como no-op — no rompe nada.
  Sentry.init({
    dsn,
    environment: process.env.FUNCTIONS_EMULATOR ? 'development' : 'production',
    tracesSampleRate: 0.1,
  });
}

/**
 * Reporta un error a Sentry (si SENTRY_DSN está configurado). No reemplaza el
 * logger.error existente — se usa junto a él en los handlers críticos (pagos, IA).
 */
export function captureError(e: unknown, context?: Record<string, unknown>): void {
  ensureInit();
  Sentry.captureException(e, context ? { extra: context } : undefined);
}
