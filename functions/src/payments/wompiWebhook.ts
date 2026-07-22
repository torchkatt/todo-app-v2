import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { WOMPI_PRIVATE_KEY, WOMPI_EVENTS_SECRET, WOMPI_INTEGRITY_SECRET, wompiConfigured } from '../config';
import { verifyEventChecksum } from './wompiSignature';
import { checkRateLimit } from '../lib/rateLimit';
import { audit } from '../lib/audit';
import { applyWompiTransaction } from './applyWompiTransaction';

const MAX_PAYLOAD_SIZE = 100_000; // 100KB

export const wompiWebhook = onRequest(
  { secrets: [WOMPI_PRIVATE_KEY, WOMPI_EVENTS_SECRET, WOMPI_INTEGRITY_SECRET], cors: false },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const raw = JSON.stringify(req.body ?? {});
    if (raw.length > MAX_PAYLOAD_SIZE) {
      res.status(413).send('Payload too large');
      return;
    }

    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    if (!(await checkRateLimit(ip, 'wompi_webhook'))) {
      res.status(429).send('Too many requests');
      return;
    }

    if (!wompiConfigured()) {
      // Nada se marca como pagado mientras las credenciales de Wompi sigan pendientes.
      res.status(503).send('Payments not configured');
      return;
    }

    const event = req.body;
    if (!event?.data?.transaction) {
      res.status(400).send('Invalid payload');
      return;
    }

    if (!verifyEventChecksum(event, WOMPI_EVENTS_SECRET.value())) {
      await audit('payment.invalid_signature', { ip, reference: event?.data?.transaction?.reference });
      logger.warn('wompiWebhook: invalid signature', { ip });
      res.status(401).send('Invalid signature');
      return;
    }

    try {
      const outcome = await applyWompiTransaction(event.data.transaction);
      res.status(200).send({ received: true, ...outcome });
    } catch (e) {
      logger.error('wompiWebhook: error processing event', e);
      res.status(500).send('Error processing webhook');
    }
  }
);
