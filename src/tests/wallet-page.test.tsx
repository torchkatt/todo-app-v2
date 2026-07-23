/**
 * @file tests/wallet-page.test.tsx
 * @description Tests for WalletPage component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ─── Hoisted mocks ──────────────────────────────────────────────────────────
const { mockGetWallet, mockGetTransactions, mockNavigate } = vi.hoisted(() => ({
  mockGetWallet: vi.fn(),
  mockGetTransactions: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../services/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
  functions: {},
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUser = { id: 'user_1', email: 'test@test.com', fullName: 'Test User' };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../services/walletService', () => ({
  walletService: {
    getWallet: mockGetWallet,
    getTransactions: mockGetTransactions,
  },
}));

import WalletPage from '../pages/WalletPage';

describe('WalletPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders wallet card when loaded', async () => {
    mockGetWallet.mockResolvedValue({
      id: 'user_1',
      balance: 150000,
      pendingCashback: 0,
      lifetimeCashback: 50000,
      lifetimeSpent: 200000,
      updatedAt: new Date().toISOString(),
    });
    mockGetTransactions.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <WalletPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('$150.000')).toBeDefined();
    });

    // wallet.title appears in both header and WalletCard — use getAllByText
    expect(screen.getAllByText('wallet.title').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('wallet.balance')).toBeDefined();
    expect(screen.getByText('wallet.topUp')).toBeDefined();
  });

  it('shows loading state', () => {
    // Never resolve to keep loading
    mockGetWallet.mockReturnValue(new Promise(() => {}));
    mockGetTransactions.mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <MemoryRouter>
        <WalletPage />
      </MemoryRouter>,
    );

    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('shows empty transactions state', async () => {
    mockGetWallet.mockResolvedValue({
      id: 'user_1',
      balance: 50000,
      pendingCashback: 0,
      lifetimeCashback: 0,
      lifetimeSpent: 0,
      updatedAt: new Date().toISOString(),
    });
    mockGetTransactions.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <WalletPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('wallet.noMovements')).toBeDefined();
    });

    expect(screen.getByText('wallet.topUpToStart')).toBeDefined();
  });

  it('renders TopUpModal trigger', async () => {
    mockGetWallet.mockResolvedValue({
      id: 'user_1',
      balance: 100000,
      pendingCashback: 0,
      lifetimeCashback: 0,
      lifetimeSpent: 0,
      updatedAt: new Date().toISOString(),
    });
    mockGetTransactions.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <WalletPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const topUpButtons = screen.getAllByText('wallet.topUp');
      expect(topUpButtons.length).toBeGreaterThanOrEqual(1);
    });
  });
});
