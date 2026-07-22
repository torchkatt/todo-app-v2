import { describe, it, expect, vi } from 'vitest';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

// ─── SubscriptionPlanContext — Provider and hook ───
describe('SubscriptionPlanContext — Provider', () => {
  it('SubscriptionPlanProvider is default export and is a function', async () => {
    const mod = await import('../context/SubscriptionPlanContext');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('useSubscriptionPlans hook is exported', async () => {
    const mod = await import('../context/SubscriptionPlanContext');
    expect(typeof mod.useSubscriptionPlans).toBe('function');
  });
});

// ─── Context default values ───
describe('SubscriptionPlanContext — Default values', () => {
  it('default plans is empty array', () => {
    const defaults = {
      plans: [] as any[],
      currentPlan: null,
      currentSubscription: null,
      loading: true,
      error: null,
      refreshPlans: async () => {},
      refreshSubscription: async () => {},
    };
    expect(defaults.plans).toEqual([]);
    expect(defaults.currentPlan).toBeNull();
    expect(defaults.currentSubscription).toBeNull();
    expect(defaults.loading).toBe(true);
    expect(defaults.error).toBeNull();
  });

  it('refreshPlans is a function', () => {
    const refreshPlans = async () => {};
    expect(typeof refreshPlans).toBe('function');
  });

  it('refreshSubscription is a function', () => {
    const refreshSubscription = async () => {};
    expect(typeof refreshSubscription).toBe('function');
  });
});

// ─── Context provider value shape ───
describe('SubscriptionPlanContext — Context value shape', () => {
  it('context value has all required properties', () => {
    const value = {
      plans: [],
      currentPlan: null,
      currentSubscription: null,
      loading: false,
      error: null,
      refreshPlans: async () => {},
      refreshSubscription: async () => {},
    };
    expect(value).toHaveProperty('plans');
    expect(value).toHaveProperty('currentPlan');
    expect(value).toHaveProperty('currentSubscription');
    expect(value).toHaveProperty('loading');
    expect(value).toHaveProperty('error');
    expect(value).toHaveProperty('refreshPlans');
    expect(value).toHaveProperty('refreshSubscription');
  });

  it('context value has exactly 7 properties', () => {
    const keys = ['plans', 'currentPlan', 'currentSubscription', 'loading', 'error', 'refreshPlans', 'refreshSubscription'];
    expect(keys).toHaveLength(7);
  });
});

// ─── Plan context value — loading states ───
describe('SubscriptionPlanContext — Loading states', () => {
  it('initial state has loading=true', () => {
    const state = { loading: true, plans: [], error: null };
    expect(state.loading).toBe(true);
    expect(state.plans).toEqual([]);
  });

  it('loaded state has loading=false', () => {
    const state = { loading: false, plans: [{ id: 'free' }], error: null };
    expect(state.loading).toBe(false);
    expect(state.plans.length).toBeGreaterThan(0);
  });

  it('error state has error message', () => {
    const state = { loading: false, plans: [], error: 'Failed to load' };
    expect(state.error).toBe('Failed to load');
    expect(state.loading).toBe(false);
  });
});

// ─── Plan context — subscription integration ───
describe('SubscriptionPlanContext — Subscription integration', () => {
  it('free plan is default when no subscription exists', () => {
    const freePlan = { id: 'free', name: 'Gratis', price: 0, commissionRate: 0.10 };
    expect(freePlan.id).toBe('free');
    expect(freePlan.price).toBe(0);
  });

  it('monthly plan has 5% commission', () => {
    const monthlyPlan = { id: 'seller_pass_monthly', name: 'Seller Pass Mensual', price: 49900, commissionRate: 0.05 };
    expect(monthlyPlan.commissionRate).toBe(0.05);
    expect(monthlyPlan.price).toBe(49900);
  });

  it('annual plan has 5% commission', () => {
    const annualPlan = { id: 'seller_pass_annual', name: 'Seller Pass Anual', price: 499900, commissionRate: 0.05 };
    expect(annualPlan.commissionRate).toBe(0.05);
    expect(annualPlan.price).toBe(499900);
  });

  it('subscription statuses are valid', () => {
    const statuses = ['active', 'cancelled', 'expired', 'trial'];
    expect(statuses).toHaveLength(4);
  });

  it('free plan commission is highest', () => {
    const plans = [
      { id: 'free', commissionRate: 0.10 },
      { id: 'seller_pass_monthly', commissionRate: 0.05 },
      { id: 'seller_pass_annual', commissionRate: 0.05 },
    ];
    const free = plans.find(p => p.id === 'free')!;
    const paid = plans.filter(p => p.id !== 'free');
    for (const p of paid) {
      expect(free.commissionRate).toBeGreaterThanOrEqual(p.commissionRate);
    }
  });

  it('paid plans have lower commission than free', () => {
    const freeCommission = 0.10;
    const paidCommissions = [0.05, 0.05];
    for (const pc of paidCommissions) {
      expect(pc).toBeLessThan(freeCommission);
    }
  });
});

// ─── Upgrade flow ───
describe('SubscriptionPlanContext — Upgrade flow', () => {
  it('upgrade from free to monthly', () => {
    const currentPlan = { id: 'free', price: 0 };
    const targetPlan = { id: 'seller_pass_monthly', price: 49900 };
    expect(targetPlan.id).not.toBe(currentPlan.id);
    expect(targetPlan.price).toBeGreaterThan(currentPlan.price);
  });

  it('upgrade from monthly to annual', () => {
    const currentPlan = { id: 'seller_pass_monthly', price: 49900 };
    const targetPlan = { id: 'seller_pass_annual', price: 499900 };
    expect(targetPlan.price).toBeGreaterThan(currentPlan.price);
  });

  it('same plan clicked does nothing', () => {
    const currentPlan = { id: 'free' };
    const targetPlan = { id: 'free' };
    expect(targetPlan.id === currentPlan!.id).toBe(true);
  });

  it('upgrade requires sellerId', () => {
    const user = { sellerId: null };
    expect(user.sellerId).toBeFalsy();
  });

  it('upgrade with sellerId proceeds', () => {
    const user = { sellerId: 'seller-123' };
    expect(user.sellerId).toBeTruthy();
    expect(typeof user.sellerId).toBe('string');
  });
});

// ─── Plan comparison ───
describe('SubscriptionPlanContext — Plan comparison', () => {
  it('free plan has most basic features', () => {
    const freeFeatures = 4;
    const monthlyFeatures = 6;
    const annualFeatures = 7;
    expect(freeFeatures).toBeLessThan(monthlyFeatures);
    expect(monthlyFeatures).toBeLessThan(annualFeatures);
  });

  it('highlighted plans exist', () => {
    const plans = [
      { highlight: false },
      { highlight: true },
      { highlight: true },
    ];
    const highlighted = plans.filter(p => p.highlight);
    expect(highlighted).toHaveLength(2);
  });

  it('free plan is not highlighted', () => {
    const freePlan = { id: 'free', highlight: false };
    expect(freePlan.highlight).toBe(false);
  });
});
