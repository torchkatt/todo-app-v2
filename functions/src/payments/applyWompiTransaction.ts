import * as admin from 'firebase-admin';
import { auditInTransaction } from '../lib/audit';
import { canTransition, mapWompiStatus } from '../domain/orderState';
import { TransactionStatus } from '../domain/types';
import type { WompiTransactionData } from './wompiClient';

export type ApplyOutcome =
  | { duplicate: true }
  | { orderNotFound: true }
  | { mismatch: true }
  | { skipped: true }
  | { applied: true; status: TransactionStatus };

/**
 * Aplica el estado de una transacción Wompi a la orden correspondiente de forma idempotente
 * y atómica. Usado tanto por el webhook de eventos como por la verificación server-to-server
 * de reconciliación (mismo camino de código, misma garantía de "una sola aplicación").
 */
export async function applyWompiTransaction(tx: WompiTransactionData): Promise<ApplyOutcome> {
  const db = admin.firestore();

  return db.runTransaction(async (t) => {
    const evtRef = db.collection('processed_events').doc(String(tx.id));
    const evtSnap = await t.get(evtRef);
    if (evtSnap.exists) return { duplicate: true };

    const orderRef = db.collection('transactions').doc(tx.reference);
    const orderSnap = await t.get(orderRef);
    if (!orderSnap.exists) {
      t.set(evtRef, { at: admin.firestore.FieldValue.serverTimestamp(), reason: 'order_not_found' });
      return { orderNotFound: true };
    }
    const order = orderSnap.data()!;

    if (tx.amount_in_cents !== order.payment?.amount) {
      t.update(orderRef, { status: TransactionStatus.DISPUTED, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      t.set(evtRef, { at: admin.firestore.FieldValue.serverTimestamp(), reason: 'amount_mismatch' });
      auditInTransaction(
        t,
        'payment.amount_mismatch',
        { reference: tx.reference, expected: order.payment?.amount, received: tx.amount_in_cents },
        { targetType: 'transaction', targetId: tx.reference }
      );
      return { mismatch: true };
    }

    const nextStatus = mapWompiStatus(tx.status);
    if (!nextStatus || !canTransition(order.status, nextStatus)) {
      t.set(evtRef, { at: admin.firestore.FieldValue.serverTimestamp(), skipped: true, wompiStatus: tx.status });
      return { skipped: true };
    }

    t.update(orderRef, {
      status: nextStatus,
      'payment.status': tx.status.toLowerCase(),
      'payment.wompiId': tx.id,
      'payment.method': tx.payment_method?.type ?? 'unknown',
      ...(nextStatus === TransactionStatus.PAYMENT_CONFIRMED
        ? { 'payment.approvedAt': admin.firestore.FieldValue.serverTimestamp() }
        : {}),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (nextStatus === TransactionStatus.PAYMENT_CONFIRMED) {
      t.update(db.collection('sellers').doc(order.sellerId), {
        'stats.totalRevenue': admin.firestore.FieldValue.increment(order.sellerEarnings ?? 0),
        'stats.totalTransactions': admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      t.update(db.collection('users').doc(order.buyerId), {
        'impact.totalTransactions': admin.firestore.FieldValue.increment(1),
        'impact.totalSpent': admin.firestore.FieldValue.increment(order.totalAmount ?? 0),
      });
      t.set(db.collection('notifications').doc(), {
        userId: order.buyerId,
        title: '✅ Pago confirmado',
        body: `Tu pago por $${((order.totalAmount ?? 0) / 100).toLocaleString('es-CO')} fue aprobado`,
        type: 'order_update',
        read: false,
        link: `/orders/${tx.reference}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    if (nextStatus === TransactionStatus.CANCELLED) {
      const lineItems: any[] = order.lineItems ?? [];
      for (const li of lineItems) {
        if (li.stockReserved === false) continue;
        t.update(db.collection('listings').doc(li.listingId), {
          quantity: admin.firestore.FieldValue.increment(li.quantity),
        });
      }
      t.set(db.collection('notifications').doc(), {
        userId: order.buyerId,
        title: '❌ Pago rechazado',
        body: 'Tu pago no pudo procesarse. Intenta de nuevo.',
        type: 'order_update',
        read: false,
        link: `/orders/${tx.reference}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    t.set(evtRef, { at: admin.firestore.FieldValue.serverTimestamp(), status: nextStatus });
    auditInTransaction(
      t,
      'payment.status_updated',
      { reference: tx.reference, from: order.status, to: nextStatus, wompiId: tx.id },
      { targetType: 'transaction', targetId: tx.reference }
    );

    return { applied: true, status: nextStatus };
  });
}
