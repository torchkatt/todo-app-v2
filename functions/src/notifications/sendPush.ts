/**
 * @file functions/src/notifications/sendPush.ts
 * @description Thin wrapper around the shared push helper in ../lib/push.
 *
 * The real implementation lives in ../lib/push (sendPushToUser) which handles
 * FCM token lookup, dead-token cleanup, and error suppression. This module
 * exposes a convenience function with a flat (title, body, data?) signature
 * that the notification triggers consume.
 */
import { sendPushToUser } from '../lib/push';

/**
 * Send a push notification to a user.
 *
 * Looks up the user's `fcmToken` from Firestore and dispatches via
 * `admin.messaging().send()`. Tokens that are no longer valid are
 * automatically cleaned up so they aren't retried indefinitely.
 *
 * This function never throws — push delivery failures are logged but
 * must not take down the calling trigger (payment, chat, follow, etc.).
 */
export async function sendPush(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  return sendPushToUser(userId, { title, body }, data);
}
