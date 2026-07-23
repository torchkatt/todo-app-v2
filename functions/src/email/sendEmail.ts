import * as nodemailer from 'nodemailer';
import { logger } from 'firebase-functions/v2';
import {
  EMAIL_SMTP_HOST,
  EMAIL_SMTP_PORT,
  EMAIL_SMTP_USER,
  EMAIL_SMTP_PASS,
  EMAIL_FROM,
} from '../config';

/**
 * Crea un transporter SMTP reutilizable. Se construye lazy para que los secretos
 * se lean en tiempo de ejecución (no en cold-start, donde podrían no estar listos).
 */
function createTransport(): nodemailer.Transporter {
  const host = EMAIL_SMTP_HOST.value();
  const port = parseInt(EMAIL_SMTP_PORT.value() || '587', 10);
  const user = EMAIL_SMTP_USER.value();
  const pass = EMAIL_SMTP_PASS.value();

  if (!host || !user || !pass) {
    throw new Error('Email SMTP secrets are not configured');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Envía un correo electrónico. Lanza en caso de error; el caller decide si
 * captura y degrada o propaga.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const from = EMAIL_FROM.value() || EMAIL_SMTP_USER.value() || 'noreply@todomarketplace.app';

  try {
    const transport = createTransport();
    await transport.sendMail({ from, to, subject, html });
    logger.info('Email sent', { to, subject });
  } catch (err) {
    logger.error('Email send failed', err);
    throw err;
  }
}
