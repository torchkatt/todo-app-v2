/**
 * @file giftService.ts
 * @description Servicio de créditos de regalo — enviar, reclamar, consultar.
 * Inspirado en WeChat Red Packets: crédito entre usuarios con expiración.
 */
import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc,
  query, where, orderBy, limit,
  serverTimestamp,
} from 'firebase/firestore';
import { GIFT_CONFIG } from '../config/constants';
import { walletService } from './walletService';
import type { GiftCredit } from '../types';

const GIFT_COLLECTION = 'gift_credits';

export const giftService = {
  /**
   * Enviar créditos de regalo a otro usuario.
   * Valida montos y límite diario antes de descontar de la wallet del remitente.
   * @returns giftId del documento creado
   */
  async send(
    userId: string,
    toUserId: string,
    amount: number,
    message?: string,
  ): Promise<string> {
    // Validaciones de monto
    if (amount < GIFT_CONFIG.minAmount) {
      throw new Error(`El monto mínimo para regalar es ${GIFT_CONFIG.minAmount.toLocaleString('es-CO')} COP`);
    }
    if (amount > GIFT_CONFIG.maxAmount) {
      throw new Error(`El monto máximo para regalar es ${GIFT_CONFIG.maxAmount.toLocaleString('es-CO')} COP`);
    }

    // Validar límite diario de envíos
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const sentTodayQ = query(
      collection(db, GIFT_COLLECTION),
      where('fromUserId', '==', userId),
      where('createdAt', '>=', todayStart.toISOString()),
    );
    const sentTodaySnap = await getDocs(sentTodayQ);
    if (sentTodaySnap.size >= GIFT_CONFIG.maxDailySent) {
      throw new Error(`Has alcanzado el límite diario de ${GIFT_CONFIG.maxDailySent} regalos`);
    }

    // Descontar de la wallet del remitente
    await walletService.payWithWallet(userId, amount, `gift_to_${toUserId}`);

    // Crear documento de gift
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + GIFT_CONFIG.expirationHours * 60 * 60 * 1000).toISOString();

    const gift: Omit<GiftCredit, 'id'> = {
      fromUserId: userId,
      toUserId,
      amount,
      message,
      status: 'SENT',
      expiresAt,
      createdAt: now,
    };

    const ref = await addDoc(collection(db, GIFT_COLLECTION), gift);
    return ref.id;
  },

  /**
   * Reclamar un crédito de regalo.
   * Solo el destinatario puede reclamarlo y debe estar en estado SENT.
   */
  async claim(giftId: string, userId: string): Promise<void> {
    const ref = doc(db, GIFT_COLLECTION, giftId);
    const snap = await getDoc(ref);

    if (!snap.exists()) throw new Error('Regalo no encontrado');
    const gift = { id: snap.id, ...snap.data() } as GiftCredit;

    if (gift.toUserId !== userId) throw new Error('Este regalo no es para ti');
    if (gift.status !== 'SENT') throw new Error('Este regalo ya fue reclamado o expiró');
    if (new Date(gift.expiresAt) < new Date()) throw new Error('Este regalo ya expiró');

    // Actualizar estado
    await setDoc(ref, {
      ...gift,
      status: 'CLAIMED' as const,
      claimedAt: new Date().toISOString(),
    });

    // Sumar a wallet del receptor
    const wallet = await walletService.getWallet(userId);
    await setDoc(doc(db, 'wallets', userId), {
      ...wallet,
      balance: wallet.balance + gift.amount,
      updatedAt: new Date().toISOString(),
    });

    // Registrar transacción
    await addDoc(collection(db, 'wallet_transactions'), {
      userId,
      type: 'GIFT_RECEIVED',
      amount: gift.amount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance + gift.amount,
      description: `Regalo recibido de ${gift.fromUserId}${gift.message ? `: "${gift.message}"` : ''}`,
      referenceType: 'gift',
      referenceId: giftId,
      createdAt: new Date().toISOString(),
    });
  },

  /**
   * Obtener regalos enviados por un usuario.
   */
  async getSent(userId: string): Promise<GiftCredit[]> {
    const q = query(
      collection(db, GIFT_COLLECTION),
      where('fromUserId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as GiftCredit));
  },

  /**
   * Obtener regalos recibidos por un usuario.
   */
  async getReceived(userId: string): Promise<GiftCredit[]> {
    const q = query(
      collection(db, GIFT_COLLECTION),
      where('toUserId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as GiftCredit));
  },

  /**
   * Generar URL de compartir (deep link al gift).
   */
  getShareUrl(giftId: string, userId: string): string {
    return `https://todo-a44f9.web.app/gift/${giftId}?ref=${userId}`;
  },
};
