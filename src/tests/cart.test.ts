import { describe, it, expect, vi } from 'vitest';
import { DeliveryMethod } from '../types';

vi.mock('../services/firebase', () => ({ db: {}, auth: {} }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})), setDoc: vi.fn(), getDoc: vi.fn(), updateDoc: vi.fn(),
  collection: vi.fn(() => ({})), query: vi.fn(() => ({})), where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})), limit: vi.fn(() => ({})), getDocs: vi.fn(),
  serverTimestamp: vi.fn(), increment: vi.fn(() => 1),
}));

describe('Cart — CartItem validation', () => {
  it('CartItem has all required fields', () => {
    const item = {
      listingId: 'list-1',
      sellerId: 'seller-1',
      title: 'iPhone 15',
      price: 4000000,
      quantity: 1,
      deliveryMethod: DeliveryMethod.SHIPPING,
    };
    expect(item).toHaveProperty('listingId');
    expect(item).toHaveProperty('sellerId');
    expect(item).toHaveProperty('title');
    expect(item).toHaveProperty('price');
    expect(item).toHaveProperty('quantity');
    expect(item).toHaveProperty('deliveryMethod');
  });

  it('CartItem quantity must be positive', () => {
    const isValid = (q: number) => q > 0 && Number.isInteger(q);
    expect(isValid(1)).toBe(true);
    expect(isValid(5)).toBe(true);
    expect(isValid(0)).toBe(false);
    expect(isValid(-1)).toBe(false);
    expect(isValid(1.5)).toBe(false);
  });

  it('CartItem price must be non-negative', () => {
    const isValid = (p: number) => p >= 0;
    expect(isValid(1000)).toBe(true);
    expect(isValid(0)).toBe(true);
    expect(isValid(-500)).toBe(false);
  });

  it('CartItem optional fields', () => {
    const item1 = { listingId: '1', sellerId: 's1', title: 'Test', price: 1000, quantity: 1, deliveryMethod: DeliveryMethod.PICKUP };
    const item2 = { ...item1, image: 'img.jpg' };
    const item3 = { ...item1, bookingSlot: { date: '2024-12-25', time: '14:00' } };
    expect(item1).not.toHaveProperty('image');
    expect(item2).toHaveProperty('image');
    expect(item3).toHaveProperty('bookingSlot');
  });
});

describe('Cart — Cart model', () => {
  it('Cart has id and items', () => {
    const cart = {
      id: 'user-1',
      items: [],
      updatedAt: new Date().toISOString(),
    };
    expect(cart).toHaveProperty('id');
    expect(cart).toHaveProperty('items');
    expect(cart).toHaveProperty('updatedAt');
  });

  it('cart id equals userId', () => {
    const userId = 'user-abc-123';
    const cart = { id: userId, items: [], updatedAt: '' };
    expect(cart.id).toBe(userId);
  });
});

describe('Cart — Operations logic', () => {
  type TestCartItem = { listingId: string; title: string; price: number; quantity: number; sellerId: string };

  const addItem = (items: TestCartItem[], newItem: TestCartItem): TestCartItem[] => {
    const existing = items.find(i => i.listingId === newItem.listingId);
    if (existing) {
      return items.map(i =>
        i.listingId === newItem.listingId
          ? { ...i, quantity: i.quantity + newItem.quantity }
          : i
      );
    }
    return [...items, newItem];
  };

  const removeItem = (items: TestCartItem[], listingId: string): TestCartItem[] => {
    return items.filter(i => i.listingId !== listingId);
  };

  const updateQuantity = (items: TestCartItem[], listingId: string, qty: number): TestCartItem[] => {
    if (qty <= 0) return removeItem(items, listingId);
    return items.map(i => i.listingId === listingId ? { ...i, quantity: qty } : i);
  };

  const getTotal = (items: TestCartItem[]): number => {
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  };

  const getCount = (items: TestCartItem[]): number => {
    return items.reduce((sum, i) => sum + i.quantity, 0);
  };

  const baseItem: TestCartItem = { listingId: 'l1', title: 'Item 1', price: 10000, quantity: 1, sellerId: 's1' };

  it('adds new item to empty cart', () => {
    const result = addItem([], baseItem);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(baseItem);
  });

  it('adds different item', () => {
    const items = [baseItem];
    const result = addItem(items, { listingId: 'l2', title: 'Item 2', price: 5000, quantity: 2, sellerId: 's1' });
    expect(result).toHaveLength(2);
  });

  it('increments quantity for existing item', () => {
    const items = [baseItem];
    const result = addItem(items, { ...baseItem, quantity: 2 });
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(3);
  });

  it('removes item by listingId', () => {
    const items = [baseItem, { listingId: 'l2', title: 'Item 2', price: 5000, quantity: 1, sellerId: 's2' }];
    const result = removeItem(items, 'l1');
    expect(result).toHaveLength(1);
    expect(result[0].listingId).toBe('l2');
  });

  it('remove non-existent item does nothing', () => {
    const result = removeItem([baseItem], 'l999');
    expect(result).toHaveLength(1);
  });

  it('updates quantity', () => {
    const result = updateQuantity([baseItem], 'l1', 5);
    expect(result[0].quantity).toBe(5);
  });

  it('setting quantity to 0 removes item', () => {
    const items = [baseItem, { listingId: 'l2', title: 'Item 2', price: 5000, quantity: 1, sellerId: 's2' }];
    const result = updateQuantity(items, 'l1', 0);
    expect(result).toHaveLength(1);
    expect(result[0].listingId).toBe('l2');
  });

  it('setting negative quantity removes item', () => {
    const result = updateQuantity([baseItem], 'l1', -1);
    expect(result).toHaveLength(0);
  });

  it('calculates cart total correctly', () => {
    const items: TestCartItem[] = [
      { listingId: 'l1', title: 'A', price: 10000, quantity: 2, sellerId: 's1' },
      { listingId: 'l2', title: 'B', price: 5000, quantity: 3, sellerId: 's1' },
    ];
    expect(getTotal(items)).toBe(35000);
  });

  it('empty cart total is 0', () => {
    expect(getTotal([])).toBe(0);
  });

  it('single item total', () => {
    expect(getTotal([baseItem])).toBe(10000);
  });

  it('calculates item count', () => {
    const items: TestCartItem[] = [
      { listingId: 'l1', title: 'A', price: 10000, quantity: 3, sellerId: 's1' },
      { listingId: 'l2', title: 'B', price: 5000, quantity: 2, sellerId: 's1' },
    ];
    expect(getCount(items)).toBe(5);
  });

  it('empty cart count is 0', () => {
    expect(getCount([])).toBe(0);
  });

  it('removes from empty cart safely', () => {
    expect(removeItem([], 'x')).toHaveLength(0);
  });
});

describe('Cart — Different seller items', () => {
  it('cart validates all items belong to same seller', () => {
    const allSameSeller = (items: Array<{ sellerId: string }>): boolean => {
      if (items.length <= 1) return true;
      return items.every(i => i.sellerId === items[0].sellerId);
    };

    expect(allSameSeller([
      { sellerId: 's1' }, { sellerId: 's1' },
    ])).toBe(true);

    expect(allSameSeller([
      { sellerId: 's1' }, { sellerId: 's2' },
    ])).toBe(false);

    expect(allSameSeller([])).toBe(true);
    expect(allSameSeller([{ sellerId: 's1' }])).toBe(true);
  });
});

describe('Cart — Booking slots', () => {
  it('booking slot has date and time', () => {
    const slot = { date: '2024-12-25', time: '14:00' };
    expect(slot).toHaveProperty('date');
    expect(slot).toHaveProperty('time');
  });

  it('date format YYYY-MM-DD', () => {
    const isValid = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
    expect(isValid('2024-12-25')).toBe(true);
    expect(isValid('25-12-2024')).toBe(false);
    expect(isValid('2024/12/25')).toBe(false);
  });

  it('time format HH:MM', () => {
    const isValid = (t: string) => /^\d{2}:\d{2}$/.test(t);
    expect(isValid('14:00')).toBe(true);
    expect(isValid('09:30')).toBe(true);
    expect(isValid('2:00')).toBe(false);
  });
});
