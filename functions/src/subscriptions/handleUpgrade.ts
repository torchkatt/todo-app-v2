/**
 * @file functions/src/subscriptions/handleUpgrade.ts
 * @description Callable function para que un seller actualice su plan de suscripción.
 * Crea una referencia Wompi para el pago. Al confirmarse (webhook), se actualiza la suscripción.
 */
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { WOMPI_PRIVATE_KEY, WOMPI_INTEGRITY_SECRET, wompiConfigured } from '../config';
import { integritySignature } from '../payments/wompiSignature';
import { audit } from '../lib/audit';

export const handleUpgrade = onCall(
  { cors: true, secrets: [WOMPI_PRIVATE_KEY, WOMPI_INTEGRITY_SECRET] },
  async (request) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');

    const data = request.data as { planId: string };
    if (!data?.planId) throw new HttpsError('invalid-argument', 'Falta planId.');

    const db = admin.firestore();

    // 1. Validar que el usuario sea seller
    const userSnap = await db.collection('users').doc(auth.uid).get();
    const user = userSnap.data();
    if (!user || user.role !== 'SELLER') {
      throw new HttpsError('permission-denied', 'Solo vendedores pueden actualizar plan.');
    }

    // 2. Validar que el plan exista
    const planSnap = await db.collection('subscription_plans').doc(data.planId).get();
    if (!planSnap.exists) throw new HttpsError('not-found', 'Plan no encontrado.');
    const plan = planSnap.data()!;

    if (plan.price <= 0) {
      throw new HttpsError('invalid-argument', 'El plan gratuito no requiere pago.');
    }

    // 3. Verificar el seller
    const sellerId = user.sellerId;
    if (!sellerId) throw new HttpsError('failed-precondition', 'No tienes una tienda activa.');

    const sellerSnap = await db.collection('sellers').doc(sellerId).get();
    if (!sellerSnap.exists) throw new HttpsError('not-found', 'Tienda no encontrada.');

    // 4. Crear referencia de pago Wompi
    const reference = `upgrade_${sellerId}_${data.planId}_${Date.now()}`;
    const amountInCents = plan.price * 100;

    let integrity = '';
    if (wompiConfigured()) {
      integrity = integritySignature(reference, amountInCents, 'COP', WOMPI_INTEGRITY_SECRET.value());
    }

    // 5. Guardar intento de upgrade pendiente
    await db.collection('subscription_upgrades').doc(reference).set({
      sellerId,
      userId: auth.uid,
      planId: data.planId,
      planName: plan.name,
      price: plan.price,
      status: 'PENDING_PAYMENT',
      reference,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await audit('UPGRADE_INITIATED', {
      userId: auth.uid,
      sellerId,
      planId: data.planId,
      planName: plan.name,
      amount: plan.price,
      reference,
    });

    logger.info(`Upgrade initiated: seller ${sellerId} → ${data.planId} ($${plan.price})`);

    return {
      reference,
      amountInCents,
      currency: 'COP',
      integritySignature: integrity,
      integration: wompiConfigured() ? WOMPI_PRIVATE_KEY.value() : null,
      paymentReady: wompiConfigured(),
    };
  },
);
