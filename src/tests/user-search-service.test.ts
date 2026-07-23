/**
 * @file tests/user-search-service.test.ts
 * @description Tests for userSearchService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/firebase', () => ({ db: {} }));

const store = new Map<string, any>();

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: any, collection: string, id: string) => ({
    collection,
    id,
  })),
  collection: vi.fn((_db: any, name: string) => ({ name })),
  getDoc: vi.fn(async (ref: any) => {
    const key = `${ref.collection}/${ref.id}`;
    return {
      exists: () => store.has(key),
      data: () => store.get(key) || null,
      id: ref.id,
    };
  }),
  getDocs: vi.fn(async (_q: any) => {
    // Return all users from the store that match collection('users')
    const items = Array.from(store.entries())
      .filter(([k]) => k.startsWith('users/'))
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
}));

import { userSearchService } from '../services/userSearchService';
import type { User } from '../types';

// Helper to seed a user into the mock store
function seedUser(overrides: Partial<User> & { id: string }): User {
  const user: any = {
    fullName: 'Default User',
    email: 'default@test.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    role: 'CUSTOMER',
    ...overrides,
  };
  store.set(`users/${user.id}`, user);
  return user as User;
}

describe('userSearchService', () => {
  beforeEach(() => {
    store.clear();
  });

  describe('search', () => {
    it('should return users matching search query by name', async () => {
      seedUser({ id: 'u1', fullName: 'Alice Johnson', email: 'alice@test.com' });
      seedUser({ id: 'u2', fullName: 'Bob Smith', email: 'bob@test.com' });
      seedUser({ id: 'u3', fullName: 'Charlie Brown', email: 'charlie@test.com' });

      const results = await userSearchService.search('alice', 'currentUser');
      expect(results).toHaveLength(1);
      expect(results[0].fullName).toBe('Alice Johnson');
    });

    it('should return users matching search query by email', async () => {
      seedUser({ id: 'u1', fullName: 'Alice Johnson', email: 'alice@test.com' });
      seedUser({ id: 'u2', fullName: 'Bob Smith', email: 'bob@test.com' });

      const results = await userSearchService.search('bob@test', 'currentUser');
      expect(results).toHaveLength(1);
      expect(results[0].email).toBe('bob@test.com');
    });

    it('should exclude the current user from results', async () => {
      seedUser({ id: 'currentUser', fullName: 'Myself', email: 'me@test.com' });
      seedUser({ id: 'u1', fullName: 'Myself Copy', email: 'copy@test.com' });

      const results = await userSearchService.search('myself', 'currentUser');
      // Should only return u1, not currentUser
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('u1');
    });

    it('should return empty array when no matches found', async () => {
      seedUser({ id: 'u1', fullName: 'Alice', email: 'alice@test.com' });

      const results = await userSearchService.search('xyz_nonexistent', 'currentUser');
      expect(results).toHaveLength(0);
    });

    it('should respect max parameter and limit results', async () => {
      for (let i = 0; i < 10; i++) {
        seedUser({ id: `u${i}`, fullName: `Test User ${i}`, email: `test${i}@test.com` });
      }

      const results = await userSearchService.search('Test', 'currentUser', 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      seedUser({ id: 'u1', fullName: 'Alice', email: 'alice@test.com' });

      const user = await userSearchService.getUserById('u1');
      expect(user).toBeDefined();
      expect(user!.id).toBe('u1');
      expect(user!.fullName).toBe('Alice');
    });

    it('should return null when user not found', async () => {
      const user = await userSearchService.getUserById('nonexistent');
      expect(user).toBeNull();
    });
  });
});
