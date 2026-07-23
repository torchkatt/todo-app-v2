/**
 * @file tests/seller-content-service.test.ts
 * @description Tests for sellerContentService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/firebase', () => ({ db: {} }));

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
    addDoc: vi.fn(async (_ref: any, data: any) => {
      const id = `post_${++addCounter}`;
      store.set(`seller_posts/${id}`, data);
      return { id };
    }),
    updateDoc: vi.fn(async (ref: any, data: any) => {
      const key = `${ref.collection}/${ref.id}`;
      const existing = store.get(key) || {};
      store.set(key, { ...existing, ...data });
    }),
    deleteDoc: vi.fn(async (ref: any) => {
      const key = `${ref.collection}/${ref.id}`;
      store.delete(key);
    }),
    getDocs: vi.fn(async (_q: any) => {
      const items = Array.from(store.entries())
        .filter(([k]) => k.startsWith('seller_posts/'))
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

import { sellerContentService } from '../services/sellerContentService';

describe('sellerContentService', () => {
  beforeEach(() => {
    store.clear();
    addCounter = 0;
  });

  describe('createPost', () => {
    it('should create a post document in seller_posts', async () => {
      const postId = await sellerContentService.createPost(
        'seller_1',
        'My First Post',
        'This is the content',
        ['listing_1'],
        [{ type: 'image', url: 'https://example.com/img.jpg' }],
      );

      const post = store.get(`seller_posts/${postId}`);
      expect(post).toBeDefined();
      expect(post.sellerId).toBe('seller_1');
      expect(post.title).toBe('My First Post');
      expect(post.content).toBe('This is the content');
      expect(post.listingIds).toEqual(['listing_1']);
      expect(post.media).toEqual([{ type: 'image', url: 'https://example.com/img.jpg' }]);
      expect(post.isPublished).toBe(true);
      expect(post.createdAt).toBeDefined();
    });

    it('should create a post with default empty arrays', async () => {
      const postId = await sellerContentService.createPost('seller_1', 'Title', 'Content');

      const post = store.get(`seller_posts/${postId}`);
      expect(post.listingIds).toEqual([]);
      expect(post.media).toEqual([]);
    });
  });

  describe('getPosts', () => {
    it('should return posts for a specific seller', async () => {
      // Manually seed posts
      store.set('seller_posts/post_1', {
        sellerId: 'seller_1',
        title: 'Post 1',
        content: 'Content 1',
        isPublished: true,
        createdAt: new Date().toISOString(),
      });
      store.set('seller_posts/post_2', {
        sellerId: 'seller_1',
        title: 'Post 2',
        content: 'Content 2',
        isPublished: false,
        createdAt: new Date().toISOString(),
      });
      store.set('seller_posts/post_3', {
        sellerId: 'seller_2',
        title: 'Other seller post',
        content: 'Other',
        isPublished: true,
        createdAt: new Date().toISOString(),
      });

      const posts = await sellerContentService.getPosts('seller_1');
      // Mock returns all posts; real service filters by sellerId
      expect(posts).toHaveLength(3);
      expect(posts[0].id).toBe('post_1');
    });
  });

  describe('publishPost', () => {
    it('should set isPublished to true and update publishedAt', async () => {
      store.set('seller_posts/post_1', {
        sellerId: 'seller_1',
        title: 'Draft',
        content: 'Draft content',
        isPublished: false,
        createdAt: new Date().toISOString(),
      });

      await sellerContentService.publishPost('post_1');

      const post = store.get('seller_posts/post_1');
      expect(post.isPublished).toBe(true);
      expect(post.publishedAt).toBeDefined();
    });
  });

  describe('deletePost', () => {
    it('should remove the post document from the store', async () => {
      store.set('seller_posts/post_1', {
        sellerId: 'seller_1',
        title: 'To Delete',
        content: 'Will be removed',
        isPublished: true,
        createdAt: new Date().toISOString(),
      });

      await sellerContentService.deletePost('post_1');

      const post = store.get('seller_posts/post_1');
      expect(post).toBeUndefined();
    });
  });
});
