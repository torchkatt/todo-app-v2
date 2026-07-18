import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import axios from 'axios';

admin.initializeApp();
const db = admin.firestore();

// ─── Wompi Webhook ───
// Register this URL in Wompi Dashboard → Webhooks
// POST /wompi-webhook
export const wompiWebhook = functions.https.onRequest(async (req, res) => {
  // Verify signature
  const signature = req.headers['x-wompi-signature'] as string;
  const event = req.body;
  if (!event?.data?.transaction) { res.status(400).send('Invalid payload'); return; }

  const tx = event.data.transaction;
  const orderRef = tx.reference;

  try {
    await db.collection('transactions').doc(orderRef).update({
      status: tx.status === 'APPROVED' ? 'PAYMENT_CONFIRMED' : tx.status === 'DECLINED' ? 'CANCELLED' : tx.status,
      'payment.status': tx.status,
      'payment.wompiId': tx.id,
      'payment.method': tx.payment_method?.type || 'unknown',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update seller stats
    const order = await db.collection('transactions').doc(orderRef).get();
    if (order.exists && tx.status === 'APPROVED') {
      const data = order.data()!;
      const sellerRef = db.collection('sellers').doc(data.sellerId);
      await sellerRef.update({
        'stats.totalRevenue': admin.firestore.FieldValue.increment(data.totalAmount || 0),
        'stats.totalTransactions': admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create notification for buyer
      await db.collection('notifications').add({
        userId: data.buyerId,
        title: '✅ Pago confirmado',
        body: `Tu pago por $${(data.totalAmount || 0).toLocaleString('es-CO')} ha sido aprobado`,
        type: 'order_update',
        read: false,
        link: `/orders/${orderRef}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.status(200).send({ received: true });
  } catch (e) {
    functions.logger.error('Webhook error:', e);
    res.status(500).send('Error processing webhook');
  }
});

// ─── On Transaction Create ───
// Auto-creates notification when a transaction is created
export const onTransactionCreate = functions.firestore
  .onDocumentCreated('transactions/{txId}', async (event) => {
    const data = event.data?.data();
    if (!data) return;

    await db.collection('notifications').add({
      userId: data.buyerId,
      title: '🛒 Pedido creado',
      body: `Tu pedido #${event.params.txId.slice(-8)} está pendiente de pago`,
      type: 'order_update',
      read: false,
      link: `/orders/${event.params.txId}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
