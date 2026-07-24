/**
 * @file cashbackService.ts
 * @description Servicio de cashback — cálculo, consulta y reclamo.
 * Inspirado en RappiCard cashback: 3% base, bonos por tier.
 */
import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, setDoc,
  query, where, orderBy, 
  
} from 'firebase/firestore';
import { CASHBACK_CONFIG } from '../config/constants';
import type { CashbackRecord, CashbackRule } from '../types';

const RECORDS_COLLECTION = 'cashback_records';
const RULES_COLLECTION = 'cashback_rules';

export const cashbackService = {
  /**
   * Calcular cashback para un monto y tier.
   */
  calculateCashback(
    amount: number,
    tier: 'free' | 'pro' | 'black' = 'free',
  ): number {
    if (amount < CASHBACK_CONFIG.minPurchaseForCashback) return 0;

    let rateBps = CASHBACK_CONFIG.defaultRateBps;
    if (tier === 'pro') rateBps += CASHBACK_CONFIG.todoPassProBonus;
    if (tier === 'black') rateBps += CASHBACK_CONFIG.todoPassBlackBonus;

    const cashback = Math.round((amount * rateBps) / 10000);
    return Math.min(cashback, CASHBACK_CONFIG.maxPerTransaction);
  },

  /**
   * Obtener cashbacks pendientes de un usuario.
   */
  async getPendingCashback(userId: string): Promise<CashbackRecord[]> {
    const q = query(
      collection(db, RECORDS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'AVAILABLE'),
      orderBy('expiresAt', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CashbackRecord));
  },

  /**
   * Obtener total de cashback disponible (suma).
   */
  async getPendingTotal(userId: string): Promise<number> {
    const records = await this.getPendingCashback(userId);
    return records.reduce((sum, r) => sum + r.amount, 0);
  },

  /**
   * Reclamar cashback → mover a wallet.
   */
  async claimCashback(userId: string, recordId: string): Promise<void> {
    const ref = doc(db, RECORDS_COLLECTION, recordId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Cashback record not found');

    const record = snap.data() as CashbackRecord;
    if (record.userId !== userId) throw new Error('Not your cashback');
    if (record.status !== 'AVAILABLE') throw new Error('Cashback already claimed or expired');

    // Actualizar registro
    await setDoc(ref, {
      ...record,
      status: 'CLAIMED' as const,
      claimedAt: new Date().toISOString(),
    });

    // Sumar a wallet
    const walletRef = doc(db, 'wallets', userId);
    const walletSnap = await getDoc(walletRef);
    const currentBalance = walletSnap.exists() ? walletSnap.data().balance : 0;

    await setDoc(walletRef, {
      id: userId,
      balance: currentBalance + record.amount,
      pendingCashback: 0,
      lifetimeCashback: (walletSnap.exists() ? walletSnap.data().lifetimeCashback || 0 : 0) + record.amount,
      lifetimeSpent: walletSnap.exists() ? walletSnap.data().lifetimeSpent || 0 : 0,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  /**
   * Reclamar todo el cashback disponible.
   */
  async claimAll(userId: string): Promise<number> {
    const pending = await this.getPendingCashback(userId);
    let total = 0;
    for (const record of pending) {
      try {
        await this.claimCashback(userId, record.id!);
        total += record.amount;
      } catch {
        // Individual failures don't block others
      }
    }
    return total;
  },

  /**
   * Obtener cashback próximo a vencer (7 días).
   */
  async getExpiringSoon(userId: string, days = 7): Promise<CashbackRecord[]> {
    const all = await this.getPendingCashback(userId);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);
    return all.filter(r => new Date(r.expiresAt) <= threshold);
  },
};
