/**
 * @file migrations/addRolesField.ts
 * @description One-time migration: add `roles` array and `primaryRole` to existing
 * user documents that still have the old `role` field.
 *
 * Run: `npx ts-node --esm functions/src/migrations/addRolesField.ts`
 * Or deploy as a callable function and invoke once.
 */
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

async function migrate() {
  console.log('🔍 Scanning users collection for documents without roles...');
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

    // Firestore batches max 500 operations
    if (ops >= 400) {
      await batch.commit();
      console.log(`  → Committed batch (${migrated} migrated so far)`);
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(`\n✅ Migration complete`);
  console.log(`   Migrated: ${migrated}`);
  console.log(`   Skipped (already has roles): ${skipped}`);
  process.exit(0);
}

migrate().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
