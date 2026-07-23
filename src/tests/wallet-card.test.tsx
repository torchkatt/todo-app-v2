/**
 * @file tests/wallet-card.test.tsx
 * @description Tests for WalletCard — balance display, cashback, top-up button.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
    i18n: { language: 'en' },
  }),
}));

vi.mock('../config/constants', async () => {
  const actual = await vi.importActual('../config/constants');
  return {
    ...actual,
    // Ensure formatCOP works as expected in tests
  };
});

import WalletCard from '../components/wallet/WalletCard';
import type { Wallet } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const mockWallet: Wallet = {
  id: 'user-1',
  balance: 250000,          // $250.000 COP
  pendingCashback: 5000,
  lifetimeCashback: 35000, // $35.000 COP
  lifetimeSpent: 1200000,
  updatedAt: new Date().toISOString(),
};

const renderCard = (wallet: Wallet = mockWallet, onTopUp = vi.fn()) =>
  render(<WalletCard wallet={wallet} onTopUp={onTopUp} />);

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('WalletCard — Balance display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows formatted balance', () => {
    renderCard();
    // $250,000 → $250.000
    expect(screen.getByText('$250.000')).toBeDefined();
  });

  it('shows balance label', () => {
    renderCard();
    expect(screen.getByText('wallet.balance')).toBeDefined();
  });

  it('shows wallet title', () => {
    renderCard();
    expect(screen.getByText('wallet.title')).toBeDefined();
  });
});

describe('WalletCard — Cashback display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows lifetime cashback total formatted', () => {
    renderCard();
    // lifetimeCashback: $35,000 → $35.000
    expect(screen.getByText('$35.000')).toBeDefined();
  });

  it('shows cashback label', () => {
    renderCard();
    expect(screen.getByText('wallet.cashbackTotal')).toBeDefined();
  });

  it('shows zero cashback gracefully', () => {
    const zeroWallet = { ...mockWallet, lifetimeCashback: 0 };
    renderCard(zeroWallet);
    expect(screen.getByText('$0')).toBeDefined();
  });
});

describe('WalletCard — "Recargar" / Top-up button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders top-up button', () => {
    renderCard();
    expect(screen.getByText('wallet.topUp')).toBeDefined();
  });

  it('clicking top-up button calls onTopUp callback', () => {
    const onTopUp = vi.fn();
    renderCard(mockWallet, onTopUp);

    fireEvent.click(screen.getByText('wallet.topUp'));
    expect(onTopUp).toHaveBeenCalledTimes(1);
  });

  it('clicking top-up multiple times calls callback each time', () => {
    const onTopUp = vi.fn();
    renderCard(mockWallet, onTopUp);

    const btn = screen.getByText('wallet.topUp');
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(onTopUp).toHaveBeenCalledTimes(2);
  });
});
