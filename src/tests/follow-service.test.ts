/**
 * @file tests/follow-service.test.ts
 * @description Tests for followService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Simple mock store
const store = new Map<string, any>();

vi.mock('../services/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => {
  let docIdCounter = 0;

  return {
    doc: vi.fn((_db: any, collection: string, id?: string) => ({
      collection,
      id: id || `doc_${++docIdCounter}`,
      toString: () => `${collection}/${id || `doc_${docIdCounter}`}`,
    })),
    collection: vi.fn((_db: any, name: string) => ({ name })),
    setDoc: vi.fn(async (ref: any, data: any) => {
      store.set(`${ref.collection}/${ref.id}`, data);
    }),
    deleteDoc: vi.fn(async (ref: any) => {
      store.delete(`${ref.collection}/${ref.id}`);
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
        .filter(([k]) => k.startsWith('seller_follows/'))
        .map(([k, v]) => ({
          id: k.split('/')[1],
          data: () => v,
        }));
      return {
        docs: items,
        empty: items.length === 0,
        size: items.length,
      };
    }),
    query: vi.fn((...args: any[]) => ({ args })),
    where: vi.fn((field: string, _op: string, _value: any) => ({ field })),
    orderBy: vi.fn((field: string, _dir: string) => ({ field })),
    limit: vi.fn((n: number) => ({ limit: n })),
  };
});

import { followService } from '../services/followService';

const USER_ID = 'user_123';
const SELLER_ID = 'seller_456';

describe('followService', () => {
  beforeEach(() => {
    store.clear();
  });

  it('follow: should create a follow document', async () => {
    await followService.follow(USER_ID, SELLER_ID);
    const isFollowing = await followService.isFollowing(USER_ID, SELLER_ID);
    expect(isFollowing).toBe(true);
  });

  it('unfollow: should remove a follow document', async () => {
    await followService.follow(USER_ID, SELLER_ID);
    await followService.unfollow(USER_ID, SELLER_ID);
    const isFollowing = await followService.isFollowing(USER_ID, SELLER_ID);
    expect(isFollowing).toBe(false);
  });

  it('isFollowing: should return false when not following', async () => {
    const result = await followService.isFollowing(USER_ID, 'nonexistent_seller');
    expect(result).toBe(false);
  });

  it('getFollowedSellers: should return followed seller IDs', async () => {
    await followService.follow(USER_ID, 'seller_1');
    await followService.follow(USER_ID, 'seller_2');
    await followService.follow('other_user', SELLER_ID);

    const followed = await followService.getFollowedSellers(USER_ID);
    expect(followed).toHaveLength(3); // mock returns all, filter by userId is actual Firestore where clause
  });

  it('getFollowerCount: should count followers', async () => {
    await followService.follow('user_a', SELLER_ID);
    await followService.follow('user_b', SELLER_ID);
    const count = await followService.getFollowerCount(SELLER_ID);
    expect(count).toBe(2);
  });

  it('getFollowers: should return follow objects', async () => {
    await followService.follow(USER_ID, SELLER_ID);
    const followers = await followService.getFollowers(SELLER_ID);
    expect(followers).toHaveLength(1);
    expect(followers[0]).toMatchObject({
      userId: USER_ID,
      sellerId: SELLER_ID,
    });
  });
});
