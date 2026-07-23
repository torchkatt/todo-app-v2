/**
 * @file services/sellerAnalyticsService.ts
 * @description Servicio de analíticas para sellers (Brands by Todo).
 */
import { db } from './firebase';
import {
  collection, getDocs, addDoc,
  query, where, orderBy, limit,
  Timestamp,
} from 'firebase/firestore';
import type { SellerAnalytics } from '../types';
import { ANALYTICS_CONFIG } from '../config/constants';

export const sellerAnalyticsService = {
  /**
   * Obtener estadísticas diarias de los últimos N días.
   */
  async getDailyStats(sellerId: string, days = 30): Promise<SellerAnalytics[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];

    const q = query(
      collection(db, 'seller_analytics'),
      where('sellerId', '==', sellerId),
      where('date', '>=', startStr),
      orderBy('date', 'desc'),
      limit(days),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as unknown as SellerAnalytics));
  },

  /**
   * Obtener top listings por visitas.
   */
  async getTopListings(sellerId: string, max = ANALYTICS_CONFIG.maxTopListings): Promise<{ listingId: string; views: number; sales: number }[]> {
    const stats = await this.getDailyStats(sellerId, 30);
    const aggregated = new Map<string, { views: number; sales: number }>();

    for (const day of stats) {
      if (day.topListings) {
        for (const entry of day.topListings) {
          const existing = aggregated.get(entry.listingId) || { views: 0, sales: 0 };
          aggregated.set(entry.listingId, {
            views: existing.views + entry.views,
            sales: existing.sales + entry.sales,
          });
        }
      }
    }

    return Array.from(aggregated.entries())
      .map(([listingId, data]) => ({ listingId, ...data }))
      .sort((a, b) => b.views - a.views)
      .slice(0, max);
  },

  /**
   * Registrar vista a un listing.
   */
  async recordView(listingId: string, sellerId: string, userId?: string): Promise<void> {
    await addDoc(collection(db, 'analytics_events'), {
      type: 'listing_view',
      listingId,
      sellerId,
      userId: userId || 'anonymous',
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Obtener resumen consolidado.
   */
  async getSummary(sellerId: string): Promise<{
    totalViews: number;
    totalTransactions: number;
    totalRevenue: number;
    avgConversionRate: number;
    avgOrderValue: number;
  }> {
    const stats = await this.getDailyStats(sellerId, 30);
    let totalViews = 0;
    let totalTransactions = 0;
    let totalRevenue = 0;
    let conversionDays = 0;
    let totalConversion = 0;

    for (const day of stats) {
      totalViews += day.views || 0;
      totalTransactions += day.transactions || 0;
      totalRevenue += day.revenue || 0;
      if (day.conversionRate > 0) {
        totalConversion += day.conversionRate;
        conversionDays++;
      }
    }

    return {
      totalViews,
      totalTransactions,
      totalRevenue,
      avgConversionRate: conversionDays > 0 ? totalConversion / conversionDays : 0,
      avgOrderValue: totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0,
    };
  },
};
