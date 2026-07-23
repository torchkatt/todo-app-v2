/**
 * @file followService.ts
 * @description Servicio para seguir/dejar de seguir sellers (WeChat OA style).
 */
import { db } from './firebase';
import {
  doc, setDoc, deleteDoc, getDoc, getDocs,
  collection, query, where, orderBy, limit,
} from 'firebase/firestore';
import type { SellerFollow } from '../types';

const COLLECTION = 'seller_follows';

export const followService = {
  /**
   * Seguir a un seller.
   */
  async follow(userId: string, sellerId: string): Promise<void> {
    const ref = doc(db, COLLECTION, `${userId}_${sellerId}`);
    await setDoc(ref, {
      userId,
      sellerId,
      notifiedListing: true,
      followedAt: new Date().toISOString(),
    } as SellerFollow);
  },

  /**
   * Dejar de seguir a un seller.
   */
  async unfollow(userId: string, sellerId: string): Promise<void> {
    const ref = doc(db, COLLECTION, `${userId}_${sellerId}`);
    await deleteDoc(ref);
  },

  /**
   * Verificar si un usuario sigue a un seller.
   */
  async isFollowing(userId: string, sellerId: string): Promise<boolean> {
    const snap = await getDoc(doc(db, COLLECTION, `${userId}_${sellerId}`));
    return snap.exists();
  },

  /**
   * Obtener IDs de sellers que un usuario sigue.
   */
  async getFollowedSellers(userId: string): Promise<string[]> {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('followedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data().sellerId);
  },

  /**
   * Obtener followers de un seller.
   */
  async getFollowers(sellerId: string, max = 100): Promise<SellerFollow[]> {
    const q = query(
      collection(db, COLLECTION),
      where('sellerId', '==', sellerId),
      limit(max),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as unknown as SellerFollow));
  },

  /**
   * Contar followers de un seller.
   */
  async getFollowerCount(sellerId: string): Promise<number> {
    const snap = await getDocs(
      query(collection(db, COLLECTION), where('sellerId', '==', sellerId)),
    );
    return snap.size;
  },
};
