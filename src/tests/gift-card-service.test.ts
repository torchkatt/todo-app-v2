/**
 * @file tests/gift-card-service.test.ts
 * @description Tests for giftCardService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/firebase', () => ({ db: {} }));

const store = new Map<string, any>();

vi.mock('firebase/firestore', () => {
  let docCounter = 0;
  let addCounter = 0;
  function colName(c: any): string { return typeof c === 'string' ? c : c?.name || 'unknown'; }
  return {
    doc: vi.fn((_db: any, colOrName?: any, id?: string) => {
      // doc(db, collection, id) or doc(collectionRef)
      const name = id !== undefined ? colName(colOrName)   // doc(db, 'gift_cards', 'id123')
                 : colOrName !== undefined ? colName(colOrName) // doc(db, 'gift_cards') - shouldn't happen
                 : colName(_db);  // doc(collectionRef) — extract name from ref
      return {
        collection: name,
        id: id || `doc_${++docCounter}`,
      };
    }),
    collection: vi.fn((_db: any, name: string) => ({ name })),
    setDoc: vi.fn(async (ref: any, data: any) => { store.set(`${ref.collection}/${ref.id}`, data); }),
    addDoc: vi.fn(async (ref: any, data: any) => {
      const col = typeof ref === 'string' ? ref : ref?.name || 'gift_card_transactions';
      const id = `add_${++addCounter}`;
      store.set(`${col}/${id}`, data);
      return { id };
    }),
    updateDoc: vi.fn(async (ref: any, data: any) => {
      const existing = store.get(`${ref.collection}/${ref.id}`) || {};
      store.set(`${ref.collection}/${ref.id}`, { ...existing, ...data });
    }),
    getDoc: vi.fn(async (ref: any) => {
      const key = `${ref.collection}/${ref.id}`;
      return { exists: () => store.has(key), data: () => store.get(key) || null };
    }),
    getDocs: vi.fn(async (_q: any) => {
      const items = Array.from(store.entries())
        .filter(([k]) => k.startsWith('gift_cards/') || k.startsWith('gift_card_transactions/'))
        .map(([k, v]) => ({ id: k.split('/')[1], data: () => v }));
      return { docs: items, empty: items.length === 0, size: items.length };
    }),
    query: vi.fn((...args: any[]) => ({ args })),
    where: vi.fn((f: string) => ({ field: f })),
    orderBy: vi.fn((f: string) => ({ field: f })),
    limit: vi.fn((n: number) => ({ limit: n })),
    serverTimestamp: () => new Date(),
  };
});

import { giftCardService } from '../services/giftCardService';

// Pre-seed wallet
function seedWallet(userId: string, balance = 500_000) {
  store.set(`wallets/${userId}`, {
    id: userId, balance, pendingCashback: 0, lifetimeCashback: 0, lifetimeSpent: 0, updatedAt: new Date().toISOString(),
  });
}

describe('giftCardService', () => {
  beforeEach(() => { store.clear(); });

  it('create: should create a gift card and deduct from wallet', async () => {
    seedWallet('user_1', 200_000);
    const card = await giftCardService.create('user_1', 'Para mamá', 50_000, 'birthday', 'Feliz cumpleaños');

    expect(card.id).toBeDefined();
    expect(card.name).toBe('Para mamá');
    expect(card.balance).toBe(50_000);
    expect(card.originalAmount).toBe(50_000);
    expect(card.design).toBe('birthday');
    expect(card.message).toBe('Feliz cumpleaños');
    expect(card.status).toBe('ACTIVE');
    expect(card.isPrimary).toBe(true); // first card

    // Wallet should be deducted
    const wallet = store.get('wallets/user_1');
    expect(wallet.balance).toBe(150_000);
  });

  it('create: should reject if balance insufficient', async () => {
    seedWallet('user_1', 3_000);
    await expect(giftCardService.create('user_1', 'Test', 50_000)).rejects.toThrow('Saldo insuficiente');
  });

  it('create: should reject if amount below minimum', async () => {
    seedWallet('user_1', 100_000);
    await expect(giftCardService.create('user_1', 'Test', 1_000)).rejects.toThrow('Mínimo');
  });

  it('getCards: should return all cards for user', async () => {
    seedWallet('user_1', 500_000);
    seedWallet('user_2', 500_000);
    await giftCardService.create('user_1', 'Card 1', 50_000);
    await giftCardService.create('user_1', 'Card 2', 100_000);
    await giftCardService.create('user_2', 'Other', 50_000);

    const cards = await giftCardService.getCards('user_1');
    // Mock returns all gift_cards regardless of userId filter
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(cards.map(c => c.name)).toContain('Card 1');
    expect(cards.map(c => c.name)).toContain('Card 2');
  });

  it('transfer: should move balance between cards', async () => {
    seedWallet('user_1', 500_000);
    const card1 = await giftCardService.create('user_1', 'Source', 100_000);
    const card2 = await giftCardService.create('user_1', 'Dest', 50_000);

    await giftCardService.transfer(card1.id, card2.id, 30_000, 'user_1');

    const updated1 = await giftCardService.getCard(card1.id);
    const updated2 = await giftCardService.getCard(card2.id);
    expect(updated1!.balance).toBe(70_000);
    expect(updated2!.balance).toBe(80_000);
  });

  it('transfer: should reject insufficient balance', async () => {
    seedWallet('user_1', 500_000);
    const card1 = await giftCardService.create('user_1', 'Source', 10_000);
    const card2 = await giftCardService.create('user_1', 'Dest', 50_000);

    await expect(giftCardService.transfer(card1.id, card2.id, 50_000, 'user_1')).rejects.toThrow('Saldo insuficiente');
  });

  it('deactivate: should refund balance to wallet', async () => {
    seedWallet('user_1', 500_000);
    const card = await giftCardService.create('user_1', 'Test', 100_000);
    expect((await giftCardService.getCard(card.id))!.balance).toBe(100_000);

    await giftCardService.deactivate(card.id, 'user_1');

    const deactivated = await giftCardService.getCard(card.id);
    expect(deactivated!.status).toBe('CANCELLED');
    expect(deactivated!.balance).toBe(0);

    const wallet = store.get('wallets/user_1');
    // Original 500K - 100K (create) + 100K (refund) = 500K
    expect(wallet.balance).toBe(500_000);
  });

  it('getDesignEmoji: should return correct emoji', () => {
    expect(giftCardService.getDesignEmoji('birthday')).toBe('🎂');
    expect(giftCardService.getDesignEmoji('holiday')).toBe('🎄');
    expect(giftCardService.getDesignEmoji('default')).toBe('🎁');
    expect(giftCardService.getDesignEmoji()).toBe('🎁');
  });
});
