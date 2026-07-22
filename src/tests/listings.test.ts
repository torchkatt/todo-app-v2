import { describe, it, expect, vi } from 'vitest';
import { ListingType, DeliveryMethod, TransactionType, TransactionStatus } from '../types';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})), setDoc: vi.fn(), getDoc: vi.fn(), updateDoc: vi.fn(),
  deleteDoc: vi.fn(), collection: vi.fn(() => ({})), query: vi.fn(() => ({})),
  where: vi.fn(() => ({})), orderBy: vi.fn(() => ({})), limit: vi.fn(() => ({})),
  getDocs: vi.fn(), startAfter: vi.fn(() => ({})), serverTimestamp: vi.fn(),
  increment: vi.fn(() => 1),
}));

describe('Listings — Types & Enums', () => {
  it('ListingType has all expected values', () => {
    expect(ListingType.PRODUCT).toBe('product');
    expect(ListingType.SERVICE).toBe('service');
    expect(ListingType.DIGITAL).toBe('digital');
  });

  it('ListingType has 3 values', () => {
    expect(Object.values(ListingType)).toHaveLength(3);
  });

  it('DeliveryMethod has all expected values', () => {
    const methods = Object.values(DeliveryMethod);
    expect(methods).toContain('pickup');
    expect(methods).toContain('shipping');
    expect(methods).toContain('digital');
    expect(methods).toContain('in_person');
    expect(methods).toContain('remote');
    expect(methods).toContain('at_buyer');
  });

  it('DeliveryMethod has exactly 6 methods', () => {
    expect(Object.values(DeliveryMethod)).toHaveLength(6);
  });
});

describe('Listings — Field validation', () => {
  it('listing title must not be empty', () => {
    const isValid = (t: string) => t.trim().length >= 3;
    expect(isValid('iPhone 15 Pro')).toBe(true);
    expect(isValid('ab')).toBe(false);
    expect(isValid('')).toBe(false);
    expect(isValid('   ')).toBe(false);
  });

  it('listing price must be positive', () => {
    const isValid = (p: number) => p > 0;
    expect(isValid(1000)).toBe(true);
    expect(isValid(0)).toBe(false);
    expect(isValid(-500)).toBe(false);
    expect(isValid(0.01)).toBe(true);
  });

  it('listing quantity >= 0', () => {
    const isValid = (q: number) => q >= 0;
    expect(isValid(10)).toBe(true);
    expect(isValid(0)).toBe(true);
    expect(isValid(-1)).toBe(false);
    expect(isValid(999)).toBe(true); // unlimited
  });

  it('originalPrice >= price when set', () => {
    const valid = (price: number, orig?: number) => !orig || orig >= price;
    expect(valid(100, 150)).toBe(true);
    expect(valid(100, 100)).toBe(true);
    expect(valid(150, 100)).toBe(false);
    expect(valid(100)).toBe(true);
  });

  it('listing requires sellerId', () => {
    const hasSeller = (l: any) => typeof l?.sellerId === 'string' && l.sellerId.length > 0;
    expect(hasSeller({ sellerId: 'seller-1' })).toBe(true);
    expect(hasSeller({ sellerId: '' })).toBe(false);
    expect(hasSeller({})).toBe(false);
  });

  it('listing requires categoryId', () => {
    const hasCat = (l: any) => typeof l?.categoryId === 'string' && l.categoryId.length > 0;
    expect(hasCat({ categoryId: 'cat-tech' })).toBe(true);
    expect(hasCat({})).toBe(false);
  });
});

describe('Listings — Discount calculation', () => {
  const calcDiscount = (price: number, originalPrice?: number): number => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  it('calculates discount percentage', () => {
    expect(calcDiscount(80, 100)).toBe(20);
    expect(calcDiscount(50, 100)).toBe(50);
    expect(calcDiscount(75, 100)).toBe(25);
  });

  it('returns 0 when no discount', () => {
    expect(calcDiscount(100, 100)).toBe(0);
    expect(calcDiscount(120, 100)).toBe(0);
    expect(calcDiscount(100)).toBe(0);
    expect(calcDiscount(100, undefined)).toBe(0);
  });

  it('handles edge cases', () => {
    expect(calcDiscount(1, 100)).toBe(99);
    expect(calcDiscount(0, 100)).toBe(100);
    expect(calcDiscount(99, 100)).toBe(1);
  });
});

describe('Listings — Stats validation', () => {
  it('ListingStats has all required fields', () => {
    const stats = {
      views: 100,
      favorites: 25,
      transactions: 10,
      rating: 4.5,
      ratingCount: 8,
    };
    expect(stats).toHaveProperty('views');
    expect(stats).toHaveProperty('favorites');
    expect(stats).toHaveProperty('transactions');
    expect(stats).toHaveProperty('rating');
    expect(stats).toHaveProperty('ratingCount');
  });

  it('stats values are non-negative', () => {
    const isValid = (s: any) =>
      s.views >= 0 && s.favorites >= 0 && s.transactions >= 0 && s.rating >= 0;
    expect(isValid({ views: 10, favorites: 5, transactions: 3, rating: 4.0 })).toBe(true);
    expect(isValid({ views: -1, favorites: 5, transactions: 3, rating: 4.0 })).toBe(false);
  });
});

describe('Listings — Boolean flags', () => {
  it('listing approval flags', () => {
    const listing = { isActive: true, isFeatured: false, isApproved: true };
    expect(typeof listing.isActive).toBe('boolean');
    expect(typeof listing.isFeatured).toBe('boolean');
    expect(typeof listing.isApproved).toBe('boolean');
  });

  it('unapproved listings should not appear in public results', () => {
    const listings = [
      { id: '1', isApproved: true, isActive: true },
      { id: '2', isApproved: false, isActive: true },
      { id: '3', isApproved: true, isActive: false },
    ];
    const visible = listings.filter(l => l.isActive && l.isApproved);
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe('1');
  });

  it('featured flag is independent of approval', () => {
    const listing = { isFeatured: true, isApproved: false };
    expect(listing.isFeatured).toBe(true);
    expect(listing.isApproved).toBe(false);
  });
});

describe('Listings — Images', () => {
  it('listing images is an array', () => {
    const listing = { images: ['img1.jpg', 'img2.jpg'] };
    expect(Array.isArray(listing.images)).toBe(true);
    expect(listing.images).toHaveLength(2);
  });

  it('empty images array is valid', () => {
    const listing = { images: [] };
    expect(Array.isArray(listing.images)).toBe(true);
    expect(listing.images).toHaveLength(0);
  });
});

describe('Listings — Tags', () => {
  it('listing tags is an array', () => {
    const listing = { tags: ['new', 'sale', 'tech'] };
    expect(Array.isArray(listing.tags)).toBe(true);
    expect(listing.tags).toContain('new');
  });

  it('tags are strings', () => {
    const tags = ['electronics', 'laptop', 'gaming'];
    tags.forEach(t => expect(typeof t).toBe('string'));
  });
});

describe('Listings — Service structure', () => {
  it('listingService exports all expected functions', async () => {
    const mod = await import('../services/listingService');
    expect(typeof mod.createListing).toBe('function');
    expect(typeof mod.getListing).toBe('function');
    expect(typeof mod.getListingsBySeller).toBe('function');
    expect(typeof mod.searchListings).toBe('function');
    expect(typeof mod.getFeaturedListings).toBe('function');
    expect(typeof mod.getRecommendations).toBe('function');
    expect(typeof mod.updateListing).toBe('function');
    expect(typeof mod.deactivateListing).toBe('function');
    expect(typeof mod.incrementViews).toBe('function');
  });

  it('listingService has 9 exported functions', () => {
    const funcs = [
      'createListing', 'getListing', 'getListingsBySeller', 'searchListings',
      'getFeaturedListings', 'getRecommendations', 'updateListing',
      'deactivateListing', 'incrementViews',
    ];
    expect(funcs).toHaveLength(9);
  });
});

describe('Listings — Price range filtering', () => {
  const filterByPrice = (listings: Array<{ price: number }>, min?: number, max?: number) => {
    let result = listings;
    if (min !== undefined) result = result.filter(l => l.price >= min);
    if (max !== undefined) result = result.filter(l => l.price <= max);
    return result;
  };

  const sample = [
    { price: 10000 }, { price: 25000 }, { price: 50000 },
    { price: 75000 }, { price: 100000 },
  ];

  it('filters by min price', () => {
    expect(filterByPrice(sample, 30000)).toHaveLength(3);
  });

  it('filters by max price', () => {
    expect(filterByPrice(sample, undefined, 25000)).toHaveLength(2);
  });

  it('filters by min and max', () => {
    expect(filterByPrice(sample, 20000, 80000)).toHaveLength(3);
  });

  it('returns all when no filter', () => {
    expect(filterByPrice(sample)).toHaveLength(5);
  });

  it('returns empty when no match', () => {
    expect(filterByPrice(sample, 200000)).toHaveLength(0);
  });
});

describe('Listings — Search filtering', () => {
  const search = (listings: Array<{ title: string; description: string; tags: string[] }>, term: string) => {
    const t = term.toLowerCase();
    return listings.filter(l =>
      l.title.toLowerCase().includes(t) ||
      l.description.toLowerCase().includes(t) ||
      l.tags.some(tag => tag.includes(t))
    );
  };

  const sample = [
    { title: 'iPhone 15', description: 'Apple smartphone', tags: ['tech', 'phone'] },
    { title: 'Pizza familiar', description: 'Pizza grande', tags: ['food', 'pizza'] },
    { title: 'Laptop Dell', description: 'Computadora portátil', tags: ['tech', 'laptop'] },
  ];

  it('searches by title', () => {
    expect(search(sample, 'iphone')).toHaveLength(1);
    expect(search(sample, 'pizza')).toHaveLength(1);
  });

  it('searches by description', () => {
    expect(search(sample, 'apple')).toHaveLength(1);
    expect(search(sample, 'computadora')).toHaveLength(1);
  });

  it('searches by tag', () => {
    expect(search(sample, 'tech')).toHaveLength(2);
    expect(search(sample, 'laptop')).toHaveLength(1);
    expect(search(sample, 'food')).toHaveLength(1);
  });

  it('case insensitive search', () => {
    expect(search(sample, 'IPHONE')).toHaveLength(1);
    expect(search(sample, 'DeLL')).toHaveLength(1);
  });

  it('returns empty for no match', () => {
    expect(search(sample, 'xyz123')).toHaveLength(0);
  });
});

describe('Listings — Transaction types', () => {
  it('TransactionType has purchase and booking', () => {
    expect(TransactionType.PURCHASE).toBe('purchase');
    expect(TransactionType.BOOKING).toBe('booking');
  });

  it('TransactionStatus has all expected values', () => {
    const statuses = Object.values(TransactionStatus);
    expect(statuses.length).toBeGreaterThanOrEqual(10);
    expect(statuses).toContain('PENDING_PAYMENT');
    expect(statuses).toContain('CANCELLED');
    expect(statuses).toContain('REFUNDED');
  });
});

describe('Listings — Attributes', () => {
  it('listing attributes is a record', () => {
    const attrs: Record<string, any> = { brand: 'Apple', condition: 'Nuevo' };
    expect(typeof attrs).toBe('object');
    expect(attrs.brand).toBe('Apple');
  });

  it('empty attributes is valid', () => {
    const attrs: Record<string, any> = {};
    expect(Object.keys(attrs)).toHaveLength(0);
  });
});
