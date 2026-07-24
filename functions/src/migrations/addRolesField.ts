import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

/**
 * One-time migration: add `roles` and `primaryRole` to existing user docs.
 * Invoke once: `firebase functions:call migrateRoles`
 */
export const migrateRoles = onCall(async () => {
  const db = admin.firestore();
  const snap = await db.collection('users').get();
  let migrated = 0;
  let skipped = 0;

  const batch = db.batch();
  let ops = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.roles && Array.isArray(data.roles)) {
      skipped++;
      continue;
    }
    const oldRole = data.role || 'CUSTOMER';
    batch.update(doc.ref, {
      roles: [oldRole],
      primaryRole: oldRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    ops++;
    migrated++;

    if (ops >= 400) {
      await batch.commit();
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();

  logger.info(`Migration complete: ${migrated} migrated, ${skipped} skipped`);
  return { migrated, skipped };
});
