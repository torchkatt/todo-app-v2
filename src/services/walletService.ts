/**
 * @file walletService.ts
 * @description Servicio de billetera digital — saldo, recargas, pagos, historial.
 * Inspirado en RappiPay / WeChat Pay: saldo disponible para compras 1-click.
 */
import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc,
  query, where, orderBy, limit,
} from 'firebase/firestore';
import { WALLET_CONFIG } from '../config/constants';
import type { Wallet, WalletTransaction, AutoReloadConfig } from '../types';

const WALLETS_COLLECTION = 'wallets';
const TX_COLLECTION = 'wallet_transactions';

export const walletService = {
  /**
   * Obtener wallet de un usuario. Crea una con balance 0 si no existe.
   */
  async getWallet(userId: string): Promise<Wallet> {
    const ref = doc(db, WALLETS_COLLECTION, userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Wallet;
    }
    // Crear wallet nueva
    const wallet: Wallet = {
      id: userId,
      balance: 0,
      pendingCashback: 0,
      lifetimeCashback: 0,
      lifetimeSpent: 0,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(ref, wallet);
    return wallet;
  },

  /**
   * Recargar saldo (después de pago Wompi exitoso).
   */
  async topUp(userId: string, amount: number, wompiReference?: string): Promise<Wallet> {
    if (amount < WALLET_CONFIG.minTopUp) throw new Error(`Mínimo recarga: $${WALLET_CONFIG.minTopUp}`);
    if (amount > WALLET_CONFIG.maxTopUp) throw new Error(`Máximo recarga: $${WALLET_CONFIG.maxTopUp}`);

    const wallet = await this.getWallet(userId);
    const newBalance = wallet.balance + amount;

    if (newBalance > WALLET_CONFIG.maxBalance) {
      throw new Error(`Saldo máximo: $${WALLET_CONFIG.maxBalance}`);
    }

    await setDoc(doc(db, WALLETS_COLLECTION, userId), {
      ...wallet,
      balance: newBalance,
      updatedAt: new Date().toISOString(),
    });

    // Registrar transacción
    await addDoc(collection(db, TX_COLLECTION), {
      userId,
      type: 'TOP_UP',
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: newBalance,
      description: `Recarga de $${amount.toLocaleString('es-CO')}`,
      referenceType: wompiReference ? 'top_up' : undefined,
      referenceId: wompiReference,
      createdAt: new Date().toISOString(),
    } as WalletTransaction);

    return { ...wallet, balance: newBalance };
  },

  /**
   * Pagar con saldo de la wallet.
   */
  async payWithWallet(userId: string, amount: number, transactionId: string): Promise<Wallet> {
    const wallet = await this.getWallet(userId);
    if (wallet.balance < amount) {
      throw new Error(`Saldo insuficiente. Disponible: $${wallet.balance.toLocaleString('es-CO')}`);
    }

    const newBalance = wallet.balance - amount;

    await setDoc(doc(db, WALLETS_COLLECTION, userId), {
      ...wallet,
      balance: newBalance,
      lifetimeSpent: (wallet.lifetimeSpent || 0) + amount,
      updatedAt: new Date().toISOString(),
    });

    await addDoc(collection(db, TX_COLLECTION), {
      userId,
      type: 'PAYMENT',
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: newBalance,
      description: `Pago de $${amount.toLocaleString('es-CO')}`,
      referenceType: 'transaction',
      referenceId: transactionId,
      createdAt: new Date().toISOString(),
    } as WalletTransaction);

    return { ...wallet, balance: newBalance };
  },

  /**
   * Obtener historial de transacciones de wallet.
   */
  async getTransactions(userId: string, max = 20): Promise<WalletTransaction[]> {
    const q = query(
      collection(db, TX_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(max),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as WalletTransaction));
  },

  /**
   * Obtener balance actual.
   */
  async getBalance(userId: string): Promise<number> {
    const wallet = await this.getWallet(userId);
    return wallet.balance;
  },

  /**
   * Obtener configuración de auto-recarga.
   */
  async getAutoReloadConfig(userId: string): Promise<AutoReloadConfig | null> {
    const wallet = await this.getWallet(userId);
    return wallet.autoReload || null;
  },

  /**
   * Guardar/actualizar configuración de auto-recarga.
   */
  async setAutoReloadConfig(userId: string, config: Partial<AutoReloadConfig>): Promise<AutoReloadConfig> {
    const wallet = await this.getWallet(userId);
    const current = wallet.autoReload || {
      enabled: false,
      threshold: 50_000,
      amount: 100_000,
      maxMonthly: 5,
      monthlyCount: 0,
      updatedAt: new Date().toISOString(),
    };

    const updated: AutoReloadConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, WALLETS_COLLECTION, userId), {
      ...wallet,
      autoReload: updated,
      updatedAt: updated.updatedAt,
    });

    return updated;
  },

  /**
   * Verificar si se debe mostrar prompt de recarga automática.
   * Retorna null si no aplica, o el monto a recargar si debe hacerlo.
   */
  async checkAutoReload(userId: string): Promise<{ shouldReload: boolean; amount: number } | null> {
    const wallet = await this.getWallet(userId);
    const config = wallet.autoReload;
    if (!config?.enabled) return null;
    if (wallet.balance >= config.threshold) return null;
    if (config.monthlyCount >= config.maxMonthly) return null;

    return { shouldReload: true, amount: config.amount };
  },
};
