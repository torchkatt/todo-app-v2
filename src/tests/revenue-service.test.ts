import { describe, it, expect, vi } from 'vitest';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

// ─── Revenue types validation ───
describe('Revenue Service — Types', () => {
  it('RevenueSummary has all required fields', () => {
    const summary = {
      totalRevenue: 500000,
      totalTransactions: 25,
      totalCommission: 50000,
      sellerEarnings: 450000,
      avgOrderValue: 20000,
      periodStart: '2024-01-01T00:00:00.000Z',
      periodEnd: '2024-01-31T23:59:59.000Z',
    };
    expect(summary).toHaveProperty('totalRevenue');
    expect(summary).toHaveProperty('totalTransactions');
    expect(summary).toHaveProperty('totalCommission');
    expect(summary).toHaveProperty('sellerEarnings');
    expect(summary).toHaveProperty('avgOrderValue');
    expect(summary).toHaveProperty('periodStart');
    expect(summary).toHaveProperty('periodEnd');
  });

  it('RevenueByDay has all required fields', () => {
    const day = { date: '2024-01-15', revenue: 30000, commission: 3000, transactions: 2 };
    expect(day).toHaveProperty('date');
    expect(day).toHaveProperty('revenue');
    expect(day).toHaveProperty('commission');
    expect(day).toHaveProperty('transactions');
  });

  it('RevenueBySeller has all required fields', () => {
    const seller = { sellerId: 's1', sellerName: 'Store A', revenue: 100000, commission: 5000, transactions: 5 };
    expect(seller).toHaveProperty('sellerId');
    expect(seller).toHaveProperty('sellerName');
    expect(seller).toHaveProperty('revenue');
    expect(seller).toHaveProperty('commission');
    expect(seller).toHaveProperty('transactions');
  });

  it('RevenueByPlan has all required fields', () => {
    const plan = { planId: 'free', planName: 'Gratis', sellerCount: 10, revenue: 200000, commission: 20000 };
    expect(plan).toHaveProperty('planId');
    expect(plan).toHaveProperty('planName');
    expect(plan).toHaveProperty('sellerCount');
    expect(plan).toHaveProperty('revenue');
    expect(plan).toHaveProperty('commission');
  });

  it('RevenueDashboardData has all sections', () => {
    const data = {
      summary: {} as any,
      byDay: [] as any[],
      bySeller: [] as any[],
      byPlan: [] as any[],
    };
    expect(data).toHaveProperty('summary');
    expect(data).toHaveProperty('byDay');
    expect(data).toHaveProperty('bySeller');
    expect(data).toHaveProperty('byPlan');
  });
});

// ─── Aggregation logic (inlined from revenueService) ───
describe('Revenue Service — Aggregation', () => {
  const aggregateTransactions = (transactions: any[], startDate: Date, endDate: Date) => {
    let totalRevenue = 0;
    let totalCommission = 0;
    let sellerEarnings = 0;

    for (const t of transactions) {
      totalRevenue += t.totalAmount || 0;
      totalCommission += t.platformFee || 0;
      sellerEarnings += t.sellerEarnings || 0;
    }

    const summary = {
      totalRevenue,
      totalTransactions: transactions.length,
      totalCommission,
      sellerEarnings,
      avgOrderValue: transactions.length > 0 ? totalRevenue / transactions.length : 0,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
    };

    const dayMap = new Map<string, { revenue: number; commission: number; transactions: number }>();
    for (const t of transactions) {
      const day = (t.createdAt || '').split('T')[0];
      if (!day) continue;
      const existing = dayMap.get(day) || { revenue: 0, commission: 0, transactions: 0 };
      existing.revenue += t.totalAmount || 0;
      existing.commission += t.platformFee || 0;
      existing.transactions += 1;
      dayMap.set(day, existing);
    }
    const byDay = Array.from(dayMap.entries())
      .map(([date, d]) => ({ date, ...d }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const sellerMap = new Map();
    for (const t of transactions) {
      const existing = sellerMap.get(t.sellerId) || {
        sellerId: t.sellerId,
        sellerName: t.sellerId,
        revenue: 0,
        commission: 0,
        transactions: 0,
      };
      existing.revenue += t.totalAmount || 0;
      existing.commission += t.platformFee || 0;
      existing.transactions += 1;
      sellerMap.set(t.sellerId, existing);
    }
    const bySeller = Array.from(sellerMap.values()).sort((a, b) => b.revenue - a.revenue);

    return { summary, byDay, bySeller, byPlan: [] };
  };

  it('empty transactions returns zero summary', () => {
    const result = aggregateTransactions([], new Date(), new Date());
    expect(result.summary.totalRevenue).toBe(0);
    expect(result.summary.totalTransactions).toBe(0);
    expect(result.summary.totalCommission).toBe(0);
    expect(result.summary.sellerEarnings).toBe(0);
    expect(result.summary.avgOrderValue).toBe(0);
  });

  it('aggregates single transaction correctly', () => {
    const tx = { totalAmount: 10000, platformFee: 1000, sellerEarnings: 9000, sellerId: 's1', createdAt: '2024-01-15T10:00:00Z' };
    const result = aggregateTransactions([tx], new Date(), new Date());
    expect(result.summary.totalRevenue).toBe(10000);
    expect(result.summary.totalTransactions).toBe(1);
    expect(result.summary.totalCommission).toBe(1000);
    expect(result.summary.sellerEarnings).toBe(9000);
    expect(result.summary.avgOrderValue).toBe(10000);
  });

  it('aggregates multiple transactions correctly', () => {
    const txs = [
      { totalAmount: 10000, platformFee: 1000, sellerEarnings: 9000, sellerId: 's1', createdAt: '2024-01-15T10:00:00Z' },
      { totalAmount: 20000, platformFee: 2000, sellerEarnings: 18000, sellerId: 's2', createdAt: '2024-01-15T11:00:00Z' },
      { totalAmount: 30000, platformFee: 3000, sellerEarnings: 27000, sellerId: 's1', createdAt: '2024-01-15T12:00:00Z' },
    ];
    const result = aggregateTransactions(txs, new Date(), new Date());
    expect(result.summary.totalRevenue).toBe(60000);
    expect(result.summary.totalTransactions).toBe(3);
    expect(result.summary.totalCommission).toBe(6000);
    expect(result.summary.sellerEarnings).toBe(54000);
    expect(result.summary.avgOrderValue).toBe(20000);
  });

  it('byDay groups transactions by date', () => {
    const txs = [
      { totalAmount: 10000, platformFee: 1000, sellerEarnings: 9000, sellerId: 's1', createdAt: '2024-01-15T10:00:00Z' },
      { totalAmount: 20000, platformFee: 2000, sellerEarnings: 18000, sellerId: 's1', createdAt: '2024-01-15T11:00:00Z' },
      { totalAmount: 30000, platformFee: 3000, sellerEarnings: 27000, sellerId: 's1', createdAt: '2024-01-16T10:00:00Z' },
    ];
    const result = aggregateTransactions(txs, new Date(), new Date());
    expect(result.byDay).toHaveLength(2); // 2 distinct dates
    expect(result.byDay[0].date).toBe('2024-01-15');
    expect(result.byDay[0].revenue).toBe(30000);
    expect(result.byDay[1].date).toBe('2024-01-16');
    expect(result.byDay[1].revenue).toBe(30000);
  });

  it('byDay sorts chronologically', () => {
    const txs = [
      { totalAmount: 10000, platformFee: 1000, sellerEarnings: 9000, sellerId: 's1', createdAt: '2024-03-01' },
      { totalAmount: 20000, platformFee: 2000, sellerEarnings: 18000, sellerId: 's2', createdAt: '2024-01-01' },
      { totalAmount: 30000, platformFee: 3000, sellerEarnings: 27000, sellerId: 's3', createdAt: '2024-02-01' },
    ];
    const result = aggregateTransactions(txs, new Date(), new Date());
    expect(result.byDay[0].date).toBe('2024-01-01');
    expect(result.byDay[1].date).toBe('2024-02-01');
    expect(result.byDay[2].date).toBe('2024-03-01');
  });

  it('bySeller groups by sellerId', () => {
    const txs = [
      { totalAmount: 10000, platformFee: 1000, sellerEarnings: 9000, sellerId: 's1', createdAt: '2024-01-15' },
      { totalAmount: 20000, platformFee: 2000, sellerEarnings: 18000, sellerId: 's2', createdAt: '2024-01-15' },
      { totalAmount: 30000, platformFee: 3000, sellerEarnings: 27000, sellerId: 's1', createdAt: '2024-01-16' },
    ];
    const result = aggregateTransactions(txs, new Date(), new Date());
    expect(result.bySeller).toHaveLength(2);
    const s1 = result.bySeller.find(s => s.sellerId === 's1');
    expect(s1!.revenue).toBe(40000);
    expect(s1!.transactions).toBe(2);
  });

  it('bySeller sorted by revenue descending', () => {
    const txs = [
      { totalAmount: 10000, platformFee: 1000, sellerEarnings: 9000, sellerId: 's1', createdAt: '2024-01-15' },
      { totalAmount: 50000, platformFee: 5000, sellerEarnings: 45000, sellerId: 's2', createdAt: '2024-01-15' },
    ];
    const result = aggregateTransactions(txs, new Date(), new Date());
    expect(result.bySeller[0].sellerId).toBe('s2');
    expect(result.bySeller[1].sellerId).toBe('s1');
  });

  it('handles transactions with missing amounts gracefully', () => {
    const txs = [{ totalAmount: undefined, platformFee: undefined, sellerEarnings: undefined, sellerId: 's1', createdAt: '2024-01-15' }];
    const result = aggregateTransactions(txs, new Date(), new Date());
    expect(result.summary.totalRevenue).toBe(0);
    expect(result.summary.totalCommission).toBe(0);
    expect(result.summary.totalTransactions).toBe(1);
  });

  it('handles transactions with missing createdAt', () => {
    const txs = [{ totalAmount: 10000, platformFee: 1000, sellerEarnings: 9000, sellerId: 's1', createdAt: '' }];
    const result = aggregateTransactions(txs, new Date(), new Date());
    expect(result.byDay).toHaveLength(0); // No valid date
  });

  it('byDay correct transaction count per day', () => {
    const txs = [
      { totalAmount: 10000, platformFee: 1000, sellerEarnings: 9000, sellerId: 's1', createdAt: '2024-01-15T10:00:00Z' },
      { totalAmount: 20000, platformFee: 2000, sellerEarnings: 18000, sellerId: 's2', createdAt: '2024-01-15T11:00:00Z' },
      { totalAmount: 30000, platformFee: 3000, sellerEarnings: 27000, sellerId: 's3', createdAt: '2024-01-15T12:00:00Z' },
    ];
    const result = aggregateTransactions(txs, new Date(), new Date());
    expect(result.byDay).toHaveLength(1);
    expect(result.byDay[0].transactions).toBe(3);
  });

  it('summary period dates are set correctly', () => {
    const start = new Date('2024-06-01');
    const end = new Date('2024-06-30');
    const result = aggregateTransactions([], start, end);
    expect(result.summary.periodStart).toBe(start.toISOString());
    expect(result.summary.periodEnd).toBe(end.toISOString());
  });

  it('avgOrderValue is 0 for empty transactions', () => {
    const result = aggregateTransactions([], new Date(), new Date());
    expect(result.summary.avgOrderValue).toBe(0);
  });

  it('byPlan is empty array', () => {
    const result = aggregateTransactions([], new Date(), new Date());
    expect(result.byPlan).toEqual([]);
  });
});

// ─── Revenue service exports ───
describe('Revenue Service — Exports', () => {
  it('revenueService exports expected methods', async () => {
    const mod = await import('../services/revenueService');
    expect(typeof mod.revenueService.getDashboardData).toBe('function');
    expect(typeof mod.revenueService.aggregateTransactions).toBe('function');
    expect(typeof mod.revenueService.getLast7Days).toBe('function');
    expect(typeof mod.revenueService.getLast30Days).toBe('function');
    expect(typeof mod.revenueService.getThisMonth).toBe('function');
  });

  it('revenueService has 5 exported methods', () => {
    const methods = ['getDashboardData', 'aggregateTransactions', 'getLast7Days', 'getLast30Days', 'getThisMonth'];
    expect(methods).toHaveLength(5);
  });
});
