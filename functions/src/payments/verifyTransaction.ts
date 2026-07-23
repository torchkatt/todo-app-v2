import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { WOMPI_PRIVATE_KEY, WOMPI_EVENTS_SECRET, WOMPI_INTEGRITY_SECRET, wompiConfigured } from '../config';
import { fetchWompiTransaction } from './wompiClient';
import { applyWompiTransaction } from './applyWompiTransaction';
import { sendPushToUser } from '../lib/push';

/**
 * Reconciliación / fallback: si el webhook no llegó, el frontend puede pedir que se
 * consulte directamente a Wompi el estado real de una transacción y se re-aplique
 * (idempotente) el mismo camino de código del webhook.
 */
export const verifyTransaction = onCall(
  { cors: true, secrets: [WOMPI_PRIVATE_KEY, WOMPI_EVENTS_SECRET, WOMPI_INTEGRITY_SECRET] },
  async (request) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');

    const { reference } = request.data as { reference?: string };
    if (!reference) throw new HttpsError('invalid-argument', 'Falta la referencia de la orden.');

    if (!wompiConfigured()) {
      return { paymentReady: false as const, status: null };
    }

    const orderSnap = await admin.firestore().collection('transactions').doc(reference).get();
    if (!orderSnap.exists) throw new HttpsError('not-found', 'Orden no encontrada.');
    const order = orderSnap.data()!;
    if (order.buyerId !== auth.uid) {
      // order.sellerId es el ID del documento en `sellers`, no el uid del dueño —
      // hay que resolver ownerId antes de comparar (mismo patrón que isSellerOwner()
      // en firestore.rules).
      const sellerSnap = await admin.firestore().collection('sellers').doc(order.sellerId).get();
      if (sellerSnap.data()?.ownerId !== auth.uid) {
        throw new HttpsError('permission-denied', 'No tienes acceso a esta orden.');
      }
    }

    const wompiTxId = order.payment?.wompiId;
    if (!wompiTxId) {
      return { paymentReady: true as const, status: order.status, checked: false };
    }

    const wompiTx = await fetchWompiTransaction(wompiTxId, WOMPI_PRIVATE_KEY.value());
    if (!wompiTx) {
      return { paymentReady: true as const, status: order.status, checked: false };
    }

    const outcome = await applyWompiTransaction(wompiTx);
    if ('applied' in outcome && outcome.push) {
      await sendPushToUser(outcome.buyerId, outcome.push, { link: `/orders/${reference}` });
    }
    const refreshed = await admin.firestore().collection('transactions').doc(reference).get();
    return { paymentReady: true as const, status: refreshed.data()?.status ?? order.status, checked: true, outcome };
  }
);
