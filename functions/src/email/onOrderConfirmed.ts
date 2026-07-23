import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import {
  EMAIL_ENABLED,
  EMAIL_SMTP_HOST,
  EMAIL_SMTP_PASS,
  EMAIL_SMTP_USER,
  EMAIL_SMTP_PORT,
  EMAIL_FROM,
} from '../config';
import { sendEmail } from './sendEmail';
import { orderConfirmedTemplate } from './templates';

/**
 * Se dispara cuando se crea un documento en `transactions/{txId}`.
 * Si la transacción tiene status 'approved', envía un correo de confirmación
 * al comprador con los detalles de la orden.
 *
 * Dependencias: nodemailer + secretos SMTP configurados en Firebase Secrets.
 */
export const onOrderConfirmed = onDocumentCreated(
  { document: 'transactions/{txId}', secrets: [EMAIL_SMTP_HOST, EMAIL_SMTP_PASS, EMAIL_SMTP_USER, EMAIL_SMTP_PORT, EMAIL_FROM] },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const txId = event.params.txId;

    // Solo envía email si la transacción fue aprobada
    if (data.status !== 'approved' && data.status !== 'APPROVED') {
      logger.info('onOrderConfirmed: transaction not approved, skipping email', { txId, status: data.status });
      return;
    }

    if (!EMAIL_ENABLED.value()) {
      logger.info('onOrderConfirmed: EMAIL_ENABLED is false, skipping email', { txId });
      return;
    }

    const db = admin.firestore();

    try {
      // Obtener datos del comprador
      const buyerDoc = await db.collection('users').doc(data.buyerId).get();
      const buyer = buyerDoc.data();
      const userEmail = buyer?.email;
      const userName = buyer?.fullName || buyer?.displayName || 'Usuario';

      if (!userEmail) {
        logger.error('onOrderConfirmed: buyer has no email', { txId, buyerId: data.buyerId });
        return;
      }

      // Construir objeto de orden para la plantilla
      const order = {
        id: txId,
        items: data.items || [],
        total: data.totalAmount || 0,
        deliveryEstimate: data.deliveryEstimate,
      };

      const html = orderConfirmedTemplate(order, userName);
      await sendEmail(userEmail, `✅ Pedido #${txId.slice(-8)} confirmado — Todo`, html);

      logger.info('onOrderConfirmed: confirmation email sent', { txId, buyerId: data.buyerId });
    } catch (err) {
      logger.error('onOrderConfirmed: failed to send confirmation email', err);
      // No re-lanzamos: el trigger de notificaciones es best-effort.
    }
  },
);
