// Simple console logger wrapper — production will use Sentry
const noop = (..._args: any[]) => {};

export const logger = {
  log: (...args: any[]) => (import.meta.env.DEV ? console.log('[TODO]', ...args) : noop),
  warn: (...args: any[]) => (import.meta.env.DEV ? console.warn('[TODO]', ...args) : noop),
  error: (...args: any[]) => console.error('[TODO]', ...args),
};
