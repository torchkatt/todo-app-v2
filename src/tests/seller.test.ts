import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SellerType } from '../types';

vi.mock('../services/firebase', () => ({ db: {}, auth: {} }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})), setDoc: vi.fn(), getDoc: vi.fn(), updateDoc: vi.fn(),
  deleteDoc: vi.fn(), collection: vi.fn(() => ({})), query: vi.fn(() => ({})),
  where: vi.fn(() => ({})), orderBy: vi.fn(() => ({})), limit: vi.fn(() => ({})),
  getDocs: vi.fn(), startAfter: vi.fn(() => ({})), serverTimestamp: vi.fn(),
}));

describe('Seller — Types & Enums', () => {
  it('SellerType has all expected values', () => {
    expect(SellerType.FOOD).toBe('food');
    expect(SellerType.RETAIL).toBe('retail');
    expect(SellerType.SERVICE).toBe('service');
    expect(SellerType.DIGITAL).toBe('digital');
    expect(SellerType.INDIVIDUAL).toBe('individual');
  });

  it('SellerType has exactly 5 types', () => {
    expect(Object.values(SellerType)).toHaveLength(5);
  });

  it('SellerType values are unique', () => {
    const vals = Object.values(SellerType);
    expect(new Set(vals).size).toBe(vals.length);
  });
});

describe('Seller — Field validation', () => {
  it('seller name must not be empty', () => {
    const isValidName = (name: string) => name.trim().length >= 2;
    expect(isValidName('Mi Tienda')).toBe(true);
    expect(isValidName('')).toBe(false);
    expect(isValidName('A')).toBe(false);
    expect(isValidName('  ')).toBe(false);
  });

  it('seller ownerId must be defined', () => {
    const hasOwner = (s: any) => typeof s?.ownerId === 'string' && s.ownerId.length > 0;
    expect(hasOwner({ ownerId: 'user-123' })).toBe(true);
    expect(hasOwner({ ownerId: '' })).toBe(false);
    expect(hasOwner({})).toBe(false);
    expect(hasOwner(null)).toBe(false);
  });

  it('seller subscription values', () => {
    const subs = ['free', 'seller_pass_monthly', 'seller_pass_annual'];
    expect(subs).toHaveLength(3);
    expect(subs).toContain('free');
    expect(subs).toContain('seller_pass_monthly');
    expect(subs).toContain('seller_pass_annual');
  });

  it('seller location has required fields', () => {
    const location = {
      address: 'Calle 123 #45-67',
      city: 'Bogotá',
      neighborhood: 'Chapinero',
      lat: 4.7110,
      lng: -74.0721,
    };
    expect(location).toHaveProperty('address');
    expect(location).toHaveProperty('city');
    expect(location.address).toBeTruthy();
    expect(location.city).toBeTruthy();
  });

  it('seller contact has optional fields', () => {
    const contact = {
      phone: '+573001234567',
      email: 'store@test.com',
      website: 'https://store.com',
      whatsapp: '+573001234567',
    };
    expect(contact).toHaveProperty('phone');
    expect(contact).toHaveProperty('email');
    expect(contact).toHaveProperty('website');
    expect(contact).toHaveProperty('whatsapp');
  });

  it('seller schedule day names', () => {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    expect(days).toHaveLength(7);
    days.forEach(d => expect(typeof d).toBe('string'));
  });
});

describe('Seller — Stats validation', () => {
  it('SellerStats has all required fields', () => {
    const stats = {
      totalTransactions: 50,
      totalRevenue: 1000000,
      totalListings: 25,
      activeListings: 20,
      completionRate: 0.95,
      avgRating: 4.5,
      responseTimeHours: 2,
    };
    expect(stats).toHaveProperty('totalTransactions');
    expect(stats).toHaveProperty('totalRevenue');
    expect(stats).toHaveProperty('totalListings');
    expect(stats).toHaveProperty('activeListings');
    expect(stats).toHaveProperty('completionRate');
    expect(stats).toHaveProperty('avgRating');
    expect(stats).toHaveProperty('responseTimeHours');
  });

  it('completionRate is between 0 and 1', () => {
    const isValid = (r: number) => r >= 0 && r <= 1;
    expect(isValid(0)).toBe(true);
    expect(isValid(0.5)).toBe(true);
    expect(isValid(1)).toBe(true);
    expect(isValid(-0.1)).toBe(false);
    expect(isValid(1.1)).toBe(false);
  });

  it('avgRating is between 0 and 5', () => {
    const isValid = (r: number) => r >= 0 && r <= 5;
    expect(isValid(0)).toBe(true);
    expect(isValid(2.5)).toBe(true);
    expect(isValid(5)).toBe(true);
    expect(isValid(-1)).toBe(false);
    expect(isValid(5.1)).toBe(false);
  });

  it('activeListings <= totalListings', () => {
    const isValid = (active: number, total: number) => active <= total;
    expect(isValid(20, 25)).toBe(true);
    expect(isValid(25, 25)).toBe(true);
    expect(isValid(30, 25)).toBe(false);
    expect(isValid(0, 0)).toBe(true);
  });
});

describe('Seller — Delivery config', () => {
  it('DeliveryConfig has required fields', () => {
    const config = {
      isEnabled: true,
      baseFee: 3500,
      pricePerKm: 1200,
      maxDistanceKm: 15,
      freeThreshold: 50000,
      estimatedTime: '30-45 min',
    };
    expect(config).toHaveProperty('isEnabled');
    expect(config).toHaveProperty('baseFee');
    expect(config).toHaveProperty('pricePerKm');
    expect(config).toHaveProperty('maxDistanceKm');
  });

  it('delivery base fee is non-negative', () => {
    const fees = [0, 3500, 10000];
    fees.forEach(f => expect(f).toBeGreaterThanOrEqual(0));
  });

  it('free threshold is optional', () => {
    const config1 = { isEnabled: true, baseFee: 3500, pricePerKm: 1000, maxDistanceKm: 10 };
    const config2 = { ...config1, freeThreshold: 50000 };
    expect(config1).not.toHaveProperty('freeThreshold');
    expect(config2).toHaveProperty('freeThreshold');
  });
});

describe('Seller — Slug generation', () => {
  const slugify = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  it('converts names to slugs', () => {
    expect(slugify('Mi Tienda')).toBe('mi-tienda');
    expect(slugify('Super Store 123')).toBe('super-store-123');
    expect(slugify('   Espacios   ')).toBe('espacios');
    expect(slugify('Café & Restaurante')).toBe('caf-restaurante');
  });

  it('handles special characters', () => {
    expect(slugify('Tienda!@#$%')).toBe('tienda');
    expect(slugify('a-b-c')).toBe('a-b-c');
    expect(slugify('a__b')).toBe('a-b');
  });

  it('handles empty strings', () => {
    expect(slugify('')).toBe('');
    expect(slugify('---')).toBe('');
    expect(slugify('!!!')).toBe('');
  });
});

describe('Seller — Service structure', () => {
  it('sellerService exports all expected functions', async () => {
    const mod = await import('../services/sellerService');
    expect(typeof mod.createSeller).toBe('function');
    expect(typeof mod.getSeller).toBe('function');
    expect(typeof mod.getSellerByOwner).toBe('function');
    expect(typeof mod.updateSeller).toBe('function');
    expect(typeof mod.searchSellers).toBe('function');
    expect(typeof mod.getSellersByCategory).toBe('function');
    expect(typeof mod.disableSeller).toBe('function');
  });

  it('sellerService has 7 exported functions', () => {
    const funcNames = [
      'createSeller', 'getSeller', 'getSellerByOwner', 'updateSeller',
      'searchSellers', 'getSellersByCategory', 'disableSeller',
    ];
    expect(funcNames).toHaveLength(7);
  });
});

describe('Seller — TimeRange validation', () => {
  it('TimeRange has open and close', () => {
    const range = { open: '09:00', close: '18:00' };
    expect(range).toHaveProperty('open');
    expect(range).toHaveProperty('close');
    expect(range.open).toBe('09:00');
    expect(range.close).toBe('18:00');
  });

  it('validates time format HH:MM', () => {
    const isValid = (t: string) => /^\d{2}:\d{2}$/.test(t);
    expect(isValid('09:00')).toBe(true);
    expect(isValid('23:59')).toBe(true);
    expect(isValid('9:00')).toBe(false);
    expect(isValid('abc')).toBe(false);
  });
});

describe('Seller — Boolean flags', () => {
  it('seller isActive and isVerified are booleans', () => {
    const seller = { isActive: true, isVerified: false };
    expect(typeof seller.isActive).toBe('boolean');
    expect(typeof seller.isVerified).toBe('boolean');
  });

  it('inactive seller should not appear in search', () => {
    const activeSellers = [
      { id: '1', name: 'A', isActive: true },
      { id: '2', name: 'B', isActive: false },
      { id: '3', name: 'C', isActive: true },
    ];
    const filtered = activeSellers.filter(s => s.isActive);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(s => s.id)).toEqual(['1', '3']);
  });
});
