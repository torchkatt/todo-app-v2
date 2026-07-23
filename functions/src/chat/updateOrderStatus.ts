import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { canTransition } from '../domain/orderState';
import { TransactionStatus } from '../domain/types';
import { sendPushToUser } from '../lib/push';

interface UpdateOrderStatusRequest {
  transactionId: string;
  status: TransactionStatus;
}

// Allow-list fija por rol: nunca cancelación/reembolso/disputa vía esta función,
// solo avance del flujo normal de cumplimiento (fuera de eso, se maneja a mano).
const SELLER_TARGETS = new Set<TransactionStatus>([
  TransactionStatus.PREPARING,
  TransactionStatus.READY,
  TransactionStatus.IN_TRANSIT,
  TransactionStatus.DELIVERED,
]);
const COURIER_TARGETS = new Set<TransactionStatus>([
  TransactionStatus.IN_TRANSIT,
  TransactionStatus.DELIVERED,
]);

export const updateOrderStatus = onCall({ cors: true }, async (request) => {
  const auth = request.auth;
  if (!auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');

  const { transactionId, status } = (request.data || {}) as UpdateOrderStatusRequest;
  if (!transactionId || !status) throw new HttpsError('invalid-argument', 'Falta transactionId o status.');

  const db = admin.firestore();
  const txRef = db.collection('transactions').doc(transactionId);
  const txSnap = await txRef.get();
  if (!txSnap.exists) throw new HttpsError('not-found', 'Pedido no encontrado.');
  const tx = txSnap.data()!;

  let allowedTargets: Set<TransactionStatus> | null = null;
  if (tx.courierId === auth.uid) {
    allowedTargets = COURIER_TARGETS;
  } else if (tx.sellerId) {
    const sellerSnap = await db.collection('sellers').doc(tx.sellerId).get();
    if (sellerSnap.exists && sellerSnap.data()!.ownerId === auth.uid) {
      allowedTargets = SELLER_TARGETS;
    }
  }
  if (!allowedTargets) throw new HttpsError('permission-denied', 'No tienes permiso sobre este pedido.');
  if (!allowedTargets.has(status)) throw new HttpsError('permission-denied', 'No puedes fijar ese estado.');
  if (!canTransition(tx.status, status)) {
    throw new HttpsError('failed-precondition', `No se puede pasar de ${tx.status} a ${status}.`);
  }

  await txRef.update({ status, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

  if (tx.buyerId) {
    const title = '📦 Actualización de tu pedido';
    const body = `Tu pedido #${transactionId.slice(-8)} ahora está: ${status}`;
    await db.collection('notifications').add({
      userId: tx.buyerId,
      title,
      body,
      type: 'order_update',
      read: false,
      link: `/orders/${transactionId}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await sendPushToUser(tx.buyerId, { title, body }, { link: `/orders/${transactionId}` });
  }

  return { ok: true, status };
});
