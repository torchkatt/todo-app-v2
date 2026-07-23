import * as admin from 'firebase-admin';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { TransactionStatus } from '../domain/types';

// ─── Cashback rates by seller subscription tier (basis points) ───
const CASHBACK_RATES: Record<string, number> = {
  free: 300,                // 3%
  seller_pass_monthly: 500, // 5%
  seller_pass_annual: 700,  // 7%
};

const DEFAULT_RATE_BPS = 300;
const MAX_CASHBACK = 50_000; // COP
const EXPIRATION_DAYS = 90;

/**
 * Genera cashback cuando una transacción pasa de PENDING_PAYMENT a PAYMENT_CONFIRMED.
 *
 * El porcentaje de cashback depende del plan de suscripción del vendedor:
 *   - free: 3% (300 bps)
 *   - seller_pass_monthly: 5% (500 bps)
 *   - seller_pass_annual: 7% (700 bps)
 *
 * El cashback se registra en `cashback_records` con vencimiento a 90 días y se
 * acumula en `wallets/{buyerId}` como pendingCashback.
 */
export const onTransactionComplete = onDocumentUpdated(
  'transactions/{transactionId}',
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    const transactionId = event.params.transactionId;

    // Solo actuar si la transición es PENDING_PAYMENT → PAYMENT_CONFIRMED
    if (
      !beforeData ||
      !afterData ||
      beforeData.status !== TransactionStatus.PENDING_PAYMENT ||
      afterData.status !== TransactionStatus.PAYMENT_CONFIRMED
    ) {
      logger.debug('onTransactionComplete: skip — not a PENDING_PAYMENT → PAYMENT_CONFIRMED transition', {
        transactionId,
        before: beforeData?.status,
        after: afterData?.status,
      });
      return;
    }

    const db = admin.firestore();
    const buyerId: string | undefined = afterData.buyerId;
    const sellerId: string | undefined = afterData.sellerId;
    const totalAmount: number | undefined = afterData.totalAmount;

    if (!buyerId || !sellerId || totalAmount == null) {
      logger.error('onTransactionComplete: missing required transaction fields', {
        transactionId,
        buyerId: !!buyerId,
        sellerId: !!sellerId,
        totalAmount: totalAmount != null,
      });
      return;
    }

    try {
      // Determinar tasa de cashback según el plan del vendedor
      const subSnap = await db.collection('seller_subscriptions').doc(sellerId).get();
      const planId: string = subSnap.exists ? subSnap.data()?.planId : 'free';
      const rateBps = CASHBACK_RATES[planId] ?? DEFAULT_RATE_BPS;

      // Calcular cashback (totalAmount ya está en pesos COP)
      const cashback = Math.min(
        Math.round((totalAmount * rateBps) / 10000),
        MAX_CASHBACK,
      );

      // Fecha de expiración: 90 días desde ahora
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + EXPIRATION_DAYS);

      // Crear registro de cashback
      const cashbackRef = db.collection('cashback_records').doc();
      await cashbackRef.set({
        id: cashbackRef.id,
        userId: buyerId,
        transactionId,
        amount: cashback,
        rateBps,
        status: 'AVAILABLE',
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString(),
      });

      // Actualizar wallet del comprador
      await db.collection('wallets').doc(buyerId).set(
        {
          id: buyerId,
          pendingCashback: admin.firestore.FieldValue.increment(cashback),
          lifetimeCashback: admin.firestore.FieldValue.increment(cashback),
          updatedAt: now.toISOString(),
        },
        { merge: true },
      );

      logger.info('onTransactionComplete: cashback generated', {
        transactionId,
        buyerId,
        sellerId,
        planId,
        rateBps,
        cashback,
        totalAmount,
        cashbackRecordId: cashbackRef.id,
      });
    } catch (e) {
      logger.error('onTransactionComplete: failed to generate cashback', e);
    }
  },
);
