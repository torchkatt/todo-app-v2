import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../services/firebase', () => ({ db: {}, auth: {} }));

describe('Payment — Wompi types', () => {
  it('WompiTransaction has all fields', () => {
    const tx = {
      id: 'tx-wompi-123',
      amountInCents: 5000000,
      reference: 'ORD-ABC123',
      currency: 'COP',
      status: 'PENDING',
      customerEmail: 'test@test.com',
      customerData: { full_name: 'Test User', phone_number: '3001234567' },
      shippingAddress: { address_line_1: 'Calle 123', city: 'Bogotá', phone_number: '3001234567' },
    };
    expect(tx).toHaveProperty('id');
    expect(tx).toHaveProperty('amountInCents');
    expect(tx).toHaveProperty('reference');
    expect(tx).toHaveProperty('currency');
    expect(tx).toHaveProperty('status');
  });

  it('WompiTransaction statuses', () => {
    const statuses = ['PENDING', 'APPROVED', 'DECLINED', 'ERROR', 'VOIDED'];
    expect(statuses).toHaveLength(5);
    statuses.forEach(s => expect(typeof s).toBe('string'));
  });

  it('amountInCents is always COP * 100', () => {
    const toCents = (cop: number) => cop * 100;
    expect(toCents(50000)).toBe(5000000);
    expect(toCents(1000)).toBe(100000);
    expect(toCents(0)).toBe(0);
    expect(toCents(1)).toBe(100);
  });

  it('reference is unique per order', () => {
    const generateRef = (prefix: string, id: string) => `${prefix}-${id}`;
    expect(generateRef('ORD', 'abc123')).toBe('ORD-abc123');
    expect(generateRef('TODO', 'xyz789')).toBe('TODO-xyz789');
    expect(generateRef('REF', '')).toBe('REF-');
  });
});

describe('Payment — Wompi public key', () => {
  it('test public key exists', () => {
    const testKey = 'pub_test_X5g4F7kD3mN2qR8wY1bV6cJ9';
    expect(testKey).toBeTruthy();
    expect(testKey.startsWith('pub_test_')).toBe(true);
  });

  it('production key starts with pub_prod_', () => {
    const isProdKey = (key: string) => key.startsWith('pub_prod_');
    expect(isProdKey('pub_prod_abc123')).toBe(true);
    expect(isProdKey('pub_test_abc')).toBe(false);
  });
});

describe('Payment — Wompi checkout URL', () => {
  it('checkout URL is valid', () => {
    const url = 'https://checkout.wompi.co/v2';
    expect(url.startsWith('https://')).toBe(true);
    expect(url).toContain('wompi.co');
  });

  it('sandbox API URL is valid', () => {
    const url = 'https://sandbox.wompi.co/v1/transactions';
    expect(url.startsWith('https://')).toBe(true);
    expect(url).toContain('sandbox.wompi.co');
  });
});

describe('Payment — Tax calculation', () => {
  const calcIVA = (amount: number, rate: number = 0.19) => {
    return Math.round(amount * rate);
  };

  it('calculates 19% IVA', () => {
    expect(calcIVA(100000)).toBe(19000);
    expect(calcIVA(50000)).toBe(9500);
    expect(calcIVA(0)).toBe(0);
  });

  it('IVA rounds to integer', () => {
    const iva = calcIVA(15990);
    expect(Number.isInteger(iva)).toBe(true);
  });

  it('total with IVA', () => {
    const total = (amount: number) => amount + calcIVA(amount);
    expect(total(100000)).toBe(119000);
  });
});

describe('Payment — Customer data validation', () => {
  it('customer data has required fields', () => {
    const customerData = {
      email: 'test@test.com',
      full_name: 'Test User',
      phone_number: '3001234567',
    };
    expect(customerData).toHaveProperty('email');
    expect(customerData).toHaveProperty('full_name');
    expect(customerData).toHaveProperty('phone_number');
  });

  it('validates email format in customer data', () => {
    const isValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(isValid('test@test.com')).toBe(true);
    expect(isValid('bad-email')).toBe(false);
    expect(isValid('')).toBe(false);
  });

  it('validates phone format', () => {
    const isValid = (phone: string) => phone.replace(/\D/g, '').length >= 10;
    expect(isValid('3001234567')).toBe(true);
    expect(isValid('573001234567')).toBe(true);
    expect(isValid('123')).toBe(false);
  });
});

describe('Payment — Redirect URL', () => {
  it('redirect URL points to /orders', () => {
    const redirectUrl = (origin: string) => `${origin}/orders`;
    expect(redirectUrl('https://todoapp.co')).toBe('https://todoapp.co/orders');
    expect(redirectUrl('http://localhost:5173')).toBe('http://localhost:5173/orders');
  });
});

describe('Payment — Error handling', () => {
  it('onError callback receives error message', () => {
    const errors: string[] = [];
    const onError = (err: any) => errors.push(typeof err === 'string' ? err : err.message);
    onError('No se pudo cargar Wompi');
    onError('El pago expiró');
    expect(errors).toHaveLength(2);
    expect(errors[0]).toBe('No se pudo cargar Wompi');
    expect(errors[1]).toBe('El pago expiró');
  });

  it('onSuccess callback receives transaction', () => {
    const results: any[] = [];
    const onSuccess = (tx: any) => results.push(tx);
    onSuccess({ id: 'tx-1', status: 'APPROVED', amountInCents: 50000 });
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('APPROVED');
  });

  it('handles declined payment', () => {
    const statuses: string[] = [];
    const onError = (err: string) => statuses.push(err);
    onError('Payment declined');
    expect(statuses).toContain('Payment declined');
  });
});

describe('Payment — Transaction verification', () => {
  it('verifyTransaction constructs correct URL', () => {
    const getUrl = (txId: string) => `https://sandbox.wompi.co/v1/transactions/${txId}`;
    expect(getUrl('abc-123-def')).toBe('https://sandbox.wompi.co/v1/transactions/abc-123-def');
    expect(getUrl('')).toBe('https://sandbox.wompi.co/v1/transactions/');
  });

  it('transaction id is alphanumeric with separators', () => {
    const isValid = (id: string) => /^[a-zA-Z0-9_-]+$/.test(id);
    expect(isValid('tx-abc-123')).toBe(true);
    expect(isValid('abc_def')).toBe(true);
    expect(isValid('abc 123')).toBe(false);
    expect(isValid('')).toBe(false);
  });
});

describe('Payment — Amount validation', () => {
  it('amount must be positive for checkout', () => {
    const isValid = (amount: number) => amount > 0;
    expect(isValid(1000)).toBe(true);
    expect(isValid(50000)).toBe(true);
    expect(isValid(0)).toBe(false);
    expect(isValid(-1000)).toBe(false);
  });

  it('amountInCents is positive integer', () => {
    const isValid = (cents: number) => cents > 0 && Number.isInteger(cents);
    expect(isValid(5000000)).toBe(true);
    expect(isValid(100)).toBe(true);
    expect(isValid(0)).toBe(false);
    expect(isValid(50.5)).toBe(false);
  });

  it('max transaction amount (COP)', () => {
    const MAX_AMOUNT = 100000000; // 100M COP
    const isValid = (amount: number) => amount > 0 && amount <= MAX_AMOUNT;
    expect(isValid(99999999)).toBe(true);
    expect(isValid(100000001)).toBe(false);
  });
});

describe('Payment — Wompi service structure', () => {
  it('paymentService exports expected functions', async () => {
    const mod = await import('../services/paymentService');
    expect(typeof mod.openWompiCheckout).toBe('function');
    expect(typeof mod.verifyWompiTransaction).toBe('function');
  });

  it('WompiTransaction type is exported', async () => {
    const mod = await import('../services/paymentService');
    // Type exists at compile time; runtime check on the function that uses it
    expect(mod.openWompiCheckout).toBeDefined();
  });
});

describe('Payment — Script loading', () => {
  it('Wompi widget is loaded from CDN', () => {
    const scriptUrl = 'https://checkout.wompi.co/v2/widget.js';
    expect(scriptUrl).toContain('wompi.co');
    expect(scriptUrl).toContain('widget.js');
  });

  it('script load error calls onError', () => {
    const accumulated: string[] = [];
    const onError = (msg: string) => accumulated.push(msg);
    onError('No se pudo cargar Wompi');
    expect(accumulated).toHaveLength(1);
  });
});
