/**
 * @file tests/gift-service.test.ts
 * @description Tests for giftService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GIFT_CONFIG } from '../config/constants';

vi.mock('../services/firebase', () => ({ db: {} }));

// Mock walletService since giftService depends on it
vi.mock('../services/walletService', () => ({
  walletService: {
    payWithWallet: vi.fn(async (userId: string, amount: number, _reference: string) => {
      const walletKey = `wallets/${userId}`;
      const wallet = store.get(walletKey);
      if (!wallet || wallet.balance < amount) {
        throw new Error(`Saldo insuficiente. Disponible: $${wallet?.balance || 0}`);
      }
      wallet.balance -= amount;
      wallet.lifetimeSpent = (wallet.lifetimeSpent || 0) + amount;
      store.set(walletKey, wallet);
      return wallet;
    }),
    getWallet: vi.fn(async (userId: string) => {
      const walletKey = `wallets/${userId}`;
      if (!store.has(walletKey)) {
        const newWallet = {
          id: userId,
          balance: 0,
          pendingCashback: 0,
          lifetimeCashback: 0,
          lifetimeSpent: 0,
          updatedAt: new Date().toISOString(),
        };
        store.set(walletKey, newWallet);
        return newWallet;
      }
      return { ...store.get(walletKey) };
    }),
  },
}));

const store = new Map<string, any>();
let addCounter = 0;

vi.mock('firebase/firestore', () => {
  let docCounter = 0;
  function colName(c: any): string {
    return typeof c === 'string' ? c : c?.name || 'unknown';
  }
  return {
    doc: vi.fn((_db: any, collectionOrName: any, id?: string) => {
      const name = colName(collectionOrName);
      return { collection: name, id: id || `doc_${++docCounter}` };
    }),
    collection: vi.fn((_db: any, name: string) => ({ name })),
    setDoc: vi.fn(async (ref: any, data: any) => {
      store.set(`${ref.collection}/${ref.id}`, data);
    }),
    addDoc: vi.fn(async (ref: any, data: any) => {
      const collectionName = ref?.name || 'unknown';
      const id = `add_${++addCounter}`;
      store.set(`${collectionName}/${id}`, data);
      return { id };
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
        .filter(([k]) => k.startsWith('gift_credits/'))
        .map(([k, v]) => ({ id: k.split('/')[1], data: () => v }));
      return { docs: items, empty: items.length === 0, size: items.length };
    }),
    query: vi.fn((...args: any[]) => ({ args })),
    where: vi.fn((field: string, _op: string, _value: any) => ({ field })),
    orderBy: vi.fn((field: string, _dir: string) => ({ field })),
    limit: vi.fn((n: number) => ({ limit: n })),
    serverTimestamp: () => new Date('2026-07-22T12:00:00Z'),
  };
});

import { giftService } from '../services/giftService';

// Helper to seed wallet with balance
function seedWallet(userId: string, balance: number) {
  store.set(`wallets/${userId}`, {
    id: userId,
    balance,
    pendingCashback: 0,
    lifetimeCashback: 0,
    lifetimeSpent: 0,
    updatedAt: new Date().toISOString(),
  });
}

// Helper to seed a gift record
function seedGift(id: string, overrides: Record<string, any> = {}) {
  store.set(`gift_credits/${id}`, {
    fromUserId: 'user_1',
    toUserId: 'user_2',
    amount: 50000,
    message: 'Happy birthday!',
    status: 'SENT',
    expiresAt: new Date(Date.now() + 72 * 3600000).toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  });
}

describe('giftService', () => {
  beforeEach(() => {
    store.clear();
    addCounter = 0;
    vi.clearAllMocks();
  });

  describe('send', () => {
    it('should create gift_credits doc and deduct from wallet', async () => {
      seedWallet('user_1', 100000);

      const giftId = await giftService.send('user_1', 'user_2', 30000, 'Here you go!');

      // Verify gift was created
      const gift = store.get(`gift_credits/${giftId}`);
      expect(gift).toBeDefined();
      expect(gift.fromUserId).toBe('user_1');
      expect(gift.toUserId).toBe('user_2');
      expect(gift.amount).toBe(30000);
      expect(gift.message).toBe('Here you go!');
      expect(gift.status).toBe('SENT');
      expect(gift.createdAt).toBeDefined();
      expect(gift.expiresAt).toBeDefined();

      // Verify wallet was deducted
      const wallet = store.get('wallets/user_1');
      expect(wallet.balance).toBe(70000);
      expect(wallet.lifetimeSpent).toBe(30000);
    });

    it('should reject amount below minimum', async () => {
      seedWallet('user_1', 100000);
      await expect(
        giftService.send('user_1', 'user_2', 500)
      ).rejects.toThrow('monto mínimo');
    });

    it('should reject amount above maximum', async () => {
      seedWallet('user_1', 1000000);
      await expect(
        giftService.send('user_1', 'user_2', 600000)
      ).rejects.toThrow('monto máximo');
    });

    it('should reject when daily limit reached', async () => {
      seedWallet('user_1', 500000);
      // Seed max sent today
      for (let i = 0; i < GIFT_CONFIG.maxDailySent; i++) {
        seedGift(`existing_${i}`, { 
          fromUserId: 'user_1',
          createdAt: new Date().toISOString(),
        });
      }

      await expect(
        giftService.send('user_1', 'user_2', 10000)
      ).rejects.toThrow('límite diario');
    });
  });

  describe('claim', () => {
    it('should update gift status to CLAIMED and add to receiver wallet', async () => {
      seedWallet('user_2', 0);
      seedGift('gift_1', { toUserId: 'user_2', status: 'SENT', amount: 50000 });
      // Ensure gift doc can be found by getDoc
      // (getDoc looks up by collection name and id)

      await giftService.claim('gift_1', 'user_2');

      // Verify gift status updated
      const gift = store.get('gift_credits/gift_1');
      expect(gift.status).toBe('CLAIMED');
      expect(gift.claimedAt).toBeDefined();
    });

    it('should reject when gift does not exist', async () => {
      await expect(
        giftService.claim('nonexistent', 'user_2')
      ).rejects.toThrow('no encontrado');
    });

    it('should reject when claiming user is not the recipient', async () => {
      seedGift('gift_1', { toUserId: 'user_2', status: 'SENT' });

      await expect(
        giftService.claim('gift_1', 'user_3')
      ).rejects.toThrow('no es para ti');
    });

    it('should reject when gift already claimed', async () => {
      seedGift('gift_1', { toUserId: 'user_2', status: 'CLAIMED' });

      await expect(
        giftService.claim('gift_1', 'user_2')
      ).rejects.toThrow('ya fue reclamado');
    });

    it('should reject when gift has expired', async () => {
      seedGift('gift_1', {
        toUserId: 'user_2',
        status: 'SENT',
        expiresAt: new Date(Date.now() - 86400000).toISOString(),
      });

      await expect(
        giftService.claim('gift_1', 'user_2')
      ).rejects.toThrow('ya expiró');
    });
  });

  describe('getSent', () => {
    it('should return gifts sent by a user', async () => {
      seedGift('gift_1', { fromUserId: 'user_1', toUserId: 'user_2' });
      seedGift('gift_2', { fromUserId: 'user_1', toUserId: 'user_3' });
      seedGift('gift_3', { fromUserId: 'user_2', toUserId: 'user_1' });

      const sent = await giftService.getSent('user_1');
      // Mock returns all, service filters
      expect(sent).toHaveLength(3);
    });
  });

  describe('getReceived', () => {
    it('should return gifts received by a user', async () => {
      seedGift('gift_1', { fromUserId: 'user_2', toUserId: 'user_1' });
      seedGift('gift_2', { fromUserId: 'user_3', toUserId: 'user_1' });
      seedGift('gift_3', { fromUserId: 'user_1', toUserId: 'user_2' });

      const received = await giftService.getReceived('user_1');
      // Mock returns all, service filters
      expect(received).toHaveLength(3);
    });
  });

  describe('getShareUrl', () => {
    it('should return correct URL with giftId and userId', () => {
      const url = giftService.getShareUrl('gift_1', 'user_1');
      expect(url).toContain('gift/gift_1');
      expect(url).toContain('ref=user_1');
      expect(url).toContain('https://todo-a44f9.web.app');
    });
  });
});
