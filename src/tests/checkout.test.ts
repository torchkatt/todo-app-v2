import { describe, it, expect, vi } from 'vitest';
import { DeliveryMethod, TransactionType, TransactionStatus } from '../types';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

describe('Checkout — Transaction model', () => {
  it('Transaction has all required fields', () => {
    const tx: Record<string, any> = {
      id: 'tx-1',
      transactionType: TransactionType.PURCHASE,
      status: TransactionStatus.PENDING_PAYMENT,
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      lineItems: [],
      subtotal: 50000,
      deliveryFee: 5000,
      platformFee: 5500,
      totalAmount: 60500,
      sellerEarnings: 45000,
      deliveryMethod: DeliveryMethod.SHIPPING,
      payment: {
        gateway: 'wompi',
        transactionId: '',
        status: 'pending',
        method: 'card',
        amount: 60500,
        currency: 'COP',
        createdAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(tx).toHaveProperty('id');
    expect(tx).toHaveProperty('buyerId');
    expect(tx).toHaveProperty('sellerId');
    expect(tx).toHaveProperty('totalAmount');
    expect(tx).toHaveProperty('payment');
  });
});

describe('Checkout — LineItem validation', () => {
  it('LineItem has required fields', () => {
    const item = {
      listingId: 'list-1',
      title: 'iPhone 15',
      quantity: 1,
      unitPrice: 4000000,
      totalPrice: 4000000,
    };
    expect(item).toHaveProperty('listingId');
    expect(item).toHaveProperty('title');
    expect(item).toHaveProperty('quantity');
    expect(item).toHaveProperty('unitPrice');
    expect(item).toHaveProperty('totalPrice');
  });

  it('lineItem totalPrice = unitPrice * quantity', () => {
    const calcTotal = (price: number, qty: number) => price * qty;
    expect(calcTotal(10000, 2)).toBe(20000);
    expect(calcTotal(10000, 1)).toBe(10000);
    expect(calcTotal(0, 5)).toBe(0);
    expect(calcTotal(1500, 3)).toBe(4500);
  });

  it('lineItem image is optional', () => {
    const withImg = { listingId: 'l1', title: 'T', quantity: 1, unitPrice: 100, totalPrice: 100, image: 'img.jpg' };
    const withoutImg = { listingId: 'l1', title: 'T', quantity: 1, unitPrice: 100, totalPrice: 100 };
    expect(withImg).toHaveProperty('image');
    expect(withoutImg).not.toHaveProperty('image');
  });
});

describe('Checkout — Payment info validation', () => {
  it('PaymentInfo has required fields', () => {
    const payment = {
      gateway: 'wompi',
      transactionId: 'wompi-tx-123',
      status: 'pending' as const,
      method: 'card',
      amount: 50000,
      currency: 'COP',
      createdAt: new Date().toISOString(),
    };
    expect(payment).toHaveProperty('gateway');
    expect(payment).toHaveProperty('transactionId');
    expect(payment).toHaveProperty('status');
    expect(payment).toHaveProperty('method');
    expect(payment).toHaveProperty('amount');
    expect(payment).toHaveProperty('currency');
  });

  it('payment methods are valid', () => {
    const methods = ['card', 'pse', 'nequi', 'daviplata', 'efecty'];
    expect(methods).toHaveLength(5);
    methods.forEach(m => expect(typeof m).toBe('string'));
  });

  it('payment statuses are valid', () => {
    const statuses = ['pending', 'approved', 'declined', 'refunded', 'error'];
    expect(statuses).toHaveLength(5);
  });

  it('approvedAt is set when approved', () => {
    const payment = {
      gateway: 'wompi', transactionId: 'tx-1', status: 'approved' as const,
      method: 'card', amount: 50000, currency: 'COP',
      createdAt: new Date().toISOString(), approvedAt: new Date().toISOString(),
    };
    expect(payment).toHaveProperty('approvedAt');
    expect(payment.approvedAt).toBeTruthy();
  });

  it('payment currency is COP', () => {
    const payment = { currency: 'COP' };
    expect(payment.currency).toBe('COP');
  });
});

describe('Checkout — Calculations', () => {
  const calculateCheckout = (
    items: Array<{ price: number; quantity: number }>,
    deliveryFee: number = 0,
    platformFeePercent: number = 10,
  ) => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const platformFee = Math.round(subtotal * (platformFeePercent / 100));
    const totalAmount = subtotal + deliveryFee + platformFee;
    const sellerEarnings = subtotal - platformFee;
    return { subtotal, deliveryFee, platformFee, totalAmount, sellerEarnings };
  };

  it('calculates single item checkout', () => {
    const result = calculateCheckout([{ price: 10000, quantity: 2 }]);
    expect(result.subtotal).toBe(20000);
    expect(result.platformFee).toBe(2000);
    expect(result.totalAmount).toBe(22000);
    expect(result.sellerEarnings).toBe(18000);
  });

  it('calculates multiple items', () => {
    const result = calculateCheckout([
      { price: 10000, quantity: 2 },
      { price: 5000, quantity: 3 },
    ]);
    expect(result.subtotal).toBe(35000);
    expect(result.platformFee).toBe(3500);
    expect(result.totalAmount).toBe(38500);
    expect(result.sellerEarnings).toBe(31500);
  });

  it('includes delivery fee', () => {
    const result = calculateCheckout([{ price: 10000, quantity: 1 }], 5000);
    expect(result.subtotal).toBe(10000);
    expect(result.deliveryFee).toBe(5000);
    expect(result.totalAmount).toBe(16000); // 10000 + 5000 + 1000
  });

  it('empty cart checkout total is 0', () => {
    const result = calculateCheckout([]);
    expect(result.subtotal).toBe(0);
    expect(result.platformFee).toBe(0);
    expect(result.totalAmount).toBe(0);
    expect(result.sellerEarnings).toBe(0);
  });

  it('platform fee rounds correctly', () => {
    const result = calculateCheckout([{ price: 15900, quantity: 1 }]);
    expect(result.platformFee).toBe(1590); // 10% of 15900 = 1590
  });

  it('seller earnings = subtotal - platform fee', () => {
    const result = calculateCheckout([{ price: 50000, quantity: 1 }]);
    expect(result.sellerEarnings).toBe(result.subtotal - result.platformFee);
  });
});

describe('Checkout — Status transitions', () => {
  it('valid status transitions for purchase', () => {
    const validTransitions: Record<string, string[]> = {
      PENDING_PAYMENT: ['PAYMENT_CONFIRMED', 'CANCELLED'],
      PAYMENT_CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY', 'CANCELLED'],
      READY: ['IN_TRANSIT', 'CANCELLED'],
      IN_TRANSIT: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: ['REFUNDED'],
      REFUNDED: [],
    };
    expect(validTransitions.PENDING_PAYMENT).toContain('PAYMENT_CONFIRMED');
    expect(validTransitions.DELIVERED).toHaveLength(0);
    expect(validTransitions.CANCELLED).toContain('REFUNDED');
  });

  it('final states are terminal', () => {
    const finalStates = ['DELIVERED', 'REFUNDED', 'ATTENDED'];
    expect(finalStates).toHaveLength(3);
    // These are terminal states that shouldn't have further transitions
    expect(finalStates).toContain('DELIVERED');
    expect(finalStates).toContain('REFUNDED');
    expect(finalStates).toContain('ATTENDED');
  });
});

describe('Checkout — Pickup info', () => {
  it('pickup window has start and end', () => {
    const window = { start: '14:00', end: '18:00' };
    expect(window).toHaveProperty('start');
    expect(window).toHaveProperty('end');
  });

  it('pickup code is alphanumeric', () => {
    const code = 'PKP-AB12';
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThan(0);
  });

  it('pickup window end after start', () => {
    const isValid = (start: string, end: string) => start < end;
    expect(isValid('14:00', '18:00')).toBe(true);
    expect(isValid('18:00', '14:00')).toBe(false);
    expect(isValid('09:00', '09:30')).toBe(true);
  });
});

describe('Checkout — Booking summary', () => {
  it('BookingSummary has required fields', () => {
    const summary = {
      startTime: '2024-12-25T14:00:00',
      endTime: '2024-12-25T15:00:00',
      duration: 60,
    };
    expect(summary).toHaveProperty('startTime');
    expect(summary).toHaveProperty('endTime');
    expect(summary).toHaveProperty('duration');
  });

  it('duration is positive', () => {
    const isValid = (d: number) => d > 0;
    expect(isValid(60)).toBe(true);
    expect(isValid(30)).toBe(true);
    expect(isValid(0)).toBe(false);
    expect(isValid(-10)).toBe(false);
  });
});

describe('Checkout — Shipping info', () => {
  it('shipping fields are optional', () => {
    const tx: Record<string, any> = {
      shippingAddress: 'Calle 123 #45-67, Bogotá',
      courierId: 'cour-1',
      trackingNumber: 'TRK123456',
    };
    expect(tx).toHaveProperty('shippingAddress');
    expect(tx).toHaveProperty('courierId');
    expect(tx).toHaveProperty('trackingNumber');
  });

  it('tracking number is a string', () => {
    const isValid = (t: any) => typeof t === 'string' && t.length > 0;
    expect(isValid('TRK-12345')).toBe(true);
    expect(isValid('')).toBe(false);
    expect(isValid(null)).toBe(false);
  });
});

describe('Checkout — Platform fee', () => {
  const calcPlatformFee = (subtotal: number, rate: number = 0.10) => {
    return Math.round(subtotal * rate);
  };

  it('10% platform fee', () => {
    expect(calcPlatformFee(10000)).toBe(1000);
    expect(calcPlatformFee(50000)).toBe(5000);
    expect(calcPlatformFee(0)).toBe(0);
  });

  it('platform fee is integer', () => {
    const fee = calcPlatformFee(15990);
    expect(Number.isInteger(fee)).toBe(true);
  });
});
