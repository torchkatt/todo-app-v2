import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

type GetOrCreateChatRequest =
  | { type: 'ai' }
  | { type: 'seller'; sellerId: string }
  | { type: 'courier'; transactionId: string }
  | { type: 'p2p'; otherUserId: string };

/**
 * Obtiene (o crea, idempotente) el hilo de chat correspondiente. IDs
 * determinísticos por tipo evitan duplicados sin necesitar una transacción:
 * ai_{uid}, seller_{buyerId}_{sellerId} (un hilo persistente por par
 * comprador-tienda, reusado entre pedidos), courier_{transactionId}_{courierId}
 * (un hilo por pedido, el domiciliario puede cambiar de un pedido a otro).
 */
export const getOrCreateChat = onCall({ cors: true }, async (request) => {
  const auth = request.auth;
  if (!auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  const uid = auth.uid;
  const data = request.data as GetOrCreateChatRequest;
  const db = admin.firestore();

  if (data?.type === 'ai') {
    const chatId = `ai_${uid}`;
    const ref = db.collection('chats').doc(chatId);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        type: 'ai',
        participants: [uid],
        buyerId: uid,
        lastMessage: '',
        lastMessageAt: null,
        lastMessageSenderId: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    return { chatId };
  }

  if (data?.type === 'seller') {
    const sellerId = data.sellerId;
    if (!sellerId) throw new HttpsError('invalid-argument', 'Falta sellerId.');

    // Gate anti-spam: solo se puede abrir chat con una tienda donde ya se compró.
    const hasPurchased = await db
      .collection('transactions')
      .where('buyerId', '==', uid)
      .where('sellerId', '==', sellerId)
      .limit(1)
      .get();
    if (hasPurchased.empty) {
      throw new HttpsError('failed-precondition', 'Solo puedes chatear con tiendas donde ya tengas un pedido.');
    }

    const sellerSnap = await db.collection('sellers').doc(sellerId).get();
    if (!sellerSnap.exists) throw new HttpsError('not-found', 'Tienda no encontrada.');
    const seller = sellerSnap.data()!;
    const sellerOwnerId = seller.ownerId;

    const chatId = `seller_${uid}_${sellerId}`;
    const ref = db.collection('chats').doc(chatId);
    const snap = await ref.get();
    if (!snap.exists) {
      const buyerSnap = await db.collection('users').doc(uid).get();
      await ref.set({
        type: 'seller',
        participants: [uid, sellerOwnerId],
        buyerId: uid,
        buyerName: buyerSnap.data()?.fullName ?? 'Comprador',
        sellerId,
        sellerOwnerId,
        sellerName: seller.name ?? 'Tienda',
        lastMessage: '',
        lastMessageAt: null,
        lastMessageSenderId: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    return { chatId };
  }

  if (data?.type === 'courier') {
    const transactionId = data.transactionId;
    if (!transactionId) throw new HttpsError('invalid-argument', 'Falta transactionId.');

    const txSnap = await db.collection('transactions').doc(transactionId).get();
    if (!txSnap.exists) throw new HttpsError('not-found', 'Pedido no encontrado.');
    const tx = txSnap.data()!;
    if (tx.buyerId !== uid) throw new HttpsError('permission-denied', 'No tienes acceso a este pedido.');

    const courierId = tx.courierId;
    if (!courierId) throw new HttpsError('failed-precondition', 'Este pedido aún no tiene domiciliario asignado.');

    const chatId = `courier_${transactionId}_${courierId}`;
    const ref = db.collection('chats').doc(chatId);
    const snap = await ref.get();
    if (!snap.exists) {
      const [buyerSnap, courierSnap] = await Promise.all([
        db.collection('users').doc(uid).get(),
        db.collection('users').doc(courierId).get(),
      ]);
      await ref.set({
        type: 'courier',
        participants: [uid, courierId],
        buyerId: uid,
        buyerName: buyerSnap.data()?.fullName ?? 'Comprador',
        courierId,
        courierName: courierSnap.data()?.fullName ?? 'Domiciliario',
        transactionId,
        lastMessage: '',
        lastMessageAt: null,
        lastMessageSenderId: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    return { chatId };
  }

  // ─── P2P Chat (usuario a usuario) ───────────────
  if (data?.type === 'p2p') {
    const otherUserId = data.otherUserId;
    if (!otherUserId) throw new HttpsError('invalid-argument', 'Falta otherUserId.');
    if (otherUserId === uid) throw new HttpsError('invalid-argument', 'No puedes chatear contigo mismo.');

    const otherSnap = await db.collection('users').doc(otherUserId).get();
    if (!otherSnap.exists) throw new HttpsError('not-found', 'Usuario no encontrado.');

    // ID determinístico: orden alfabético para que sea el mismo desde ambos lados
    const [a, b] = [uid, otherUserId].sort();
    const chatId = `p2p_${a}_${b}`;
    const ref = db.collection('chats').doc(chatId);
    const snap = await ref.get();
    if (!snap.exists) {
      const [mySnap, otherUserSnap] = await Promise.all([
        db.collection('users').doc(uid).get(),
        db.collection('users').doc(otherUserId).get(),
      ]);
      const myName = mySnap.data()?.fullName ?? 'Usuario';
      const otherName = otherUserSnap.data()?.fullName ?? 'Usuario';
      await ref.set({
        type: 'p2p',
        participants: [uid, otherUserId],
        buyerId: uid,
        buyerName: myName,
        sellerId: otherUserId,
        sellerName: otherName,
        lastMessage: '',
        lastMessageAt: null,
        lastMessageSenderId: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    return { chatId };
  }

  throw new HttpsError('invalid-argument', 'Tipo de chat inválido.');
});
