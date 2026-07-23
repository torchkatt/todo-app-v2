/**
 * @file giftCardService.ts
 * @description Servicio de Gift Cards multi-wallet (Starbucks-style).
 * Cada usuario puede tener múltiples gift cards, cada una con su saldo independiente.
 */
import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { GIFT_CARD_CONFIG, AUTO_RELOAD_CONFIG } from '../config/constants';
import { walletService } from './walletService';
import type { GiftCard, GiftCardTransaction, AutoReloadConfig } from '../types';

const CARDS_COLLECTION = 'gift_cards';
const TX_COLLECTION = 'gift_card_transactions';

const DESIGN_EMOJIS: Record<string, string> = {
  default: '🎁',
  birthday: '🎂',
  celebration: '🎉',
  thanks: '🙏',
  holiday: '🎄',
};

export const giftCardService = {
  /**
   * Crear una gift card. Descuenta el monto de la wallet principal.
   */
  async create(
    userId: string,
    name: string,
    amount: number,
    design: GiftCard['design'] = 'default',
    message?: string,
  ): Promise<GiftCard> {
    if (amount < GIFT_CARD_CONFIG.minCreateAmount) {
      throw new Error(`Mínimo para crear gift card: $${GIFT_CARD_CONFIG.minCreateAmount.toLocaleString('es-CO')}`);
    }

    // Validar límite de cards activas
    const activeCards = await this.getActiveCards(userId);
    if (activeCards.length >= GIFT_CARD_CONFIG.maxCardsPerUser) {
      throw new Error(`Máximo de ${GIFT_CARD_CONFIG.maxCardsPerUser} gift cards activas`);
    }

    // Descontar de wallet principal
    const wallet = await walletService.getWallet(userId);
    if (wallet.balance < amount) {
      throw new Error(`Saldo insuficiente. Disponible: $${wallet.balance.toLocaleString('es-CO')}`);
    }

    // Si es la primera card, hacerla primary
    const isPrimary = activeCards.length === 0;

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + GIFT_CARD_CONFIG.defaultExpirationDays * 86400000).toISOString();

    // Descontar de wallet
    await setDoc(doc(db, 'wallets', userId), {
      ...wallet,
      balance: wallet.balance - amount,
      updatedAt: now,
    });

    // Crear gift card
    const cardRef = doc(collection(db, CARDS_COLLECTION));
    const card: GiftCard = {
      id: cardRef.id,
      userId,
      name,
      balance: amount,
      originalAmount: amount,
      message,
      design,
      status: 'ACTIVE',
      source: 'purchased',
      isPrimary,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(cardRef, card);

    // Registrar transacción interna
    await addDoc(collection(db, TX_COLLECTION), {
      cardId: cardRef.id,
      userId,
      type: 'LOAD',
      amount,
      balanceBefore: 0,
      balanceAfter: amount,
      description: `Creación de gift card "${name}"`,
      createdAt: now,
    } as GiftCardTransaction);

    return card;
  },

  /**
   * Obtener todas las gift cards de un usuario.
   */
  async getCards(userId: string): Promise<GiftCard[]> {
    const q = query(
      collection(db, CARDS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as GiftCard));
  },

  /**
   * Obtener solo cards activas.
   */
  async getActiveCards(userId: string): Promise<GiftCard[]> {
    const all = await this.getCards(userId);
    return all.filter(c => c.status === 'ACTIVE');
  },

  /**
   * Obtener detalle de una gift card.
   */
  async getCard(cardId: string): Promise<GiftCard | null> {
    const snap = await getDoc(doc(db, CARDS_COLLECTION, cardId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as GiftCard;
  },

  /**
   * Obtener transacciones de una gift card.
   */
  async getTransactions(cardId: string, max = 50): Promise<GiftCardTransaction[]> {
    const q = query(
      collection(db, TX_COLLECTION),
      where('cardId', '==', cardId),
      orderBy('createdAt', 'desc'),
      limit(max),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as GiftCardTransaction));
  },

  /**
   * Desactivar una gift card. Devuelve el saldo restante a la wallet principal.
   */
  async deactivate(cardId: string, userId: string): Promise<void> {
    const card = await this.getCard(cardId);
    if (!card) throw new Error('Gift card no encontrada');
    if (card.userId !== userId) throw new Error('No te pertenece');
    if (card.status !== 'ACTIVE') throw new Error('Ya está desactivada o expirada');

    const now = new Date().toISOString();
    const wallet = await walletService.getWallet(userId);

    // Devolver saldo a wallet principal
    if (card.balance > 0) {
      await setDoc(doc(db, 'wallets', userId), {
        ...wallet,
        balance: wallet.balance + card.balance,
        updatedAt: now,
      });
    }

    // Marcar como cancelada
    await updateDoc(doc(db, CARDS_COLLECTION, cardId), {
      status: 'CANCELLED',
      balance: 0,
      updatedAt: now,
    });

    // Registrar transacción
    await addDoc(collection(db, TX_COLLECTION), {
      cardId,
      userId,
      type: 'REFUND',
      amount: card.balance,
      balanceBefore: card.balance,
      balanceAfter: 0,
      description: `Desactivación de gift card "${card.name}" — saldo devuelto a wallet`,
      createdAt: now,
    } as GiftCardTransaction);
  },

  /**
   * Transferir saldo entre gift cards del mismo usuario.
   */
  async transfer(fromCardId: string, toCardId: string, amount: number, userId: string): Promise<void> {
    if (amount < GIFT_CARD_CONFIG.transferMin) {
      throw new Error(`Mínimo para transferir: $${GIFT_CARD_CONFIG.transferMin.toLocaleString('es-CO')}`);
    }

    const [fromCard, toCard] = await Promise.all([
      this.getCard(fromCardId),
      this.getCard(toCardId),
    ]);

    if (!fromCard || !toCard) throw new Error('Gift card no encontrada');
    if (fromCard.userId !== userId || toCard.userId !== userId) throw new Error('Ambas deben ser tuyas');
    if (fromCard.status !== 'ACTIVE') throw new Error('La card origen no está activa');
    if (toCard.status !== 'ACTIVE') throw new Error('La card destino no está activa');
    if (fromCard.balance < amount) throw new Error('Saldo insuficiente en la card origen');
    if (fromCardId === toCardId) throw new Error('No puedes transferir a la misma card');

    const now = new Date().toISOString();

    // Actualizar origen
    await updateDoc(doc(db, CARDS_COLLECTION, fromCardId), {
      balance: fromCard.balance - amount,
      updatedAt: now,
    });

    // Actualizar destino
    await updateDoc(doc(db, CARDS_COLLECTION, toCardId), {
      balance: toCard.balance + amount,
      updatedAt: now,
    });

    // Transacciones
    const txBase = {
      userId,
      createdAt: now,
    };

    await addDoc(collection(db, TX_COLLECTION), {
      ...txBase,
      cardId: fromCardId,
      type: 'TRANSFER_OUT',
      amount,
      balanceBefore: fromCard.balance,
      balanceAfter: fromCard.balance - amount,
      description: `Transferencia a "${toCard.name}"`,
      referenceId: toCardId,
    } as GiftCardTransaction);

    await addDoc(collection(db, TX_COLLECTION), {
      ...txBase,
      cardId: toCardId,
      type: 'TRANSFER_IN',
      amount,
      balanceBefore: toCard.balance,
      balanceAfter: toCard.balance + amount,
      description: `Transferencia desde "${fromCard.name}"`,
      referenceId: fromCardId,
    } as GiftCardTransaction);
  },

  /**
   * Obtener o crear la gift card primaria del usuario.
   */
  async getPrimaryCard(userId: string): Promise<GiftCard> {
    const cards = await this.getActiveCards(userId);
    const primary = cards.find(c => c.isPrimary);
    if (primary) return primary;

    // Crear card primaria por defecto con saldo 0
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + GIFT_CARD_CONFIG.defaultExpirationDays * 86400000).toISOString();
    const ref = doc(collection(db, CARDS_COLLECTION));
    const card: GiftCard = {
      id: ref.id,
      userId,
      name: 'Principal',
      balance: 0,
      originalAmount: 0,
      design: 'default',
      status: 'ACTIVE',
      source: 'purchased',
      isPrimary: true,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(ref, card);
    return card;
  },

  /**
   * Obtener el diseño emoji para una gift card.
   */
  getDesignEmoji(design?: GiftCard['design']): string {
    return DESIGN_EMOJIS[design || 'default'] || '🎁';
  },
};
