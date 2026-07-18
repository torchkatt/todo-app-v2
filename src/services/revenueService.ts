import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import type { Transaction } from '../types';

// ─── Types ───
export interface RevenueSummary {
  totalRevenue: number;
  totalTransactions: number;
  totalCommission: number;
  sellerEarnings: number;
  avgOrderValue: number;
  periodStart: string;
  periodEnd: string;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
  commission: number;
  transactions: number;
}

export interface RevenueBySeller {
  sellerId: string;
  sellerName: string;
  revenue: number;
  commission: number;
  transactions: number;
}

export interface RevenueByPlan {
  planId: string;
  planName: string;
  sellerCount: number;
  revenue: number;
  commission: number;
}

export interface RevenueDashboardData {
  summary: RevenueSummary;
  byDay: RevenueByDay[];
  bySeller: RevenueBySeller[];
  byPlan: RevenueByPlan[];
}

// ─── Service ───
export const revenueService = {
  /**
   * Fetch all transaction data for a date range.
   * For production, use Cloud Functions to aggregate on the server side.
   */
  async getDashboardData(
    startDate: Date,
    endDate: Date,
  ): Promise<RevenueDashboardData> {
    const start = Timestamp.fromDate(startDate);
    const end = Timestamp.fromDate(endDate);

    const q = query(
      collection(db, 'transactions'),
      where('createdAt', '>=', start.toDate().toISOString()),
      where('createdAt', '<=', end.toDate().toISOString()),
      orderBy('createdAt', 'desc'),
      limit(1000),
    );

    const snap = await getDocs(q);
    const transactions = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[];

    // Only count completed transactions
    const completed = transactions.filter(
      t => t.status === 'DELIVERED' || t.status === 'ATTENDED',
    );

    return this.aggregateTransactions(completed, startDate, endDate);
  },

  aggregateTransactions(
    transactions: Transaction[],
    startDate: Date,
    endDate: Date,
  ): RevenueDashboardData {
    // Summary
    let totalRevenue = 0;
    let totalCommission = 0;
    let sellerEarnings = 0;

    for (const t of transactions) {
      totalRevenue += t.totalAmount || 0;
      totalCommission += t.platformFee || 0;
      sellerEarnings += t.sellerEarnings || 0;
    }

    const summary: RevenueSummary = {
      totalRevenue,
      totalTransactions: transactions.length,
      totalCommission,
      sellerEarnings,
      avgOrderValue: transactions.length > 0 ? totalRevenue / transactions.length : 0,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
    };

    // By Day
    const dayMap = new Map<string, { revenue: number; commission: number; transactions: number }>();
    for (const t of transactions) {
      const day = (t.createdAt || '').split('T')[0];
      if (!day) continue;
      const existing = dayMap.get(day) || { revenue: 0, commission: 0, transactions: 0 };
      existing.revenue += t.totalAmount || 0;
      existing.commission += t.platformFee || 0;
      existing.transactions += 1;
      dayMap.set(day, existing);
    }
    const byDay: RevenueByDay[] = Array.from(dayMap.entries())
      .map(([date, d]) => ({ date, ...d }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // By Seller
    const sellerMap = new Map<string, RevenueBySeller>();
    for (const t of transactions) {
      const existing = sellerMap.get(t.sellerId) || {
        sellerId: t.sellerId,
        sellerName: t.sellerId,
        revenue: 0,
        commission: 0,
        transactions: 0,
      };
      existing.revenue += t.totalAmount || 0;
      existing.commission += t.platformFee || 0;
      existing.transactions += 1;
      sellerMap.set(t.sellerId, existing);
    }
    const bySeller = Array.from(sellerMap.values()).sort((a, b) => b.revenue - a.revenue);

    // By Plan (simplified — actual plan data would come from seller profiles)
    const byPlan: RevenueByPlan[] = [];

    return { summary, byDay, bySeller, byPlan };
  },

  // ─── Convenience helpers ───
  async getLast7Days(): Promise<RevenueDashboardData> {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return this.getDashboardData(start, end);
  },

  async getLast30Days(): Promise<RevenueDashboardData> {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return this.getDashboardData(start, end);
  },

  async getThisMonth(): Promise<RevenueDashboardData> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return this.getDashboardData(start, end);
  },
};
