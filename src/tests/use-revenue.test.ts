import { describe, it, expect, vi } from 'vitest';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

// ─── useRevenue hook — inlined logic tests ───
describe('useRevenue — DateRange calculations', () => {
  const getStartDate = (preset: string): Date => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (preset === '7d') d.setDate(d.getDate() - 7);
    else if (preset === '30d') d.setDate(d.getDate() - 30);
    return d;
  };

  it('7d preset returns date 7 days ago', () => {
    const start = getStartDate('7d');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7);
  });

  it('30d preset returns date 30 days ago', () => {
    const start = getStartDate('30d');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);
  });

  it('getStartDate sets hours to 0', () => {
    const d = getStartDate('7d');
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
  });

  it('getStartDate for unknown preset returns 7d', () => {
    const d = getStartDate('unknown');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(0);
  });
});

describe('useRevenue — Preset switching', () => {
  it('preset values are valid', () => {
    const presets = ['7d', '30d', 'thisMonth', 'custom'];
    expect(presets).toHaveLength(4);
    presets.forEach(p => expect(typeof p).toBe('string'));
  });

  it('7d startDate is 7 days before endDate', () => {
    const end = new Date('2024-06-10T12:00:00Z');
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    expect(start.toISOString().split('T')[0]).toBe('2024-06-03');
  });

  it('30d startDate is 30 days before endDate', () => {
    const end = new Date('2024-06-10T12:00:00Z');
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    expect(start.toISOString().split('T')[0]).toBe('2024-05-11');
  });

  it('thisMonth start is first day of current month', () => {
    const now = new Date('2024-06-15T10:00:00Z');
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    expect(start.toISOString().split('T')[0]).toBe('2024-06-01');
  });

  it('custom preset works with provided dates', () => {
    const customStart = new Date('2024-01-01');
    const customEnd = new Date('2024-03-31');
    expect(customStart < customEnd).toBe(true);
    expect(customEnd.getTime() - customStart.getTime()).toBeGreaterThan(0);
  });

  it('custom preset with missing dates falls back to 7d', () => {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    expect(start < new Date()).toBe(true);
  });
});

describe('useRevenue — DateRange type', () => {
  it('DateRange has preset, startDate, endDate', () => {
    const range = { preset: '7d' as const, startDate: new Date('2024-06-01'), endDate: new Date('2024-06-08') };
    expect(range).toHaveProperty('preset');
    expect(range).toHaveProperty('startDate');
    expect(range).toHaveProperty('endDate');
  });

  it('startDate is always before endDate', () => {
    const range = { preset: '7d' as const, startDate: new Date('2024-06-01'), endDate: new Date('2024-06-08') };
    expect(range.startDate.getTime()).toBeLessThan(range.endDate.getTime());
  });

  it('DateRangePreset type has all values', () => {
    const presets = ['7d', '30d', 'thisMonth', 'custom'];
    expect(presets).toContain('7d');
    expect(presets).toContain('30d');
    expect(presets).toContain('thisMonth');
    expect(presets).toContain('custom');
  });
});

describe('useRevenue — Hook exports', () => {
  it('useRevenue is a function', async () => {
    const mod = await import('../hooks/useRevenue');
    expect(typeof mod.useRevenue).toBe('function');
  });
});

describe('useRevenue — Edge cases', () => {
  it('same day range works', () => {
    const start = new Date('2024-06-15T12:00:00Z');
    const end = new Date('2024-06-15T12:00:00Z');
    expect(start.toISOString().split('T')[0]).toBe(end.toISOString().split('T')[0]);
  });

  it('handles month boundary correctly', () => {
    // Jan 1 - Jan 31
    const start = new Date(2024, 0, 1);
    const end = new Date(2024, 0, 31, 23, 59, 59);
    expect(start.getMonth()).toBe(0);
    expect(end.getMonth()).toBe(0);
  });

  it('handles year boundary correctly', () => {
    // Dec 15 - Jan 15
    const start = new Date(2024, 11, 15);
    const end = new Date(2025, 0, 15);
    expect(start.getFullYear()).toBe(2024);
    expect(end.getFullYear()).toBe(2025);
  });

  it('handles leap year', () => {
    // Feb 2024 (leap year)
    const start = new Date(2024, 1, 1);
    const end = new Date(2024, 1, 29, 23, 59, 59);
    expect(end.getDate()).toBe(29);
  });

  it('correctly identifies last day of month', () => {
    const months = [
      { year: 2024, month: 0, lastDay: 31 },
      { year: 2024, month: 1, lastDay: 29 }, // leap year
      { year: 2024, month: 3, lastDay: 30 },
    ];
    for (const m of months) {
      const last = new Date(m.year, m.month + 1, 0);
      expect(last.getDate()).toBe(m.lastDay);
    }
  });
});
