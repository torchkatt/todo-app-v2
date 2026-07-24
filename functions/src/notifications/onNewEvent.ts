/**
 * @file functions/src/notifications/onNewEvent.ts
 * @description Firestore-triggered push notifications for key marketplace events.
 *
 * ⚠️ NOTE: Some triggers here overlap with existing handlers:
 *   - onOrderCreated  ≈ onTransactionCreate (onTransactionCreate.ts)
 *   - onNewMessage    ≈ onChatMessageCreate  (chat/onChatMessageCreate.ts)
 *
 * These are designed to be used INSTEAD OF the overlapping handlers — do NOT
 * deploy both for the same document path, or you'll get duplicate notifications.
 * The existing handlers are NOT modified here to avoid breaking production.
 *
 * The genuinely NEW trigger is onNewFollower, which notifies a seller when
 * someone follows their store.
 */
import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { sendPush } from './sendPush';

// ─── onOrderCreated ──────────────────────────────────────────────────────────
/** Notifies the seller via push when a new transaction (order) is created. */
export const onOrderCreated = onDocumentCreated(
  'transactions/{txId}',
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const txId = event.params.txId;
    const db = admin.firestore();

    // Notify buyer
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
    await sendPush(data.buyerId, buyerTitle, buyerBody, { link: `/orders/${txId}` });

    // Notify seller (sellerId is the doc id in the sellers collection;
    // the actual owner uid is in sellers/{sellerId}.ownerId)
    try {
      const sellerSnap = await db.collection('sellers').doc(data.sellerId).get();
      const sellerOwnerId = sellerSnap.data()?.ownerId;
      if (sellerOwnerId) {
        const buyerSnap = await db.collection('users').doc(data.buyerId).get();
        const buyer = buyerSnap.data();
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
        await sendPush(sellerOwnerId, sellerTitle, sellerBody, { link: `/orders/${txId}` });
      } else {
        logger.error('onOrderCreated: seller doc missing ownerId', { txId, sellerId: data.sellerId });
      }
    } catch (e) {
      logger.error('onOrderCreated: failed to notify seller', e);
    }
  },
);

// ─── onNewFollower ───────────────────────────────────────────────────────────
/** Notifies a seller when someone follows their store. */
export const onNewFollower = onDocumentCreated(
  'seller_follows/{followId}',
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const db = admin.firestore();
    const sellerId = data.sellerId;
    const userId = data.userId;
    if (!sellerId || !userId) return;

    try {
      const [sellerSnap, userSnap] = await Promise.all([
        db.collection('sellers').doc(sellerId).get(),
        db.collection('users').doc(userId).get(),
      ]);

      const sellerOwnerId = sellerSnap.data()?.ownerId;
      if (!sellerOwnerId) {
        logger.warn('onNewFollower: seller doc missing ownerId', { sellerId });
        return;
      }

      const userName = userSnap.data()?.fullName || 'Alguien';
      const storeName = sellerSnap.data()?.name || 'tu tienda';
      const title = '👥 Nuevo seguidor';
      const body = `${userName} empezó a seguir ${storeName}`;

      await db.collection('notifications').add({
        userId: sellerOwnerId,
        targetRole: 'SELLER',
        title,
        body,
        type: 'system',
        read: false,
        link: `/seller/${sellerId}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await sendPush(sellerOwnerId, title, body, { link: `/seller/${sellerId}` });
    } catch (e) {
      logger.error('onNewFollower: failed to notify seller', e);
    }
  },
);

// ─── onNewMessage ────────────────────────────────────────────────────────────
/** Notifies other chat participants (excluding the sender) of a new message. */
export const onNewMessage = onDocumentCreated(
  'chats/{chatId}/messages/{messageId}',
  async (event) => {
    const msg = event.data?.data();
    if (!msg) return;

    const db = admin.firestore();
    const chatId = event.params.chatId;

    const chatSnap = await db.collection('chats').doc(chatId).get();
    if (!chatSnap.exists) return;
    const chat = chatSnap.data()!;

    // Don't notify for AI chat threads (no human on the other side)
    if (chat.type === 'ai') return;

    const recipients: string[] = (chat.participants ?? []).filter(
      (uid: string) => uid !== msg.senderId,
    );

    const title = '💬 Nuevo mensaje';
    const body: string = String(msg.text ?? '').slice(0, 140);

    await Promise.all(
      recipients.map(async (uid) => {
        try {
          await db.collection('notifications').add({
            userId: uid,
            targetRole: chat.sellerId ? 'SELLER' : 'CUSTOMER',
            title,
            body,
            type: 'chat_message',
            read: false,
            ...(chat.transactionId ? { link: `/orders/${chat.transactionId}` } : {}),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          await sendPush(uid, title, body, {
            chatId,
            type: 'chat_message',
          });
        } catch (e) {
          logger.error('onNewMessage: failed to notify recipient', {
            chatId,
            uid,
            error: e,
          });
        }
      }),
    );
  },
);
