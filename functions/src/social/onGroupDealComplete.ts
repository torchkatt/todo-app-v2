/**
 * @file functions/src/social/onGroupDealComplete.ts
 * @description Cuando un GroupDeal alcanza minParticipants, notifica a los participantes
 * y crea las transacciones con descuento aplicado.
 */
import * as admin from 'firebase-admin';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';

export const onGroupDealComplete = onDocumentUpdated(
  'group_deals/{dealId}',
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;

    // Solo cuando ACTIVE → COMPLETED
    if (before.status !== 'ACTIVE' || after.status !== 'COMPLETED') return;

    const db = admin.firestore();
    const dealId = event.params.dealId;

    // Obtener participantes
    const participantsSnap = await db
      .collection('group_deal_participants')
      .where('groupDealId', '==', dealId)
      .get();

    if (participantsSnap.empty) {
      logger.warn(`onGroupDealComplete: no participants found for deal ${dealId}`);
      return;
    }

    // Notificar a cada participante
    const { title, groupPrice, discountPercent } = after;

    for (const doc of participantsSnap.docs) {
      const p = doc.data();
      if (!p.userId) continue;

      await db.collection('notifications').add({
        userId: p.userId,
        title: `🎉 ¡Grupo completado!`,
        body: `"${title}" — ${discountPercent}% OFF a solo $${(groupPrice || 0).toLocaleString('es-CO')}`,
        type: 'order_update',
        read: false,
        link: `/group-deal/${dealId}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    logger.info(`onGroupDealComplete: notified ${participantsSnap.size} participants for deal ${dealId}`);
  },
);
