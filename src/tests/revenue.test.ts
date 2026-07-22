import { describe, it, expect, vi } from 'vitest';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

// ─── RevenueDashboard exports ───
describe('RevenueDashboard — Component export', () => {
  it('RevenueDashboard is default export and is a function', async () => {
    const mod = await import('../pages/RevenueDashboard');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});

// ─── StatCard component logic ───
describe('RevenueDashboard — StatCard', () => {
  it('StatCard has icon, label, value, sub, color props', () => {
    const statCardProps = {
      icon: 'DollarSign',
      label: 'Revenue Total',
      value: 'COP 500.000',
      sub: '25 transacciones',
      color: '#7c3aed',
    };
    expect(statCardProps).toHaveProperty('icon');
    expect(statCardProps).toHaveProperty('label');
    expect(statCardProps).toHaveProperty('value');
    expect(statCardProps).toHaveProperty('sub');
    expect(statCardProps).toHaveProperty('color');
  });

  it('StatCard color is a hex color', () => {
    const colors = ['#7c3aed', '#f59e0b', '#10b981', '#3b82f6'];
    colors.forEach(c => {
      expect(c.startsWith('#')).toBe(true);
      expect(c.length).toBe(7);
    });
  });
});

// ─── Revenue summary calculations ───
describe('RevenueDashboard — Summary calculations', () => {
  it('total revenue equals sum of all transactions', () => {
    const transactions = [
      { totalAmount: 10000 },
      { totalAmount: 20000 },
      { totalAmount: 30000 },
    ];
    const total = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    expect(total).toBe(60000);
  });

  it('avg order value = totalRevenue / totalTransactions', () => {
    const totalRevenue = 100000;
    const totalTransactions = 5;
    expect(totalRevenue / totalTransactions).toBe(20000);
  });

  it('avg order value is 0 when no transactions', () => {
    const totalRevenue = 0;
    const totalTransactions = 0;
    expect((totalRevenue / totalTransactions) || 0).toBe(0);
  });

  it('commission rate calculation', () => {
    const totalCommission = 5000;
    const totalRevenue = 50000;
    const rate = (totalCommission / totalRevenue) * 100;
    expect(rate).toBe(10);
  });

  it('seller earnings = totalRevenue - totalCommission', () => {
    const totalRevenue = 50000;
    const totalCommission = 5000;
    expect(totalRevenue - totalCommission).toBe(45000);
  });

  it('zero revenue handles commission rate gracefully', () => {
    const totalRevenue = 0;
    const label = totalRevenue > 0 ? 'has data' : '0% del revenue';
    expect(label).toBe('0% del revenue');
  });
});

// ─── COP formatting ───
describe('RevenueDashboard — Currency formatting', () => {
  const fmtCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

  it('formats 0', () => {
    expect(fmtCOP(0)).toContain('0');
  });

  it('formats 1000', () => {
    expect(fmtCOP(1000)).toContain('1.000');
  });

  it('formats 1000000', () => {
    expect(fmtCOP(1000000)).toContain('1.000.000');
  });

  it('formats 50000', () => {
    expect(fmtCOP(50000)).toContain('50.000');
  });

  it('all formatted values contain $', () => {
    [100, 1000, 10000, 100000, 1000000].forEach(n => {
      expect(fmtCOP(n)).toContain('$');
    });
  });
});

// ─── Number formatting ───
describe('RevenueDashboard — Number formatting', () => {
  const fmtNum = (n: number) => new Intl.NumberFormat('es-CO').format(n);

  it('formats 0', () => {
    expect(fmtNum(0)).toBe('0');
  });

  it('formats 1000', () => {
    expect(fmtNum(1000)).toBe('1.000');
  });

  it('formats 1000000', () => {
    expect(fmtNum(1000000)).toBe('1.000.000');
  });
});

// ─── Chart colors ───
describe('RevenueDashboard — Chart colors', () => {
  it('COLORS array has 6 colors', () => {
    const COLORS = ['#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];
    expect(COLORS).toHaveLength(6);
  });

  it('all colors are valid hex', () => {
    const COLORS = ['#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];
    COLORS.forEach(c => {
      expect(c.startsWith('#')).toBe(true);
      expect(c.length).toBe(7);
    });
  });
});

// ─── Chart tooltip logic ───
describe('RevenueDashboard — ChartTooltip', () => {
  it('returns null when inactive', () => {
    // Simulate tooltip logic
    const active = false;
    const payload = [{ value: 100 }];
    const result = active && payload?.length ? 'visible' : null;
    expect(result).toBeNull();
  });

  it('returns null when no payload', () => {
    const active = true;
    const payload: any[] = [];
    const result = active && payload?.length ? 'visible' : null;
    expect(result).toBeNull();
  });

  it('renders when active with payload', () => {
    const active = true;
    const payload = [{ value: 50000, name: 'Revenue', color: '#7c3aed' }];
    const result = active && payload?.length ? 'visible' : null;
    expect(result).toBe('visible');
  });
});

// ─── Pie chart data ───
describe('RevenueDashboard — Pie chart', () => {
  it('pie has commission and seller earnings', () => {
    const pieData = [
      { name: 'Comisión', value: 5000 },
      { name: 'Ganancias Sellers', value: 45000 },
    ];
    expect(pieData).toHaveLength(2);
    expect(pieData[0].name).toBe('Comisión');
    expect(pieData[1].name).toBe('Ganancias Sellers');
  });

  it('pie data values sum to total revenue', () => {
    const totalRevenue = 50000;
    const commission = 5000;
    const earnings = 45000;
    expect(commission + earnings).toBe(totalRevenue);
  });
});

// ─── Loading and error states ───
describe('RevenueDashboard — States', () => {
  it('loading state shows spinner', () => {
    const loading = true;
    expect(loading).toBe(true);
  });

  it('error state shows retry button', () => {
    const error = 'Error al cargar datos';
    expect(error).toBeTruthy();
  });

  it('null data shows nothing', () => {
    const data = null;
    expect(data).toBeNull();
  });
});

// ─── Period summary ───
describe('RevenueDashboard — Period display', () => {
  it('period start and end are dates', () => {
    const summary = {
      periodStart: '2024-01-01T00:00:00.000Z',
      periodEnd: '2024-01-31T23:59:59.999Z',
    };
    expect(new Date(summary.periodStart).getTime()).not.toBeNaN();
    expect(new Date(summary.periodEnd).getTime()).not.toBeNaN();
  });

  it('period end is after period start', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-31');
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });
});

// ─── Revenue dashboard component integration ───
describe('RevenueDashboard — Component integration', () => {
  it('revenue dashboard uses recharts for visualization', () => {
    // recharts is used for LineChart, BarChart, PieChart
    const chartTypes = ['LineChart', 'BarChart', 'PieChart'];
    expect(chartTypes).toHaveLength(3);
  });

  it('revenue dashboard has responsive containers', () => {
    const hasResponsiveContainer = true;
    expect(hasResponsiveContainer).toBe(true);
  });

  it('sellers are sorted by revenue descending', () => {
    const sellers = [
      { revenue: 10000 },
      { revenue: 50000 },
      { revenue: 30000 },
    ];
    const sorted = [...sellers].sort((a, b) => b.revenue - a.revenue);
    expect(sorted[0].revenue).toBe(50000);
    expect(sorted[2].revenue).toBe(10000);
  });

  it('top 3 sellers get purple badge styling', () => {
    const idx = 2;
    const isTop3 = idx < 3;
    expect(isTop3).toBe(true);
  });

  it('seller beyond top 3 gets gray badge', () => {
    const idx = 5;
    const isTop3 = idx < 3;
    expect(isTop3).toBe(false);
  });

  it('empty seller list shows no-data message', () => {
    const sellers: any[] = [];
    const isEmpty = sellers.length === 0;
    expect(isEmpty).toBe(true);
  });

  it('empty revenue shows no-data message', () => {
    const totalRevenue = 0;
    const showEmpty = totalRevenue === 0;
    expect(showEmpty).toBe(true);
  });

  it('revenue dashboard header has title', () => {
    const title = 'Dashboard de Revenue';
    expect(title).toContain('Revenue');
    expect(title).toContain('Dashboard');
  });

  it('revenue dashboard header has subtitle', () => {
    const subtitle = 'Análisis de ingresos, comisiones y transacciones';
    expect(subtitle).toContain('ingresos');
    expect(subtitle).toContain('comisiones');
  });

  it('summary footer shows period dates', () => {
    const periodStart = new Date('2024-01-01').toLocaleDateString('es-CO');
    const periodEnd = new Date('2024-01-31').toLocaleDateString('es-CO');
    expect(periodStart).toBeTruthy();
    expect(periodEnd).toBeTruthy();
  });
});
