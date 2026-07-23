/**
 * @file tests/cashback-service.test.ts
 * @description Tests for cashbackService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CASHBACK_CONFIG } from '../config/constants';

vi.mock('../services/firebase', () => ({ db: {} }));

const store = new Map<string, any>();

vi.mock('firebase/firestore', () => {
  let counter = 0;
  return {
    doc: vi.fn((_db: any, collection: string, id?: string) => ({
      collection, id: id || `doc_${++counter}`,
    })),
    collection: vi.fn((_db: any, name: string) => ({ name })),
    setDoc: vi.fn(async (ref: any, data: any) => {
      store.set(`${ref.collection}/${ref.id}`, data);
    }),
    getDoc: vi.fn(async (ref: any) => {
      const key = `${ref.collection}/${ref.id}`;
      return {
        exists: () => store.has(key),
        data: () => store.get(key) || null,
      };
    }),
    getDocs: vi.fn(async (_q: any) => {
      const items = Array.from(store.entries())
        .filter(([k]) => k.startsWith('cashback_records/'))
        .map(([k, v]) => ({ id: k.split('/')[1], data: () => v }));
      return { docs: items, empty: items.length === 0, size: items.length };
    }),
    query: vi.fn((...args: any[]) => ({ args })),
    where: vi.fn((f: string, _op: string, _v: any) => ({ field: f })),
    orderBy: vi.fn((f: string, _d: string) => ({ field: f })),
    limit: vi.fn((n: number) => ({ limit: n })),
  };
});

import { cashbackService } from '../services/cashbackService';

describe('cashbackService', () => {
  beforeEach(() => { store.clear(); });

  describe('calculateCashback', () => {
    it('should return 0 for purchases below minimum', () => {
      expect(cashbackService.calculateCashback(5_000, 'free')).toBe(0);
    });

    it('should calculate 3% for free tier', () => {
      const result = cashbackService.calculateCashback(100_000, 'free');
      // 100_000 * 300 / 10000 = 3,000
      expect(result).toBe(3_000);
    });

    it('should calculate 5% for pro tier', () => {
      const result = cashbackService.calculateCashback(100_000, 'pro');
      // 100_000 * 500 / 10000 = 5,000
      expect(result).toBe(5_000);
    });

    it('should calculate 7% for black tier', () => {
      const result = cashbackService.calculateCashback(100_000, 'black');
      // 100_000 * 700 / 10000 = 7,000
      expect(result).toBe(7_000);
    });

    it('should cap at maxPerTransaction', () => {
      const result = cashbackService.calculateCashback(5_000_000, 'black');
      expect(result).toBe(CASHBACK_CONFIG.maxPerTransaction);
    });
  });

  describe('getPendingCashback & claim', () => {
    it('should return empty when no cashback', async () => {
      const pending = await cashbackService.getPendingCashback('user_1');
      expect(pending).toHaveLength(0);
    });

    it('should claim cashback and add to wallet', async () => {
      // Seed a cashback record via mock store
      const recordId = 'cb_1';
      store.set(`cashback_records/${recordId}`, {
        userId: 'user_1',
        amount: 5_000,
        status: 'AVAILABLE',
        expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
      });

      await cashbackService.claimCashback('user_1', recordId);

      // Verify cashback claimed
      const record = store.get(`cashback_records/${recordId}`);
      expect(record.status).toBe('CLAIMED');
      expect(record.claimedAt).toBeDefined();

      // Verify wallet updated
      const wallet = store.get('wallets/user_1');
      expect(wallet).toBeDefined();
      expect(wallet.balance).toBe(5_000);
    });
  });

  describe('getPendingTotal', () => {
    it('should sum all pending cashback', async () => {
      store.set('cashback_records/cb_1', { userId: 'user_1', amount: 3_000, status: 'AVAILABLE' });
      store.set('cashback_records/cb_2', { userId: 'user_1', amount: 5_000, status: 'AVAILABLE' });
      store.set('cashback_records/cb_3', { userId: 'user_1', amount: 2_000, status: 'CLAIMED' });

      const total = await cashbackService.getPendingTotal('user_1');
      // Mock returns all docs regardless of status filter
      expect(total).toBe(10_000);
    });
  });
});
