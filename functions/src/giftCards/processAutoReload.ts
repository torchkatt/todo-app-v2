/**
 * @file functions/src/giftCards/processAutoReload.ts
 * @description Scheduled Cloud Function que procesa recargas automáticas de wallet.
 * Se ejecuta cada 60 minutos. Para cada wallet con autoReload habilitado:
 * - Si el balance está por debajo del threshold y no se ha alcanzado el tope mensual:
 *   → Incrementa el balance, registra transacción, actualiza contadores.
 * - Si se alcanza el tope mensual → deshabilita autoReload.
 */
import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';

export const processAutoReload = onSchedule('every 60 minutes', async () => {
  const db = admin.firestore();
  const now = new Date().toISOString();

  // Query wallets with autoReload enabled
  const walletsSnap = await db
    .collection('wallets')
    .where('autoReload.enabled', '==', true)
    .get();

  if (walletsSnap.empty) {
    logger.info('processAutoReload: no wallets with auto-reload enabled');
    return;
  }

  let processed = 0;
  let skippedThreshold = 0;
  let skippedMonthly = 0;
  let disabledLimit = 0;

  for (const walletDoc of walletsSnap.docs) {
    const wallet = walletDoc.data();
    const autoReload = wallet.autoReload;

    if (!autoReload) continue;

    const { threshold, amount, maxMonthly, monthlyCount = 0 } = autoReload;
    const balance: number = wallet.balance ?? 0;

    // Skip if balance is above threshold
    if (balance >= threshold) {
      skippedThreshold++;
      continue;
    }

    // Skip if monthly limit reached
    if (monthlyCount >= maxMonthly) {
      skippedMonthly++;

      // Disable autoReload if limit reached
      await walletDoc.ref.update({
        'autoReload.enabled': false,
        'autoReload.updatedAt': now,
        updatedAt: now,
      });
      disabledLimit++;
      continue;
    }

    try {
      const newBalance = balance + amount;
      const newMonthlyCount = monthlyCount + 1;
      const reachedLimit = newMonthlyCount >= maxMonthly;

      // Actualizar wallet
      await walletDoc.ref.update({
        balance: newBalance,
        'autoReload.monthlyCount': newMonthlyCount,
        'autoReload.lastReloadAt': now,
        'autoReload.updatedAt': now,
        ...(reachedLimit ? { 'autoReload.enabled': false } : {}),
        updatedAt: now,
      });

      // Registrar transacción
      await db.collection('wallet_transactions').add({
        userId: walletDoc.id,
        type: 'TOP_UP',
        amount,
        balanceBefore: balance,
        balanceAfter: newBalance,
        description: 'Recarga automática',
        referenceType: 'auto_reload',
        referenceId: `autoreload_${walletDoc.id}_${Date.now()}`,
        createdAt: now,
      });

      processed++;
    } catch (e) {
      logger.error(`processAutoReload: error processing wallet ${walletDoc.id}`, e);
    }
  }

  logger.info(
    `processAutoReload: done — processed=${processed}, ` +
    `skippedThreshold=${skippedThreshold}, skippedMonthly=${skippedMonthly}, ` +
    `disabledLimit=${disabledLimit}, total=${walletsSnap.size}`,
  );
});
