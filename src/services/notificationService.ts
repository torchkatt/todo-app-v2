/**
 * @file src/services/notificationService.ts
 * @description Client-side notification preferences and read-state management.
 *
 * Works against the same Firestore collections used by the server-side notification
 * triggers: `users/{uid}.notificationPreferences` and `notifications/{id}`.
 */
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NotificationPreferences {
  pushEnabled: boolean;     // FCM push
  emailEnabled: boolean;    // transactional email (requires provider wired in CF)
  chatNotify: boolean;      // chat messages
  orderNotify: boolean;     // order updates
  promoNotify: boolean;     // marketing / promos
  followNotify: boolean;    // new follower alerts
}

const DEFAULT_PREFS: NotificationPreferences = {
  pushEnabled: true,
  emailEnabled: false,
  chatNotify: true,
  orderNotify: true,
  promoNotify: false,
  followNotify: true,
};

// ─── Preferences ─────────────────────────────────────────────────────────────

/** Read notification preferences for a user. Returns sensible defaults if unset. */
export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const stored = userSnap.data()?.notificationPreferences as
    | Partial<NotificationPreferences>
    | undefined;

  return { ...DEFAULT_PREFS, ...stored };
}

/** Persist (partial) notification preferences for a user. */
export async function setNotificationPreferences(
  userId: string,
  prefs: Partial<NotificationPreferences>,
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    'notificationPreferences': prefs,
    'updatedAt': serverTimestamp(),
  });
}

// ─── Read State ──────────────────────────────────────────────────────────────

/** Mark a single notification as read. */
export async function markAsRead(notificationId: string): Promise<void> {
  const notifRef = doc(db, 'notifications', notificationId);
  await updateDoc(notifRef, { read: true });
}

/** Mark ALL notifications for a user as read (batch-style — one call per doc). */
export async function markAllAsRead(userId: string): Promise<void> {
  // Firestore client SDK doesn't support bulk writes with a query, so we
  // fall back to iterating. For production-scale use, consider a Cloud Function
  // that accepts a userId and writes in a batched transaction.
  const { collection, query, where, getDocs, writeBatch } = await import(
    'firebase/firestore'
  );

  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false),
  );

  const snap = await getDocs(q);
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}
