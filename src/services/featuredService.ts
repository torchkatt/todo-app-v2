/**
 * @file services/featuredService.ts
 * @description Servicio de listings destacados/patrocinados (Rappi Ads style).
 */
import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, limit,
} from 'firebase/firestore';
import { FEATURED_CONFIG } from '../config/constants';
import type { FeaturedListing } from '../types';

const COLLECTION = 'featured_listings';

export const featuredService = {
  /**
   * Crear campaña destacada para un listing.
   */
  async createCampaign(
    sellerId: string,
    listingId: string,
    campaignType: 'daily' | 'weekly' | 'monthly',
  ): Promise<string> {
    // Validar límite por seller
    const active = await this.getActiveCampaigns(sellerId);
    if (active.length >= FEATURED_CONFIG.maxPerSeller) {
      throw new Error(`Máximo ${FEATURED_CONFIG.maxPerSeller} campañas activas`);
    }

    const priceMap = {
      daily: FEATURED_CONFIG.dailyPrice,
      weekly: FEATURED_CONFIG.weeklyPrice,
      monthly: FEATURED_CONFIG.monthlyPrice,
    };
    const budget = priceMap[campaignType];

    const startDate = new Date();
    const endDate = new Date(startDate);
    if (campaignType === 'daily') endDate.setDate(endDate.getDate() + 1);
    else if (campaignType === 'weekly') endDate.setDate(endDate.getDate() + 7);
    else endDate.setMonth(endDate.getMonth() + 1);

    const ref = await addDoc(collection(db, COLLECTION), {
      listingId,
      sellerId,
      campaignType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      budget,
      impressions: 0,
      clicks: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    } as FeaturedListing);

    // Marcar listing como destacado
    await updateDoc(doc(db, 'listings', listingId), {
      isFeatured: true,
      updatedAt: new Date().toISOString(),
    });

    return ref.id;
  },

  /**
   * Obtener campañas activas de un seller.
   */
  async getActiveCampaigns(sellerId: string): Promise<FeaturedListing[]> {
    const q = query(
      collection(db, COLLECTION),
      where('sellerId', '==', sellerId),
      where('isActive', '==', true),
      orderBy('endDate', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FeaturedListing));
  },

  /**
   * Obtener listings destacados activos (para el feed).
   */
  async getFeaturedListings(max = 20): Promise<string[]> {
    const now = new Date().toISOString();
    const q = query(
      collection(db, COLLECTION),
      where('isActive', '==', true),
      where('endDate', '>=', now),
      orderBy('endDate', 'asc'),
      limit(max),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data().listingId);
  },

  /**
   * Desactivar campaña.
   */
  async deactivateCampaign(campaignId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, campaignId), { isActive: false });
  },
};
