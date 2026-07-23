import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';

const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

/**
 * Envía un push FCM al usuario si tiene fcmToken guardado. Si el token está
 * muerto (desinstaló la app, permiso revocado), lo limpia para no reintentar
 * contra él indefinidamente. Nunca lanza — un fallo de push no debe tumbar
 * el flujo que lo dispara (pago, mensaje de chat, etc).
 */
export async function sendPushToUser(
  uid: string,
  notification: { title: string; body: string },
  data?: Record<string, string>
): Promise<void> {
  const db = admin.firestore();
  try {
    const userSnap = await db.collection('users').doc(uid).get();
    const fcmToken = userSnap.data()?.fcmToken;
    if (!fcmToken) return;

    await admin.messaging().send({ token: fcmToken, notification, data });
  } catch (e: any) {
    if (DEAD_TOKEN_CODES.has(e?.code)) {
      await db.collection('users').doc(uid).update({ fcmToken: admin.firestore.FieldValue.delete() }).catch(() => {});
      return;
    }
    logger.error('sendPushToUser: failed to send push', { uid, error: e });
  }
}
