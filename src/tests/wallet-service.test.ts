/**
 * @file tests/wallet-service.test.ts
 * @description Tests for walletService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WALLET_CONFIG } from '../config/constants';

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
      return { collection: name, id: id || name === 'wallets' ? id || 'some_id' : `doc_${addCounter}` };
    }),
    collection: vi.fn((_db: any, name: string) => ({ name })),
    setDoc: vi.fn(async (ref: any, data: any) => {
      store.set(`${ref.collection}/${ref.id}`, data);
    }),
    addDoc: vi.fn(async (_ref: any, data: any) => {
      const id = `tx_${++addCounter}`;
      store.set(`wallet_transactions/${id}`, data);
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
        .filter(([k]) => k.startsWith('wallet_transactions/'))
        .map(([k, v]) => ({ id: k.split('/')[1], data: () => v }));
      return { docs: items, empty: items.length === 0, size: items.length };
    }),
    query: vi.fn((...args: any[]) => ({ args })),
    where: vi.fn((f: string, _op: string, _v: any) => ({ field: f })),
    orderBy: vi.fn((f: string, _d: string) => ({ field: f })),
    limit: vi.fn((n: number) => ({ limit: n })),
  };
});

import { walletService } from '../services/walletService';

describe('walletService', () => {
  beforeEach(() => { store.clear(); });

  it('getWallet: should create wallet with 0 balance if not exists', async () => {
    const wallet = await walletService.getWallet('user_1');
    expect(wallet.id).toBe('user_1');
    expect(wallet.balance).toBe(0);
    expect(wallet.lifetimeCashback).toBe(0);
  });

  it('getWallet: should return existing wallet', async () => {
    store.set('wallets/user_1', { id: 'user_1', balance: 50_000, pendingCashback: 0, lifetimeCashback: 0, lifetimeSpent: 0, updatedAt: new Date().toISOString() });
    const wallet = await walletService.getWallet('user_1');
    expect(wallet.balance).toBe(50_000);
  });

  it('topUp: should add balance', async () => {
    const wallet = await walletService.topUp('user_1', 100_000);
    expect(wallet.balance).toBe(100_000);
  });

  it('topUp: should reject below minimum', async () => {
    await expect(walletService.topUp('user_1', 1_000)).rejects.toThrow();
  });

  it('topUp: should reject above maximum', async () => {
    await expect(walletService.topUp('user_1', 10_000_000)).rejects.toThrow();
  });

  it('payWithWallet: should deduct balance', async () => {
    store.set('wallets/user_1', { id: 'user_1', balance: 100_000, pendingCashback: 0, lifetimeCashback: 0, lifetimeSpent: 0, updatedAt: new Date().toISOString() });
    const wallet = await walletService.payWithWallet('user_1', 30_000, 'tx_1');
    expect(wallet.balance).toBe(70_000);
  });

  it('payWithWallet: should reject insufficient balance', async () => {
    store.set('wallets/user_1', { id: 'user_1', balance: 10_000, pendingCashback: 0, lifetimeCashback: 0, lifetimeSpent: 0, updatedAt: new Date().toISOString() });
    await expect(walletService.payWithWallet('user_1', 100_000, 'tx_1')).rejects.toThrow('Saldo insuficiente');
  });

  it('getBalance: should return current balance', async () => {
    store.set('wallets/user_1', { id: 'user_1', balance: 75_000, pendingCashback: 0, lifetimeCashback: 0, lifetimeSpent: 0, updatedAt: new Date().toISOString() });
    const balance = await walletService.getBalance('user_1');
    expect(balance).toBe(75_000);
  });
});
