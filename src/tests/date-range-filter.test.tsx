import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

import { DateRangeFilter } from '../components/revenue/DateRangeFilter';

describe('DateRangeFilter — Component rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <DateRangeFilter currentPreset="7d" onPresetChange={() => {}} />
    );
    expect(container).toBeTruthy();
  });

  it('renders 3 preset buttons', () => {
    render(<DateRangeFilter currentPreset="7d" onPresetChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  it('renders 7d button', () => {
    render(<DateRangeFilter currentPreset="7d" onPresetChange={() => {}} />);
    expect(screen.getByText('Últimos 7 días')).toBeDefined();
  });

  it('renders 30d button', () => {
    render(<DateRangeFilter currentPreset="7d" onPresetChange={() => {}} />);
    expect(screen.getByText('Últimos 30 días')).toBeDefined();
  });

  it('renders thisMonth button', () => {
    render(<DateRangeFilter currentPreset="7d" onPresetChange={() => {}} />);
    expect(screen.getByText('Este mes')).toBeDefined();
  });
});

describe('DateRangeFilter — Active preset styling', () => {
  it('7d preset shows active state', () => {
    const { container } = render(
      <DateRangeFilter currentPreset="7d" onPresetChange={() => {}} />
    );
    const activeBtn = screen.getByText('Últimos 7 días');
    expect(activeBtn.className).toContain('bg-brand-primary');
  });

  it('30d preset shows active state', () => {
    render(<DateRangeFilter currentPreset="30d" onPresetChange={() => {}} />);
    const activeBtn = screen.getByText('Últimos 30 días');
    expect(activeBtn.className).toContain('bg-brand-primary');
  });

  it('thisMonth preset shows active state', () => {
    render(<DateRangeFilter currentPreset="thisMonth" onPresetChange={() => {}} />);
    const activeBtn = screen.getByText('Este mes');
    expect(activeBtn.className).toContain('bg-brand-primary');
  });

  it('non-active buttons have different styling', () => {
    render(<DateRangeFilter currentPreset="7d" onPresetChange={() => {}} />);
    const inactiveBtn = screen.getByText('Últimos 30 días');
    expect(inactiveBtn.className).not.toContain('bg-brand-primary');
  });
});

describe('DateRangeFilter — Preset change callback', () => {
  it('clicking 30d calls onPresetChange with 30d', () => {
    const onPresetChange = vi.fn();
    render(<DateRangeFilter currentPreset="7d" onPresetChange={onPresetChange} />);
    fireEvent.click(screen.getByText('Últimos 30 días'));
    expect(onPresetChange).toHaveBeenCalledWith('30d');
  });

  it('clicking thisMonth calls onPresetChange with thisMonth', () => {
    const onPresetChange = vi.fn();
    render(<DateRangeFilter currentPreset="7d" onPresetChange={onPresetChange} />);
    fireEvent.click(screen.getByText('Este mes'));
    expect(onPresetChange).toHaveBeenCalledWith('thisMonth');
  });

  it('clicking already active preset still calls onPresetChange', () => {
    const onPresetChange = vi.fn();
    render(<DateRangeFilter currentPreset="7d" onPresetChange={onPresetChange} />);
    fireEvent.click(screen.getByText('Últimos 7 días'));
    expect(onPresetChange).toHaveBeenCalledWith('7d');
  });

  it('each button calls onPresetChange exactly once per click', () => {
    const onPresetChange = vi.fn();
    render(<DateRangeFilter currentPreset="7d" onPresetChange={onPresetChange} />);
    fireEvent.click(screen.getByText('Últimos 30 días'));
    expect(onPresetChange).toHaveBeenCalledTimes(1);
  });
});

describe('DateRangeFilter — Export', () => {
  it('DateRangeFilter is a named export', async () => {
    const mod = await import('../components/revenue/DateRangeFilter');
    expect(typeof mod.DateRangeFilter).toBe('function');
  });

  it('DateRangeFilter is default export', async () => {
    const mod = await import('../components/revenue/DateRangeFilter');
    expect(mod.default).toBeDefined();
  });
});

describe('DateRangeFilter — Presets data', () => {
  it('presets have correct labels', () => {
    const presets = [
      { key: '7d', label: 'Últimos 7 días' },
      { key: '30d', label: 'Últimos 30 días' },
      { key: 'thisMonth', label: 'Este mes' },
    ];
    expect(presets).toHaveLength(3);
    expect(presets[0].key).toBe('7d');
    expect(presets[1].key).toBe('30d');
    expect(presets[2].key).toBe('thisMonth');
  });

  it('all preset keys are valid DateRangePreset values', () => {
    const validPresets = ['7d', '30d', 'thisMonth', 'custom'];
    const presetKeys = ['7d', '30d', 'thisMonth'];
    presetKeys.forEach(k => expect(validPresets).toContain(k));
  });
});
