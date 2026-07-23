import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { WOMPI_PRIVATE_KEY, WOMPI_EVENTS_SECRET, WOMPI_INTEGRITY_SECRET, SENTRY_DSN, wompiConfigured } from '../config';
import { verifyEventChecksum } from './wompiSignature';
import { checkRateLimit } from '../lib/rateLimit';
import { audit } from '../lib/audit';
import { auditInTransaction } from '../lib/audit';
import { applyWompiTransaction } from './applyWompiTransaction';
import { captureError } from '../lib/sentry';
import { sendPushToUser } from '../lib/push';

const MAX_PAYLOAD_SIZE = 100_000; // 100KB

export const wompiWebhook = onRequest(
  { secrets: [WOMPI_PRIVATE_KEY, WOMPI_EVENTS_SECRET, WOMPI_INTEGRITY_SECRET, SENTRY_DSN], cors: false },
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
      const tx = event.data.transaction;

      // ── Wallet Top-Up ──
      if (tx.reference?.startsWith('topup_')) {
        const outcome = await handleWalletTopUp(tx);
        res.status(200).send({ received: true, ...outcome });
        return;
      }

      const outcome = await applyWompiTransaction(tx);
      if ('applied' in outcome && outcome.push) {
        await sendPushToUser(outcome.buyerId, outcome.push, { link: `/orders/${tx.reference}` });
      }
      res.status(200).send({ received: true, ...outcome });
    } catch (e) {
      logger.error('wompiWebhook: error processing event', e);
      captureError(e, { reference: event?.data?.transaction?.reference });
      res.status(500).send('Error processing webhook');
    }
  }
);

// ─── Wallet Top-Up Handler ───────────────────────────────────────────────────

interface WompiTx {
  id: string;
  reference: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';
  amount_in_cents: number;
  currency: string;
}

type TopUpOutcome =
  | { duplicate: true }
  | { invalidReference: true }
  | { skipped: true; reason: string }
  | { applied: true; balance: number; userId: string };

/**
 * Procesa una transacción Wompi cuyo `reference` empieza con "topup_".
 *
 * Formato del reference: topup_{userId}_{timestamp}
 * Solo se aplica si el estado de Wompi es APPROVED.
 * Idempotente vía `processed_events` (mismo patrón que applyWompiTransaction).
 */
async function handleWalletTopUp(tx: WompiTx): Promise<TopUpOutcome> {
  const db = admin.firestore();

  // ── Parsear el reference ──
  // Formato: topup_{userId}_{timestamp}
  if (!tx.reference?.startsWith('topup_')) {
    return { invalidReference: true };
  }

  const parts = tx.reference.split('_');
  // parts[0] = 'topup', parts[1..n-1] = userId, parts[n-1] = timestamp
  if (parts.length < 3) {
    return { invalidReference: true };
  }

  const timestamp = parts[parts.length - 1];
  const userId = parts.slice(1, -1).join('_');

  if (!userId || !timestamp) {
    return { invalidReference: true };
  }

  // ── Solo procesar transacciones aprobadas ──
  if (tx.status !== 'APPROVED') {
    logger.info('handleWalletTopUp: skipping non-APPROVED status', {
      reference: tx.reference,
      status: tx.status,
    });
    return { skipped: true, reason: `status is ${tx.status}, not APPROVED` };
  }

  return db.runTransaction(async (t) => {
    // ── Idempotencia: processed_events ──
    const evtRef = db.collection('processed_events').doc(String(tx.id));
    const evtSnap = await t.get(evtRef);
    if (evtSnap.exists) {
      return { duplicate: true };
    }

    // ── Leer wallet actual ──
    const walletRef = db.collection('wallets').doc(userId);
    const walletSnap = await t.get(walletRef);
    const currentBalance = walletSnap.exists ? (walletSnap.data()?.balance ?? 0) : 0;
    const newBalance = currentBalance + tx.amount_in_cents;

    // ── Actualizar wallet ──
    t.set(walletRef, {
      id: userId,
      balance: newBalance,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // ── Crear wallet_transaction ──
    const walletTxRef = db.collection('wallet_transactions').doc(tx.reference);
    t.set(walletTxRef, {
      userId,
      type: 'topup',
      amount: tx.amount_in_cents,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      description: `Recarga de wallet — Wompi`,
      referenceType: 'wompi_topup',
      referenceId: tx.reference,
      wompiId: tx.id,
      status: 'completed',
      appliedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // ── Marcar evento como procesado ──
    t.set(evtRef, {
      at: admin.firestore.FieldValue.serverTimestamp(),
      type: 'wallet_topup',
      userId,
      amountInCents: tx.amount_in_cents,
    });

    auditInTransaction(
      t,
      'wallet.topup_completed',
      {
        userId,
        reference: tx.reference,
        wompiId: tx.id,
        amountInCents: tx.amount_in_cents,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
      },
      { performedBy: userId, targetType: 'wallet', targetId: userId },
    );

    return { applied: true, balance: newBalance, userId };
  });
}
