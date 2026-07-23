/**
 * @file functions/src/analytics/aggregateSellerStats.ts
 * @description Scheduled Cloud Function que agrega estadísticas de sellers cada 15 min.
 */
import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';

export const aggregateSellerStats = onSchedule('*/15 * * * *', async () => {
  const db = admin.firestore();
  const today = new Date().toISOString().split('T')[0];

  const sellersSnap = await db
    .collection('sellers')
    .where('isActive', '==', true)
    .get();

  let processed = 0;

  for (const sellerDoc of sellersSnap.docs) {
    const sellerId = sellerDoc.id;

    try {
      // Views del día
      const viewsSnap = await db
        .collection('analytics_events')
        .where('type', '==', 'listing_view')
        .where('sellerId', '==', sellerId)
        .where('date', '==', today)
        .get();

      // Unique visitors
      const uniqueVisitors = new Set(viewsSnap.docs.map(d => d.data().userId)).size;

      // Listing-level views
      const listingViews: Record<string, number> = {};
      viewsSnap.docs.forEach(d => {
        const lid = d.data().listingId;
        if (lid) listingViews[lid] = (listingViews[lid] || 0) + 1;
      });

      // Transacciones del día
      const txSnap = await db
        .collection('transactions')
        .where('sellerId', '==', sellerId)
        .where('createdAt', '>=', today)
        .get();

      let revenue = 0;
      txSnap.forEach(d => {
        revenue += d.data().totalAmount || 0;
      });

      // Top listings
      const topListings = Object.entries(listingViews)
        .map(([listingId, views]) => ({
          listingId,
          views,
          sales: 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Actualizar analytics
      await db
        .collection('seller_analytics')
        .doc(`${sellerId}_${today}`)
        .set(
          {
            sellerId,
            date: today,
            views: viewsSnap.size,
            uniqueVisitors,
            listingViews,
            transactions: txSnap.size,
            revenue,
            conversionRate: viewsSnap.size > 0 ? txSnap.size / viewsSnap.size : 0,
            avgOrderValue: txSnap.size > 0 ? Math.round(revenue / txSnap.size) : 0,
            topListings,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

      processed++;
    } catch (e) {
      logger.error(`Error aggregating stats for seller ${sellerId}`, e);
    }
  }

  logger.info(`aggregateSellerStats: processed ${processed}/${sellersSnap.size} sellers`);
});
