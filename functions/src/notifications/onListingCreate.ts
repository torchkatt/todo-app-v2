/**
 * @file functions/src/notifications/onListingCreate.ts
 * @description Notifica a los followers cuando un seller crea un nuevo listing.
 */
import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';

export const onListingCreate = onDocumentCreated('listings/{listingId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const listing = snap.data();
  const sellerId = listing.sellerId;
  if (!sellerId) return;

  const db = admin.firestore();
  const listingTitle = listing.title || 'Nuevo producto';

  // Buscar followers con notifiedListing = true
  const followersSnap = await db
    .collection('seller_follows')
    .where('sellerId', '==', sellerId)
    .where('notifiedListing', '==', true)
    .get();

  if (followersSnap.empty) {
    logger.info(`onListingCreate: no followers to notify for seller ${sellerId}`);
    return;
  }

  // Obtener nombre del seller
  const sellerSnap = await db.collection('sellers').doc(sellerId).get();
  const sellerName = sellerSnap.exists ? (sellerSnap.data()?.name || 'Una tienda') : 'Una tienda';

  let notified = 0;
  for (const followDoc of followersSnap.docs) {
    const data = followDoc.data();
    const userId = data.userId;
    if (!userId) continue;

    try {
      await db.collection('notifications').add({
        userId,
        title: `🆕 Nuevo en ${sellerName}`,
        body: listingTitle,
        type: 'order_update',
        read: false,
        link: `/listing/${event.params.listingId}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      notified++;
    } catch (e) {
      logger.error(`Error notifying user ${userId}`, e);
    }
  }

  logger.info(`onListingCreate: notified ${notified} followers about "${listingTitle}"`);
});
