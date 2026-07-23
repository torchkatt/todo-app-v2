import { defineSecret, defineInt, defineBoolean, defineString } from 'firebase-functions/params';

// ─── Secretos (Secret Manager en prod; functions/.env en emulador) ───
export const WOMPI_PRIVATE_KEY = defineSecret('WOMPI_PRIVATE_KEY');
export const WOMPI_EVENTS_SECRET = defineSecret('WOMPI_EVENTS_SECRET');
export const WOMPI_INTEGRITY_SECRET = defineSecret('WOMPI_INTEGRITY_SECRET');
export const DEEPSEEK_API_KEY = defineSecret('DEEPSEEK_API_KEY');
export const SENTRY_DSN = defineSecret('SENTRY_DSN');
export const EMAIL_SMTP_HOST = defineSecret('EMAIL_SMTP_HOST');
export const EMAIL_SMTP_PORT = defineSecret('EMAIL_SMTP_PORT');
export const EMAIL_SMTP_USER = defineSecret('EMAIL_SMTP_USER');
export const EMAIL_SMTP_PASS = defineSecret('EMAIL_SMTP_PASS');
export const EMAIL_FROM = defineSecret('EMAIL_FROM');

// ─── Parámetros de negocio ───
export const DEEPSEEK_MODEL = defineString('DEEPSEEK_MODEL', { default: 'deepseek-v4-flash' });
export const PLATFORM_FEE_BPS = defineInt('PLATFORM_FEE_BPS', { default: 500 }); // 5%
export const IVA_BPS = defineInt('IVA_BPS', { default: 1900 }); // 19%
export const EMAIL_ENABLED = defineBoolean('EMAIL_ENABLED', { default: false });

const PENDING_VALUES = new Set(['', 'PENDIENTE', 'prv_test_PENDIENTE', undefined]);

/** true solo si las 3 credenciales de Wompi tienen un valor real (no placeholder). */
export function wompiConfigured(): boolean {
  return (
    !PENDING_VALUES.has(WOMPI_PRIVATE_KEY.value()) &&
    !PENDING_VALUES.has(WOMPI_EVENTS_SECRET.value()) &&
    !PENDING_VALUES.has(WOMPI_INTEGRITY_SECRET.value())
  );
}

export function deepseekConfigured(): boolean {
  return !PENDING_VALUES.has(DEEPSEEK_API_KEY.value());
}

export function wompiUrls() {
  const prod = process.env.WOMPI_ENV === 'prod';
  return {
    api: prod ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1',
  };
}
