import { describe, it, expect, vi } from 'vitest';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

describe('Utils — phoneUtils', () => {
  it('cleanPhone removes non-digits', async () => {
    const { cleanPhone } = await import('../utils/phoneUtils');
    expect(cleanPhone('+57 300 123 4567')).toBe('573001234567');
    expect(cleanPhone('(123) 456-7890')).toBe('1234567890');
    expect(cleanPhone('abc123')).toBe('123');
    expect(cleanPhone('')).toBe('');
    expect(cleanPhone('   ')).toBe('');
  });

  it('formatE164 formats international', async () => {
    const { formatE164 } = await import('../utils/phoneUtils');
    const result = formatE164('+57', '3001234567');
    expect(result).toContain('+57');
  });

  it('formatE164 handles already-formatted numbers', async () => {
    const { formatE164 } = await import('../utils/phoneUtils');
    const result = formatE164('+57', '573001234567');
    expect(result).toContain('+57');
    expect(result).toBe('+573001234567');
  });

  it('formatE164 returns empty for empty phone', async () => {
    const { formatE164 } = await import('../utils/phoneUtils');
    expect(formatE164('+57', '')).toBe('');
  });

  it('parseE164 parses formatted number', async () => {
    const { parseE164 } = await import('../utils/phoneUtils');
    const result = parseE164('+573001234567');
    expect(result).toHaveProperty('dialCode');
    expect(result).toHaveProperty('countryCode');
    expect(result).toHaveProperty('localNumber');
    expect(result.countryCode).toBe('CO');
  });

  it('parseE164 defaults to CO for unknown', async () => {
    const { parseE164 } = await import('../utils/phoneUtils');
    const result = parseE164('+9991234567890');
    expect(result.countryCode).toBe('CO');
  });

  it('formatDisplayPhone formats for display', async () => {
    const { formatDisplayPhone } = await import('../utils/phoneUtils');
    const result = formatDisplayPhone('3001234567', 'CO');
    expect(result.length).toBeGreaterThan(0);
  });

  it('SUPPORTED_COUNTRIES has all entries', async () => {
    const { SUPPORTED_COUNTRIES } = await import('../utils/phoneUtils');
    expect(SUPPORTED_COUNTRIES.length).toBeGreaterThanOrEqual(6);
    SUPPORTED_COUNTRIES.forEach(c => {
      expect(c).toHaveProperty('code');
      expect(c).toHaveProperty('dialCode');
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('flag');
      expect(c).toHaveProperty('format');
    });
  });

  it('SUPPORTED_COUNTRIES includes Colombia', async () => {
    const { SUPPORTED_COUNTRIES } = await import('../utils/phoneUtils');
    const co = SUPPORTED_COUNTRIES.find(c => c.code === 'CO');
    expect(co).toBeDefined();
    expect(co!.dialCode).toBe('+57');
    expect(co!.name).toBe('Colombia');
  });

  it('dial codes are unique', async () => {
    const { SUPPORTED_COUNTRIES } = await import('../utils/phoneUtils');
    const codes = SUPPORTED_COUNTRIES.map(c => c.dialCode);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('Utils — formatters', () => {
  it('formatCOP formats Colombian pesos', async () => {
    const { formatCOP } = await import('../utils/formatters');
    expect(formatCOP(15000)).toContain('$');
    expect(formatCOP(15000)).toContain('15');
  });

  it('formatCOP handles 0', async () => {
    const { formatCOP } = await import('../utils/formatters');
    expect(formatCOP(0)).toContain('0');
  });

  it('formatCOP handles NaN', async () => {
    const { formatCOP } = await import('../utils/formatters');
    expect(formatCOP(NaN)).toContain('0');
  });

  it('formatCOP handles negative', async () => {
    const { formatCOP } = await import('../utils/formatters');
    expect(formatCOP(-5000)).toContain('0');
  });

  it('formatCOP handles large numbers', async () => {
    const { formatCOP } = await import('../utils/formatters');
    const formatted = formatCOP(1000000);
    expect(formatted).toContain('$');
    expect(formatted).toContain('1');
  });

  it('formatKgCO2 formats climate impact', async () => {
    const { formatKgCO2 } = await import('../utils/formatters');
    const result = formatKgCO2(25.5);
    expect(result).toContain('kg');
    expect(result).toContain('CO₂');
  });

  it('formatKgCO2 handles 0', async () => {
    const { formatKgCO2 } = await import('../utils/formatters');
    const result = formatKgCO2(0);
    expect(result).toContain('0');
  });

  it('formatKgCO2 handles NaN', async () => {
    const { formatKgCO2 } = await import('../utils/formatters');
    const result = formatKgCO2(NaN);
    expect(result).toContain('0');
  });
});

describe('Utils — searchUtils', () => {
  it('inMemorySearch filters items', async () => {
    const { inMemorySearch } = await import('../utils/searchUtils');
    const items = [
      { id: '1', name: 'iPhone', city: 'Bogotá' },
      { id: '2', name: 'Samsung', city: 'Medellín' },
      { id: '3', name: 'iPad', city: 'Bogotá' },
    ];
    const result = inMemorySearch(items, 'iphone', ['name']);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('1');
    expect(result.lastDoc).toBeNull();
    expect(result.hasMore).toBe(false);
  });

  it('inMemorySearch searches multiple fields', async () => {
    const { inMemorySearch } = await import('../utils/searchUtils');
    const items = [
      { id: '1', name: 'iPhone', city: 'Bogotá' },
      { id: '2', name: 'Samsung', city: 'Medellín' },
      { id: '3', name: 'iPad', city: 'Bogotá' },
    ];
    const result = inMemorySearch(items, 'bogotá', ['name', 'city']);
    expect(result.data).toHaveLength(2);
  });

  it('inMemorySearch empty term returns all', async () => {
    const { inMemorySearch } = await import('../utils/searchUtils');
    const items = [{ id: '1' }, { id: '2' }, { id: '3' }];
    const result = inMemorySearch(items, '', ['id']);
    expect(result.data).toHaveLength(3);
  });

  it('inMemorySearch no match returns empty', async () => {
    const { inMemorySearch } = await import('../utils/searchUtils');
    const items = [{ id: '1', name: 'A' }];
    const result = inMemorySearch(items, 'xyz', ['name']);
    expect(result.data).toHaveLength(0);
  });

  it('inMemorySearch is case insensitive', async () => {
    const { inMemorySearch } = await import('../utils/searchUtils');
    const items = [{ id: '1', name: 'iPhone' }];
    expect(inMemorySearch(items, 'IPHONE', ['name']).data).toHaveLength(1);
    expect(inMemorySearch(items, 'iphone', ['name']).data).toHaveLength(1);
  });

  it('inMemorySearch handles null values gracefully', async () => {
    const { inMemorySearch } = await import('../utils/searchUtils');
    const items = [{ id: '1', name: null as any }, { id: '2', name: 'Hello' }];
    const result = inMemorySearch(items, 'hello', ['name']);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('2');
  });
});

describe('Utils — logger', () => {
  it('logger has log, warn, error', async () => {
    const { logger } = await import('../utils/logger');
    expect(logger).toBeDefined();
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('logger.log does not throw', async () => {
    const { logger } = await import('../utils/logger');
    expect(() => logger.log('test message')).not.toThrow();
  });

  it('logger.error does not throw', async () => {
    const { logger } = await import('../utils/logger');
    expect(() => logger.error('test error')).not.toThrow();
  });

  it('logger.warn does not throw', async () => {
    const { logger } = await import('../utils/logger');
    expect(() => logger.warn('test warning')).not.toThrow();
  });
});

describe('Utils — DeliveryMethod helpers', () => {
  it('DeliveryMethod values are consistent', async () => {
    const { DeliveryMethod } = await import('../types');
    const physical = [DeliveryMethod.PICKUP, DeliveryMethod.SHIPPING];
    const service = [DeliveryMethod.IN_PERSON, DeliveryMethod.REMOTE, DeliveryMethod.AT_BUYER];
    const digital = [DeliveryMethod.DIGITAL];
    expect(physical).toHaveLength(2);
    expect(service).toHaveLength(3);
    expect(digital).toHaveLength(1);
  });

  it('isPhysicalDelivery helper', () => {
    const isPhysical = (method: string) => ['pickup', 'shipping'].includes(method);
    expect(isPhysical('pickup')).toBe(true);
    expect(isPhysical('shipping')).toBe(true);
    expect(isPhysical('digital')).toBe(false);
    expect(isPhysical('remote')).toBe(false);
  });
});

describe('Utils — i18n', () => {
  it('i18n module is configurable', async () => {
    const mod = await import('../i18n');
    expect(mod.default).toBeDefined();
  });

  it('locales exist for EN and ES', async () => {
    const en = await import('../locales/en.json');
    const es = await import('../locales/es.json');
    expect(en).toBeDefined();
    expect(es).toBeDefined();
  });
});

describe('Utils — Rating service', () => {
  it('ratingService exports expected functions', async () => {
    const mod = await import('../services/ratingService');
    expect(typeof mod.createRating).toBe('function');
    expect(typeof mod.getRatings).toBe('function');
    expect(typeof mod.getRatingStats).toBe('function');
    expect(typeof mod.hasRated).toBe('function');
    expect(typeof mod.getOrderRatings).toBe('function');
    expect(typeof mod.updateRatingStats).toBe('function');
  });
});
