import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { EMAIL_ENABLED } from '../config';
import { sendPushToUser } from '../lib/push';

/** Notifica al vendedor de un pedido nuevo. El envío de email real queda detrás de EMAIL_ENABLED
 * (sin proveedor configurado hoy); mientras tanto degrada a solo notificación in-app, sin
 * fingir que se envió un correo. */
export const onTransactionCreate = onDocumentCreated('transactions/{txId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const db = admin.firestore();
  const txId = event.params.txId;

  const buyerTitle = '🛒 Pedido creado';
  const buyerBody = `Tu pedido #${txId.slice(-8)} está pendiente de pago`;
  await db.collection('notifications').add({
    userId: data.buyerId,
    targetRole: 'CUSTOMER',
    title: buyerTitle,
    body: buyerBody,
    type: 'order_update',
    read: false,
    link: `/orders/${txId}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await sendPushToUser(data.buyerId, { title: buyerTitle, body: buyerBody }, { link: `/orders/${txId}` });

  try {
    const [buyerDoc, sellerDoc] = await Promise.all([
      db.collection('users').doc(data.buyerId).get(),
      db.collection('sellers').doc(data.sellerId).get(),
    ]);
    const buyer = buyerDoc.data();
    // data.sellerId es el ID del documento en `sellers`, no el uid del dueño —
    // hay que notificar a sellers/{sellerId}.ownerId (mismo patrón que isSellerOwner()
    // en firestore.rules).
    const sellerOwnerId = sellerDoc.data()?.ownerId;

    if (sellerOwnerId) {
      const sellerTitle = '🛍️ Nuevo pedido recibido';
      const sellerBody = `Has recibido un pedido de ${buyer?.fullName || 'un cliente'} por $${((data.totalAmount || 0) / 100).toLocaleString('es-CO')}`;
      await db.collection('notifications').add({
        userId: sellerOwnerId,
        targetRole: 'SELLER',
        title: sellerTitle,
        body: sellerBody,
        type: 'order_update',
        read: false,
        link: `/orders/${txId}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await sendPushToUser(sellerOwnerId, { title: sellerTitle, body: sellerBody }, { link: `/orders/${txId}` });
    } else {
      logger.error('onTransactionCreate: seller doc without ownerId', { txId, sellerId: data.sellerId });
    }

    if (EMAIL_ENABLED.value()) {
      // TODO: integrar proveedor real (SendGrid/Mailgun) cuando EMAIL_ENABLED=true.
      logger.info('onTransactionCreate: email delivery requested but no provider wired yet', { txId });
    }
  } catch (e) {
    logger.error('onTransactionCreate: failed to notify seller', e);
  }
});
