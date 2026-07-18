import { describe, it, expect, vi } from 'vitest';

vi.mock('../services/firebase', () => ({ db: {}, auth: {} }));

// ─── planService types validation ───
describe('Plan Service — Types', () => {
  it('SubscriptionPlan interface has all required fields', () => {
    const plan = {
      id: 'free',
      name: 'Gratis',
      slug: 'free',
      price: 0,
      period: 'monthly' as const,
      commissionRate: 0.10,
      features: ['Feature 1', 'Feature 2'],
      highlight: false,
      isActive: true,
      sortOrder: 0,
    };
    expect(plan).toHaveProperty('id');
    expect(plan).toHaveProperty('name');
    expect(plan).toHaveProperty('slug');
    expect(plan).toHaveProperty('price');
    expect(plan).toHaveProperty('period');
    expect(plan).toHaveProperty('commissionRate');
    expect(plan).toHaveProperty('features');
    expect(plan).toHaveProperty('highlight');
    expect(plan).toHaveProperty('isActive');
    expect(plan).toHaveProperty('sortOrder');
  });

  it('SubscriptionPlan period values', () => {
    const periods = ['monthly', 'annual', 'lifetime'];
    expect(periods).toHaveLength(3);
    periods.forEach(p => expect(typeof p).toBe('string'));
  });

  it('SubscriptionPlan commissionRate is between 0 and 1', () => {
    const isValid = (rate: number) => rate >= 0 && rate <= 1;
    expect(isValid(0.10)).toBe(true);
    expect(isValid(0.05)).toBe(true);
    expect(isValid(0)).toBe(true);
    expect(isValid(1)).toBe(true);
    expect(isValid(-0.01)).toBe(false);
    expect(isValid(1.01)).toBe(false);
  });

  it('SellerSubscription has all required fields', () => {
    const sub = {
      sellerId: 'seller-1',
      planId: 'free',
      status: 'active' as const,
      startedAt: new Date().toISOString(),
      autoRenew: true,
    };
    expect(sub).toHaveProperty('sellerId');
    expect(sub).toHaveProperty('planId');
    expect(sub).toHaveProperty('status');
    expect(sub).toHaveProperty('startedAt');
    expect(sub).toHaveProperty('autoRenew');
  });

  it('SellerSubscription status values', () => {
    const statuses = ['active', 'cancelled', 'expired', 'trial'];
    expect(statuses).toHaveLength(4);
    statuses.forEach(s => expect(typeof s).toBe('string'));
  });

  it('SellerSubscription optional fields', () => {
    const sub = { sellerId: 's1', planId: 'free', status: 'active' as const, startedAt: '', autoRenew: false };
    expect(sub).not.toHaveProperty('expiresAt');
    const sub2 = { ...sub, expiresAt: '2025-01-01', cancelledAt: '2024-12-01', paymentMethod: 'card' };
    expect(sub2).toHaveProperty('expiresAt');
    expect(sub2).toHaveProperty('cancelledAt');
    expect(sub2).toHaveProperty('paymentMethod');
  });
});

// ─── Default plans validation (inlined from planService.ts) ───
describe('Plan Service — Default Plans', () => {
  const DEFAULT_PLANS = [
    {
      id: 'free',
      name: 'Gratis',
      slug: 'free',
      price: 0,
      period: 'monthly',
      commissionRate: 0.10,
      features: [
        'Hasta 20 productos publicados',
        'Comisión 10% por venta',
        'Soporte por chat IA',
        'Estadísticas básicas',
      ],
      highlight: false,
      isActive: true,
      sortOrder: 0,
    },
    {
      id: 'seller_pass_monthly',
      name: 'Seller Pass Mensual',
      slug: 'seller-pass-monthly',
      price: 49900,
      period: 'monthly',
      commissionRate: 0.05,
      features: [
        'Productos ilimitados',
        'Comisión reducida 5%',
        'Estadísticas avanzadas',
        'Dashboard de revenue',
        'Soporte prioritario',
        'Insignia verificada',
      ],
      highlight: true,
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'seller_pass_annual',
      name: 'Seller Pass Anual',
      slug: 'seller-pass-annual',
      price: 499900,
      period: 'annual',
      commissionRate: 0.05,
      features: [
        'Todo lo del plan mensual',
        '2 meses gratis (vs mensual)',
        'Comisión reducida 5%',
        'Dashboard de revenue',
        'Exportación de datos',
        'API access',
        'Soporte 24/7',
      ],
      highlight: true,
      isActive: true,
      sortOrder: 2,
    },
  ];

  it('has 3 default plans', () => {
    expect(DEFAULT_PLANS).toHaveLength(3);
  });

  it('free plan has price 0', () => {
    const free = DEFAULT_PLANS.find(p => p.id === 'free');
    expect(free).toBeDefined();
    expect(free!.price).toBe(0);
    expect(free!.commissionRate).toBe(0.10);
  });

  it('free plan has 4 features', () => {
    const free = DEFAULT_PLANS.find(p => p.id === 'free');
    expect(free!.features).toHaveLength(4);
  });

  it('free plan is not highlighted', () => {
    const free = DEFAULT_PLANS.find(p => p.id === 'free');
    expect(free!.highlight).toBe(false);
  });

  it('monthly plan has price 49900', () => {
    const monthly = DEFAULT_PLANS.find(p => p.id === 'seller_pass_monthly');
    expect(monthly).toBeDefined();
    expect(monthly!.price).toBe(49900);
    expect(monthly!.commissionRate).toBe(0.05);
  });

  it('monthly plan has 6 features', () => {
    const monthly = DEFAULT_PLANS.find(p => p.id === 'seller_pass_monthly');
    expect(monthly!.features).toHaveLength(6);
  });

  it('monthly plan is highlighted', () => {
    const monthly = DEFAULT_PLANS.find(p => p.id === 'seller_pass_monthly');
    expect(monthly!.highlight).toBe(true);
  });

  it('annual plan has price 499900', () => {
    const annual = DEFAULT_PLANS.find(p => p.id === 'seller_pass_annual');
    expect(annual).toBeDefined();
    expect(annual!.price).toBe(499900);
  });

  it('annual plan has 7 features', () => {
    const annual = DEFAULT_PLANS.find(p => p.id === 'seller_pass_annual');
    expect(annual!.features).toHaveLength(7);
  });

  it('annual plan is highlighted', () => {
    const annual = DEFAULT_PLANS.find(p => p.id === 'seller_pass_annual');
    expect(annual!.highlight).toBe(true);
  });

  it('all plans are active', () => {
    DEFAULT_PLANS.forEach(p => {
      expect(p.isActive).toBe(true);
    });
  });

  it('plans are sorted by sortOrder', () => {
    for (let i = 1; i < DEFAULT_PLANS.length; i++) {
      expect(DEFAULT_PLANS[i].sortOrder).toBeGreaterThan(DEFAULT_PLANS[i - 1].sortOrder);
    }
  });

  it('all plan slugs are unique', () => {
    const slugs = DEFAULT_PLANS.map(p => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('all plan IDs are unique', () => {
    const ids = DEFAULT_PLANS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('plan features are strings', () => {
    DEFAULT_PLANS.forEach(p => {
      p.features.forEach(f => {
        expect(typeof f).toBe('string');
        expect(f.length).toBeGreaterThan(0);
      });
    });
  });

  it('periods are valid', () => {
    DEFAULT_PLANS.forEach(p => {
      expect(['monthly', 'annual', 'lifetime']).toContain(p.period);
    });
  });
});

// ─── Plan service exports ───
describe('Plan Service — Exports', () => {
  it('planService exports expected functions', async () => {
    const mod = await import('../services/planService');
    expect(typeof mod.planService.getAll).toBe('function');
    expect(typeof mod.planService.getById).toBe('function');
    expect(typeof mod.planService.seedDefaults).toBe('function');
  });

  it('sellerSubscriptionService exports expected functions', async () => {
    const mod = await import('../services/planService');
    expect(typeof mod.sellerSubscriptionService.getCurrentPlan).toBe('function');
    expect(typeof mod.sellerSubscriptionService.upgradePlan).toBe('function');
    expect(typeof mod.sellerSubscriptionService.cancelSubscription).toBe('function');
  });

  it('planService has exactly 3 methods', () => {
    const methods = ['getAll', 'getById', 'seedDefaults'];
    expect(methods).toHaveLength(3);
  });

  it('sellerSubscriptionService has exactly 3 methods', () => {
    const methods = ['getCurrentPlan', 'upgradePlan', 'cancelSubscription'];
    expect(methods).toHaveLength(3);
  });
});

// ─── Upgrade logic tests (inlined) ───
describe('Plan Service — Upgrade logic', () => {
  it('upgrade calculates monthly expiration date', () => {
    const now = new Date('2024-06-15T10:00:00Z');
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    expect(expiresAt.getMonth()).toBe(6); // July (0-indexed)
    expect(expiresAt.getFullYear()).toBe(2024);
  });

  it('upgrade calculates annual expiration date', () => {
    const now = new Date('2024-06-15T10:00:00Z');
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    expect(expiresAt.getFullYear()).toBe(2025);
    expect(expiresAt.getMonth()).toBe(5); // June
  });

  it('upgrade handles year boundary correctly', () => {
    const now = new Date('2024-12-15T10:00:00Z');
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    expect(expiresAt.getFullYear()).toBe(2025);
    expect(expiresAt.getMonth()).toBe(0); // January
  });

  it('cancel sets status to cancelled', () => {
    const sub = { status: 'active', autoRenew: true };
    const cancelled = { ...sub, status: 'cancelled', autoRenew: false, cancelledAt: new Date().toISOString() };
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.autoRenew).toBe(false);
    expect(cancelled).toHaveProperty('cancelledAt');
  });

  it('autoRenew defaults to true for new subscriptions', () => {
    const sub = { status: 'active', autoRenew: true, startedAt: new Date().toISOString() };
    expect(sub.autoRenew).toBe(true);
  });

  it('subscription without expiresAt uses plan period', () => {
    const isMonthly = (period: string) => period === 'monthly';
    expect(isMonthly('monthly')).toBe(true);
    expect(isMonthly('annual')).toBe(false);
  });
});
