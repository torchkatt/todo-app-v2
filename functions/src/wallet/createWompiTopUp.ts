import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import {
  WOMPI_PRIVATE_KEY,
  WOMPI_EVENTS_SECRET,
  WOMPI_INTEGRITY_SECRET,
  wompiConfigured,
} from '../config';
import { integritySignature } from '../payments/wompiSignature';
import { audit } from '../lib/audit';

const CURRENCY = 'COP';
const MIN_TOPUP = 5_000; // 5K COP
const MAX_TOPUP = 5_000_000; // 5M COP

/**
 * Callable function que prepara una recarga de wallet vía Wompi.
 *
 * El cliente llama a esta función con el monto deseado, recibe los datos
 * necesarios para abrir el checkout de Wompi (reference, amountInCents,
 * integritySignature) y luego Wompi notifica al webhook cuando el pago
 * es aprobado.
 */
export const createWompiTopUp = onCall(
  { cors: true, secrets: [WOMPI_PRIVATE_KEY, WOMPI_EVENTS_SECRET, WOMPI_INTEGRITY_SECRET] },
  async (request) => {
    try {
      // ── Autenticación ──
      const auth = request.auth;
      if (!auth) {
        throw new HttpsError('unauthenticated', 'Debes iniciar sesión para recargar tu wallet.');
      }

      // ── Validar que Wompi esté configurado ──
      if (!wompiConfigured()) {
        throw new HttpsError('failed-precondition', 'Pagos no configurados.');
      }

      // ── Validar monto ──
      const { amount } = request.data as { amount: number };
      if (typeof amount !== 'number' || !Number.isFinite(amount) || !Number.isInteger(amount)) {
        throw new HttpsError('invalid-argument', 'El monto debe ser un número entero en pesos COP.');
      }
      if (amount < MIN_TOPUP) {
        throw new HttpsError(
          'invalid-argument',
          `El monto mínimo de recarga es $${MIN_TOPUP.toLocaleString('es-CO')} COP.`,
        );
      }
      if (amount > MAX_TOPUP) {
        throw new HttpsError(
          'invalid-argument',
          `El monto máximo de recarga es $${MAX_TOPUP.toLocaleString('es-CO')} COP.`,
        );
      }

      // ── Generar referencia ──
      const timestamp = Date.now();
      const reference = `topup_${auth.uid}_${timestamp}`;
      const amountInCents = amount * 100;

      // ── Calcular firma de integridad ──
      const signature = integritySignature(
        reference,
        amountInCents,
        CURRENCY,
        WOMPI_INTEGRITY_SECRET.value(),
      );

      // ── Crear registro pendiente en wallet_transactions ──
      const db = admin.firestore();
      const walletTxRef = db.collection('wallet_transactions').doc(reference);
      const walletSnap = await db.collection('wallets').doc(auth.uid).get();
      const currentBalance = walletSnap.exists ? (walletSnap.data()?.balance ?? 0) : 0;

      await walletTxRef.set({
        userId: auth.uid,
        type: 'topup',
        amount: amountInCents,
        balanceBefore: currentBalance,
        balanceAfter: currentBalance, // aún no aplicado
        description: `Recarga de wallet por $${amount.toLocaleString('es-CO')} COP`,
        referenceType: 'wompi_topup',
        referenceId: reference,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await audit('wallet.topup_initiated', {
        userId: auth.uid,
        reference,
        amount,
        amountInCents,
      }, { performedBy: auth.uid, targetType: 'wallet', targetId: auth.uid });

      logger.info('createWompiTopUp: top-up initiated', {
        userId: auth.uid,
        reference,
        amountInCents,
      });

      return {
        reference,
        amountInCents,
        currency: CURRENCY,
        integritySignature: signature,
      };
    } catch (e) {
      if (e instanceof HttpsError) throw e;
      logger.error('createWompiTopUp: failed to create top-up', e);
      throw new HttpsError('internal', 'No se pudo iniciar la recarga. Intenta de nuevo.');
    }
  },
);
