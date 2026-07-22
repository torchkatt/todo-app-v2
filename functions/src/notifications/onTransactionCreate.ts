import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { EMAIL_ENABLED } from '../config';

/** Notifica al vendedor de un pedido nuevo. El envío de email real queda detrás de EMAIL_ENABLED
 * (sin proveedor configurado hoy); mientras tanto degrada a solo notificación in-app, sin
 * fingir que se envió un correo. */
export const onTransactionCreate = onDocumentCreated('transactions/{txId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const db = admin.firestore();
  const txId = event.params.txId;

  await db.collection('notifications').add({
    userId: data.buyerId,
    title: '🛒 Pedido creado',
    body: `Tu pedido #${txId.slice(-8)} está pendiente de pago`,
    type: 'order_update',
    read: false,
    link: `/orders/${txId}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  try {
    const buyerDoc = await db.collection('users').doc(data.buyerId).get();
    const buyer = buyerDoc.data();

    await db.collection('notifications').add({
      userId: data.sellerId,
      title: '🛍️ Nuevo pedido recibido',
      body: `Has recibido un pedido de ${buyer?.fullName || 'un cliente'} por $${((data.totalAmount || 0) / 100).toLocaleString('es-CO')}`,
      type: 'order_update',
      read: false,
      link: `/orders/${txId}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (EMAIL_ENABLED.value()) {
      // TODO: integrar proveedor real (SendGrid/Mailgun) cuando EMAIL_ENABLED=true.
      logger.info('onTransactionCreate: email delivery requested but no provider wired yet', { txId });
    }
  } catch (e) {
    logger.error('onTransactionCreate: failed to notify seller', e);
  }
});
