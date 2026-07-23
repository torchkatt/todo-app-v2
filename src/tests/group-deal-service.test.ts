/**
 * @file tests/group-deal-service.test.ts
 * @description Tests for groupDealService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/firebase', () => ({ db: {} }));

const store = new Map<string, any>();

vi.mock('firebase/firestore', () => {
  let docCounter = 0;
  let addCounter = 0;

  function colName(c: any): string {
    return typeof c === 'string' ? c : c?.name || 'unknown';
  }

  return {
    doc: vi.fn((_db: any, collectionOrName: any, id?: string) => {
      const name = colName(collectionOrName);
      return {
        collection: name,
        id: id || `doc_${++docCounter}`,
        _collectionName: name,
      };
    }),
    collection: vi.fn((_db: any, name: string) => ({ name })),
    setDoc: vi.fn(async (ref: any, data: any) => {
      store.set(`${ref.collection}/${ref.id}`, data);
    }),
    addDoc: vi.fn(async (_ref: any, data: any) => {
      const id = `add_${++addCounter}`;
      store.set(`group_deal_participants/${id}`, data);
      return { id };
    }),
    updateDoc: vi.fn(async (ref: any, data: any) => {
      const existing = store.get(`${ref.collection}/${ref.id}`) || {};
      store.set(`${ref.collection}/${ref.id}`, { ...existing, ...data });
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
        .filter(([k]) => k.startsWith('group_deals/') || k.startsWith('group_deal_participants/'))
        .map(([k, v]) => ({ id: k.split('/')[1], data: () => v }));
      return { docs: items, empty: items.length === 0, size: items.length };
    }),
    query: vi.fn((...args: any[]) => ({ args })),
    where: vi.fn((f: string, _op: string, _v: any) => ({ field: f })),
    orderBy: vi.fn((f: string, _d: string) => ({ field: f })),
    limit: vi.fn((n: number) => ({ limit: n })),
    Timestamp: { now: () => new Date() },
    serverTimestamp: () => new Date(),
  };
});

import { groupDealService } from '../services/groupDealService';

describe('groupDealService', () => {
  beforeEach(() => { store.clear(); });

  it('create: should create a group deal and auto-join creator', async () => {
    const deal = await groupDealService.create('listing_1', 'Producto X', 100_000, 'seller_1', 'user_1', 3);

    expect(deal.id).toBeDefined();
    expect(deal.status).toBe('ACTIVE');
    expect(deal.currentCount).toBe(1);
    expect(deal.discountPercent).toBe(10);
    expect(deal.groupPrice).toBe(90_000);
  });

  it('create: should calculate higher discount for larger groups', async () => {
    const deal = await groupDealService.create('listing_2', 'Producto Y', 100_000, 'seller_1', 'user_1', 10);
    expect(deal.discountPercent).toBe(40);
    expect(deal.groupPrice).toBe(60_000);
  });

  it('join: should increment count and auto-complete at threshold', async () => {
    // Manually seed a deal in the mock store to avoid doc/id mismatch
    const dealId = 'test_deal_1';
    store.set(`group_deals/${dealId}`, {
      id: dealId,
      listingId: 'listing_1',
      title: 'Test',
      originalPrice: 50_000,
      groupPrice: 45_000,
      discountPercent: 10,
      minParticipants: 3,
      maxParticipants: 6,
      currentCount: 1,
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 48 * 3600000).toISOString(),
      sellerId: 'seller_1',
      createdBy: 'user_1',
      createdAt: new Date().toISOString(),
    });

    const updated1 = await groupDealService.join(dealId, 'user_2');
    expect(updated1.currentCount).toBe(2);
    expect(updated1.status).toBe('ACTIVE');

    const updated2 = await groupDealService.join(dealId, 'user_3');
    expect(updated2.currentCount).toBe(3);
    expect(updated2.status).toBe('COMPLETED');
  });

  it('getDeal: should return null for non-existent deal', async () => {
    const result = await groupDealService.getDeal('nonexistent');
    expect(result).toBeNull();
  });

  it('getShareUrl: should generate correct URL', () => {
    const url = groupDealService.getShareUrl('deal_1', 'user_1');
    expect(url).toContain('group-deal/deal_1');
    expect(url).toContain('ref=user_1');
  });

  it('getShareText: should include product info and discount', () => {
    const deal: any = {
      id: 'deal_1',
      title: 'Producto X',
      originalPrice: 100_000,
      groupPrice: 80_000,
      discountPercent: 20,
      minParticipants: 5,
      currentCount: 2,
    };
    const text = groupDealService.getShareText(deal);
    expect(text).toContain('20% OFF');
    expect(text).toContain('Producto X');
    expect(text).toContain('Faltan 3 personas');
  });
});
