import { useState, useEffect, useCallback } from 'react';
import { revenueService, RevenueDashboardData } from '../services/revenueService';

export type DateRangePreset = '7d' | '30d' | 'thisMonth' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  startDate: Date;
  endDate: Date;
}

export function useRevenue(initialRange?: DateRange) {
  const [dateRange, setDateRange] = useState<DateRange>(
    initialRange || { preset: '7d', startDate: getStartDate('7d'), endDate: new Date() },
  );
  const [data, setData] = useState<RevenueDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (range: DateRange) => {
    setLoading(true);
    setError(null);
    try {
      const result = await revenueService.getDashboardData(range.startDate, range.endDate);
      setData(result);
    } catch (e: any) {
      setError(e.message || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateRange);
  }, [dateRange, fetchData]);

  const setPreset = useCallback((preset: DateRangePreset, customStart?: Date, customEnd?: Date) => {
    let startDate: Date;
    let endDate: Date;

    switch (preset) {
      case '7d':
        startDate = getStartDate('7d');
        endDate = new Date();
        break;
      case '30d':
        startDate = getStartDate('30d');
        endDate = new Date();
        break;
      case 'thisMonth': {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      }
      case 'custom':
        if (customStart && customEnd) {
          startDate = customStart;
          endDate = customEnd;
        } else {
          startDate = getStartDate('7d');
          endDate = new Date();
        }
        break;
    }

    setDateRange({ preset, startDate, endDate });
  }, []);

  return { data, loading, error, dateRange, setPreset, refresh: () => fetchData(dateRange) };
}

function getStartDate(preset: string): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (preset === '7d') d.setDate(d.getDate() - 7);
  else if (preset === '30d') d.setDate(d.getDate() - 30);
  return d;
}
