import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { sendPushToUser } from '../lib/push';

const TYPE_TITLE: Record<string, string> = {
  seller: '🏪 Mensaje del negocio',
  courier: '🛵 Mensaje del domiciliario',
};

/**
 * Al llegar un mensaje: actualiza la vista previa del chat padre (siempre) y,
 * salvo en hilos con la IA (sin otra parte humana a la que avisar), notifica
 * push + in-app al resto de participantes.
 */
export const onChatMessageCreate = onDocumentCreated('chats/{chatId}/messages/{messageId}', async (event) => {
  const msg = event.data?.data();
  if (!msg) return;

  const db = admin.firestore();
  const chatId = event.params.chatId;
  const chatRef = db.collection('chats').doc(chatId);
  const chatSnap = await chatRef.get();
  if (!chatSnap.exists) return;
  const chat = chatSnap.data()!;

  await chatRef.update({
    lastMessage: msg.text,
    lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
    lastMessageSenderId: msg.senderId,
  });

  if (chat.type === 'ai') return;

  const recipients: string[] = (chat.participants ?? []).filter((uid: string) => uid !== msg.senderId);
  const title = TYPE_TITLE[chat.type] ?? '💬 Nuevo mensaje';
  const body: string = String(msg.text ?? '').slice(0, 140);

  await Promise.all(
    recipients.map(async (uid) => {
      try {
        await db.collection('notifications').add({
          userId: uid,
          title,
          body,
          type: 'chat_message',
          read: false,
          ...(chat.transactionId ? { link: `/orders/${chat.transactionId}` } : {}),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await sendPushToUser(uid, { title, body }, { chatId, type: 'chat_message' });
      } catch (e) {
        logger.error('onChatMessageCreate: failed to notify recipient', { chatId, uid, error: e });
      }
    })
  );
});
