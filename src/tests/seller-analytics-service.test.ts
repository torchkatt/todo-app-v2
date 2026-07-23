/**
 * @file tests/seller-analytics-service.test.ts
 * @description Tests for sellerAnalyticsService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ANALYTICS_CONFIG } from '../config/constants';

vi.mock('../services/firebase', () => ({ db: {} }));

const store = new Map<string, any>();

vi.mock('firebase/firestore', () => {
  let addCounter = 0;
  function colName(c: any): string {
    return typeof c === 'string' ? c : c?.name || 'unknown';
  }
  return {
    doc: vi.fn((_db: any, collectionOrName: any, id?: string) => {
      const name = colName(collectionOrName);
      return { collection: name, id: id || `doc_${++addCounter}` };
    }),
    collection: vi.fn((_db: any, name: string) => ({ name })),
    addDoc: vi.fn(async (_ref: any, data: any) => {
      const id = `evt_${++addCounter}`;
      store.set(`analytics_events/${id}`, data);
      return { id };
    }),
    getDocs: vi.fn(async (_q: any) => {
      const items = Array.from(store.entries())
        .filter(([k]) => k.startsWith('seller_analytics/') || k.startsWith('analytics_events/'))
        .map(([k, v]) => ({ id: k.split('/')[1], data: () => v }));
      return { docs: items, empty: items.length === 0, size: items.length };
    }),
    query: vi.fn((...args: any[]) => ({ args })),
    where: vi.fn((field: string, _op: string, _value: any) => ({ field })),
    orderBy: vi.fn((field: string, _dir: string) => ({ field })),
    limit: vi.fn((n: number) => ({ limit: n })),
    Timestamp: { now: () => new Date() },
  };
});

import { sellerAnalyticsService } from '../services/sellerAnalyticsService';
import type { SellerAnalytics } from '../types';

// Helper to seed daily stats
function seedDailyStats(overrides: Partial<SellerAnalytics> & { id: string; sellerId: string; date: string }): void {
  const stat: any = {
    views: 100,
    uniqueVisitors: 50,
    listingViews: {},
    transactions: 5,
    revenue: 50000,
    conversionRate: 0.05,
    avgOrderValue: 10000,
    topListings: [],
    ...overrides,
  };
  store.set(`seller_analytics/${overrides.id}`, stat);
}

describe('sellerAnalyticsService', () => {
  beforeEach(() => {
    store.clear();
  });

  describe('getDailyStats', () => {
    it('should return analytics array for a seller', async () => {
      seedDailyStats({ id: 'stat_1', sellerId: 'seller_1', date: '2026-07-22', views: 200 });
      seedDailyStats({ id: 'stat_2', sellerId: 'seller_1', date: '2026-07-21', views: 150 });

      const stats = await sellerAnalyticsService.getDailyStats('seller_1', 30);
      expect(stats).toHaveLength(2);
      expect(stats[0].sellerId).toBe('seller_1');
    });

    it('should return empty array when no data', async () => {
      const stats = await sellerAnalyticsService.getDailyStats('seller_none', 30);
      expect(stats).toHaveLength(0);
    });
  });

  describe('getTopListings', () => {
    it('should aggregate top listings from daily stats', async () => {
      seedDailyStats({
        id: 'stat_1',
        sellerId: 'seller_1',
        date: '2026-07-22',
        topListings: [
          { listingId: 'listing_a', views: 50, sales: 3 },
          { listingId: 'listing_b', views: 30, sales: 1 },
        ],
      });
      seedDailyStats({
        id: 'stat_2',
        sellerId: 'seller_1',
        date: '2026-07-21',
        topListings: [
          { listingId: 'listing_a', views: 40, sales: 2 },
          { listingId: 'listing_c', views: 20, sales: 1 },
        ],
      });

      const top = await sellerAnalyticsService.getTopListings('seller_1');
      
      // listing_a should be first with 90 total views
      expect(top[0].listingId).toBe('listing_a');
      expect(top[0].views).toBe(90);
      expect(top[0].sales).toBe(5);
      
      // listing_b should be second with 30 views
      expect(top[1].listingId).toBe('listing_b');
      expect(top[1].views).toBe(30);
      
      // listing_c should be third with 20 views
      expect(top[2].listingId).toBe('listing_c');
    });

    it('should respect max parameter', async () => {
      seedDailyStats({
        id: 'stat_1',
        sellerId: 'seller_1',
        date: '2026-07-22',
        topListings: [
          { listingId: 'a', views: 100, sales: 5 },
          { listingId: 'b', views: 80, sales: 3 },
          { listingId: 'c', views: 60, sales: 2 },
        ],
      });

      const top = await sellerAnalyticsService.getTopListings('seller_1', 2);
      expect(top).toHaveLength(2);
    });

    it('should return empty array when no stats exist', async () => {
      const top = await sellerAnalyticsService.getTopListings('seller_none');
      expect(top).toHaveLength(0);
    });
  });

  describe('recordView', () => {
    it('should create analytics event in analytics_events collection', async () => {
      await sellerAnalyticsService.recordView('listing_1', 'seller_1', 'user_1');

      // Verify event was stored
      const keys = Array.from(store.keys()).filter(k => k.startsWith('analytics_events/'));
      expect(keys).toHaveLength(1);

      const event = store.get(keys[0]);
      expect(event.type).toBe('listing_view');
      expect(event.listingId).toBe('listing_1');
      expect(event.sellerId).toBe('seller_1');
      expect(event.userId).toBe('user_1');
      expect(event.date).toBeDefined();
      expect(event.timestamp).toBeDefined();
    });

    it('should use anonymous userId when not provided', async () => {
      await sellerAnalyticsService.recordView('listing_1', 'seller_1');

      const keys = Array.from(store.keys()).filter(k => k.startsWith('analytics_events/'));
      const event = store.get(keys[0]);
      expect(event.userId).toBe('anonymous');
    });
  });

  describe('getSummary', () => {
    it('should calculate totals correctly', async () => {
      seedDailyStats({
        id: 'stat_1', sellerId: 'seller_1', date: '2026-07-22',
        views: 200, transactions: 10, revenue: 100000, conversionRate: 0.05,
      });
      seedDailyStats({
        id: 'stat_2', sellerId: 'seller_1', date: '2026-07-21',
        views: 150, transactions: 8, revenue: 80000, conversionRate: 0.04,
      });

      const summary = await sellerAnalyticsService.getSummary('seller_1');
      expect(summary.totalViews).toBe(350);
      expect(summary.totalTransactions).toBe(18);
      expect(summary.totalRevenue).toBe(180000);
      expect(summary.avgConversionRate).toBeCloseTo(0.045);
      expect(summary.avgOrderValue).toBe(10000); // 180000 / 18 = 10000
    });

    it('should return zeros when no data', async () => {
      const summary = await sellerAnalyticsService.getSummary('seller_none');
      expect(summary.totalViews).toBe(0);
      expect(summary.totalTransactions).toBe(0);
      expect(summary.totalRevenue).toBe(0);
      expect(summary.avgConversionRate).toBe(0);
      expect(summary.avgOrderValue).toBe(0);
    });
  });
});
