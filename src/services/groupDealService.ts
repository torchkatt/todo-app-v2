/**
 * @file groupDealService.ts
 * @description Servicio de compras en grupo (Group Buying — Pinduoduo / WeChat style).
 * Los usuarios forman grupos para obtener descuentos. Compartir en WhatsApp = viral.
 */
import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  query, where, orderBy, limit,
  Timestamp, serverTimestamp,
} from 'firebase/firestore';
import { GROUP_DEAL_CONFIG } from '../config/constants';
import type { GroupDeal, GroupDealParticipant } from '../types';

const DEALS_COLLECTION = 'group_deals';
const PARTICIPANTS_COLLECTION = 'group_deal_participants';

function calculateDiscount(minParticipants: number): number {
  if (minParticipants >= 10) return GROUP_DEAL_CONFIG.maxDiscountPercent;
  if (minParticipants >= 5) return 15;
  if (minParticipants >= 3) return 10;
  return 5;
}

export const groupDealService = {
  /**
   * Crear un group deal para un listing.
   */
  async create(
    listingId: string,
    title: string,
    originalPrice: number,
    sellerId: string,
    createdBy: string,
    minParticipants: number = 3,
  ): Promise<GroupDeal> {
    const discountPercent = calculateDiscount(minParticipants);
    const groupPrice = Math.round(originalPrice * (1 - discountPercent / 100));
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + GROUP_DEAL_CONFIG.defaultDurationHours);

    const ref = doc(collection(db, DEALS_COLLECTION));
    const deal: GroupDeal = {
      id: ref.id,
      listingId,
      sellerId,
      title,
      originalPrice,
      groupPrice,
      discountPercent,
      minParticipants,
      maxParticipants: Math.min(minParticipants * 2, GROUP_DEAL_CONFIG.maxParticipants),
      currentCount: 1, // Creator joins automatically
      status: 'ACTIVE',
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      createdBy,
    };

    await setDoc(ref, deal);

    // Creator joins automatically
    await addDoc(collection(db, PARTICIPANTS_COLLECTION), {
      groupDealId: ref.id,
      userId: createdBy,
      status: 'JOINED',
      joinedAt: new Date().toISOString(),
    } as GroupDealParticipant);

    return deal;
  },

  /**
   * Unirse a un group deal.
   */
  async join(dealId: string, userId: string): Promise<GroupDeal> {
    const ref = doc(db, DEALS_COLLECTION, dealId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Group deal not found');

    const deal = snap.data() as GroupDeal;
    if (deal.status !== 'ACTIVE') throw new Error('Group deal is not active');
    if (deal.currentCount >= deal.maxParticipants) throw new Error('Group deal is full');

    const expiresAt = new Date(deal.expiresAt);
    if (expiresAt < new Date()) {
      await updateDoc(ref, { status: 'EXPIRED' });
      throw new Error('Group deal has expired');
    }

    // Add participant
    await addDoc(collection(db, PARTICIPANTS_COLLECTION), {
      groupDealId: dealId,
      userId,
      status: 'JOINED',
      joinedAt: new Date().toISOString(),
    } as GroupDealParticipant);

    const newCount = deal.currentCount + 1;
    const shouldComplete = newCount >= deal.minParticipants;

    const updates: Partial<GroupDeal> = {
      currentCount: newCount,
    };

    if (shouldComplete) {
      updates.status = 'COMPLETED';
    }

    await updateDoc(ref, updates);
    return { ...deal, ...updates };
  },

  /**
   * Obtener un group deal por ID.
   */
  async getDeal(dealId: string): Promise<GroupDeal | null> {
    const snap = await getDoc(doc(db, DEALS_COLLECTION, dealId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as GroupDeal;
  },

  /**
   * Obtener deals activos (opcionalmente por seller).
   */
  async getActiveDeals(sellerId?: string): Promise<GroupDeal[]> {
    let q = query(
      collection(db, DEALS_COLLECTION),
      where('status', '==', 'ACTIVE'),
      where('expiresAt', '>=', new Date().toISOString()),
      orderBy('expiresAt', 'asc'),
    );

    if (sellerId) {
      q = query(q, where('sellerId', '==', sellerId));
    }

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as GroupDeal));
  },

  /**
   * Obtener participantes de un deal.
   */
  async getParticipants(dealId: string): Promise<GroupDealParticipant[]> {
    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      where('groupDealId', '==', dealId),
      where('userId', '!=', ''),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as GroupDealParticipant));
  },

  /**
   * Cerrar un deal manualmente (seller/admin).
   */
  async closeDeal(dealId: string): Promise<void> {
    await updateDoc(doc(db, DEALS_COLLECTION, dealId), { status: 'CANCELLED' });
  },

  /**
   * Generar URL para compartir.
   */
  getShareUrl(dealId: string, userId: string): string {
    return `https://todo-a44f9.web.app/group-deal/${dealId}?ref=${userId}`;
  },

  /**
   * Generar texto para compartir en WhatsApp.
   */
  getShareText(deal: GroupDeal): string {
    const discount = deal.discountPercent;
    const price = deal.groupPrice.toLocaleString('es-CO');
    const original = deal.originalPrice.toLocaleString('es-CO');
    return `🎉 *¡Compremos en grupo en Todo!*\n\n${deal.title}\n💵 Precio normal: $${original}\n🔥 Precio grupal: $${price} (${discount}% OFF)\n👥 Faltan ${deal.minParticipants - deal.currentCount} personas\n\nÚnete aquí: https://todo-a44f9.web.app/group-deal/${deal.id}`;
  },
};
