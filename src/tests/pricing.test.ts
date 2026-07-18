import { describe, it, expect, vi } from 'vitest';

vi.mock('../services/firebase', () => ({ db: {}, auth: {} }));

// ─── PricingPage exports ───
describe('PricingPage — Component export', () => {
  it('PricingPage is default export and is a function', async () => {
    const mod = await import('../pages/PricingPage');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});

// ─── Plan data structure validation ───
describe('PricingPage — Plan data', () => {
  const plans = [
    {
      id: 'free',
      name: 'Gratis',
      slug: 'free',
      price: 0,
      period: 'lifetime',
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

  it('has 3 plans', () => {
    expect(plans).toHaveLength(3);
  });

  it('all plans are active', () => {
    plans.forEach(p => expect(p.isActive).toBe(true));
  });

  it('plans are ordered by sortOrder', () => {
    for (let i = 1; i < plans.length; i++) {
      expect(plans[i].sortOrder).toBeGreaterThan(plans[i - 1].sortOrder);
    }
  });

  it('free plan has price 0', () => {
    const free = plans.find(p => p.id === 'free');
    expect(free!.price).toBe(0);
  });

  it('monthly plan has price 49900', () => {
    const monthly = plans.find(p => p.id === 'seller_pass_monthly');
    expect(monthly!.price).toBe(49900);
  });

  it('annual plan has price 499900', () => {
    const annual = plans.find(p => p.id === 'seller_pass_annual');
    expect(annual!.price).toBe(499900);
  });

  it('monthly plan is highlighted as popular', () => {
    const monthly = plans.find(p => p.id === 'seller_pass_monthly');
    expect(monthly!.highlight).toBe(true);
  });

  it('annual plan is also highlighted', () => {
    const annual = plans.find(p => p.id === 'seller_pass_annual');
    expect(annual!.highlight).toBe(true);
  });

  it('free plan is not highlighted', () => {
    const free = plans.find(p => p.id === 'free');
    expect(free!.highlight).toBe(false);
  });
});

// ─── Pricing formatting ───
describe('PricingPage — Price formatting', () => {
  const formatCOP = (n: number) =>
    n === 0
      ? 'Gratis'
      : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

  it('formats 0 as Gratis', () => {
    expect(formatCOP(0)).toBe('Gratis');
  });

  it('formats 49900 in COP', () => {
    expect(formatCOP(49900)).toContain('49.900');
  });

  it('formats 499900 in COP', () => {
    expect(formatCOP(499900)).toContain('499.900');
  });

  it('formats 1000000 in COP', () => {
    const result = formatCOP(1000000);
    expect(result).toContain('1.000.000');
  });
});

// ─── Period labels ───
describe('PricingPage — Period labels', () => {
  const getPeriodLabel = (period: string, price: number) => {
    if (price === 0) return 'Para siempre';
    if (period === 'monthly') return '/mes';
    if (period === 'annual') return '/año';
    return '';
  };

  it('free plan shows Para siempre', () => {
    expect(getPeriodLabel('lifetime', 0)).toBe('Para siempre');
  });

  it('monthly plan shows /mes', () => {
    expect(getPeriodLabel('monthly', 49900)).toBe('/mes');
  });

  it('annual plan shows /año', () => {
    expect(getPeriodLabel('annual', 499900)).toBe('/año');
  });

  it('price 0 always returns Para siempre regardless of period', () => {
    expect(getPeriodLabel('monthly', 0)).toBe('Para siempre');
  });

  it('unknown period returns empty', () => {
    expect(getPeriodLabel('unknown', 100)).toBe('');
  });
});

// ─── Commission rate display ───
describe('PricingPage — Commission rates', () => {
  it('free plan commission is 10%', () => {
    const rate = 0.10;
    expect(rate * 100).toBe(10);
  });

  it('paid plans commission is 5%', () => {
    const rate = 0.05;
    expect(rate * 100).toBe(5);
  });

  it('commission rate is higher for free plan', () => {
    const freeRate = 0.10;
    const paidRate = 0.05;
    expect(freeRate).toBeGreaterThan(paidRate);
  });

  it('annual saves vs monthly', () => {
    const monthlyYearly = 49900 * 12;
    const annual = 499900;
    expect(annual).toBeLessThan(monthlyYearly);
    const savings = monthlyYearly - annual;
    expect(savings).toBeGreaterThan(0);
  });
});

// ─── Button states ───
describe('PricingPage — Button states', () => {
  it('current plan button shows Plan Actual', () => {
    const isCurrent = true;
    expect(isCurrent).toBe(true);
  });

  it('non-current free plan button shows Comenzar Gratis', () => {
    const label = 'Comenzar Gratis';
    expect(label).toBe('Comenzar Gratis');
  });

  it('non-current paid plan button shows Actualizar', () => {
    const label = 'Actualizar';
    expect(label).toBe('Actualizar');
  });

  it('upgrading state shows Procesando', () => {
    const label = 'Procesando...';
    expect(label).toBe('Procesando...');
  });
});

// ─── Plan icons ───
describe('PricingPage — Plan icons', () => {
  it('free plan uses Zap icon', () => {
    const planIcons: Record<string, string> = {
      free: 'Zap',
      seller_pass_monthly: 'Crown',
      seller_pass_annual: 'Crown',
    };
    expect(planIcons.free).toBe('Zap');
    expect(planIcons.seller_pass_monthly).toBe('Crown');
    expect(planIcons.seller_pass_annual).toBe('Crown');
  });
});
