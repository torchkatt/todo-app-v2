import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

import TierBadge from '../components/ui/TierBadge';

describe('TierBadge — Free tier', () => {
  it('shows "Vendedor" for free tier', () => {
    render(<TierBadge tier="free" />);
    expect(screen.getByText('Vendedor')).toBeDefined();
  });

  it('does not show crown or star icons for free tier', () => {
    const { container } = render(<TierBadge tier="free" />);
    const crowns = container.querySelectorAll('.lucide-crown');
    const stars = container.querySelectorAll('.lucide-star');
    expect(crowns.length).toBe(0);
    expect(stars.length).toBe(0);
  });
});

describe('TierBadge — Pro tier', () => {
  it('shows "Pro" with crown icon for pro tier', () => {
    const { container } = render(<TierBadge tier="pro" />);
    expect(screen.getByText('Pro')).toBeDefined();
    const crowns = container.querySelectorAll('.lucide-crown');
    expect(crowns.length).toBe(1);
  });

  it('has purple background for pro tier', () => {
    const { container } = render(<TierBadge tier="pro" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-purple-600');
  });
});

describe('TierBadge — Black tier', () => {
  it('shows "Black" with star icon for black tier', () => {
    const { container } = render(<TierBadge tier="black" />);
    expect(screen.getByText('Black')).toBeDefined();
    const stars = container.querySelectorAll('.lucide-star');
    expect(stars.length).toBe(1);
  });

  it('has amber background for black tier', () => {
    const { container } = render(<TierBadge tier="black" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-amber-500');
  });
});

describe('TierBadge — Size variants', () => {
  it('renders sm size with smaller classes', () => {
    const { container } = render(<TierBadge tier="pro" size="sm" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('text-[10px]');
  });

  it('renders md size as default with medium classes', () => {
    const { container } = render(<TierBadge tier="pro" size="md" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('text-xs');
  });

  it('renders lg size with larger classes', () => {
    const { container } = render(<TierBadge tier="pro" size="lg" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('text-sm');
  });

  it('defaults to md size when no size is provided', () => {
    const { container } = render(<TierBadge tier="free" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('text-xs');
  });
});

describe('TierBadge — Default/unknown tier', () => {
  it('shows "Vendedor" for unknown tier string', () => {
    render(<TierBadge tier="premium" />);
    expect(screen.getByText('Vendedor')).toBeDefined();
  });
});
