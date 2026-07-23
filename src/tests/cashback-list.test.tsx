/**
 * @file tests/cashback-list.test.tsx
 * @description Tests for CashbackList component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';

// ─── Hoisted mocks ──────────────────────────────────────────────────────────
const {
  mockGetPendingCashback,
  mockGetPendingTotal,
  mockClaimCashback,
  mockClaimAll,
} = vi.hoisted(() => ({
  mockGetPendingCashback: vi.fn(),
  mockGetPendingTotal: vi.fn(),
  mockClaimCashback: vi.fn(),
  mockClaimAll: vi.fn(),
}));

vi.mock('../services/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
  functions: {},
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, vars?: Record<string, any>) => {
      // Simple interpolation for test assertions
      if (vars) {
        let result = k;
        for (const [key, val] of Object.entries(vars)) {
          result = result.replace(`{{${key}}}`, String(val));
        }
        return result;
      }
      return k;
    },
    i18n: { language: 'en' },
  }),
}));

const mockUser = { id: 'user_1', email: 'test@test.com', fullName: 'Test User' };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../services/cashbackService', () => ({
  cashbackService: {
    getPendingCashback: mockGetPendingCashback,
    getPendingTotal: mockGetPendingTotal,
    claimCashback: mockClaimCashback,
    claimAll: mockClaimAll,
  },
}));

import CashbackList from '../components/wallet/CashbackList';

// Helper to create mock cashback records
function makeRecord(overrides: Record<string, any> = {}) {
  return {
    id: 'cb_1',
    userId: 'user_1',
    transactionId: 'tx_1',
    amount: 5000,
    rateBps: 300,
    status: 'AVAILABLE',
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('CashbackList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows list of pending cashbacks', async () => {
    const records = [
      makeRecord({ id: 'cb_1', amount: 5000, rateBps: 300 }),
      makeRecord({ id: 'cb_2', amount: 12000, rateBps: 500 }),
    ];

    mockGetPendingCashback.mockResolvedValue(records);
    mockGetPendingTotal.mockResolvedValue(17000);

    render(<CashbackList />);

    await waitFor(() => {
      expect(screen.getByText('cashback.total')).toBeDefined();
    });

    expect(screen.getByText('$17.000')).toBeDefined();

    const claimButtons = screen.getAllByText('cashback.claim');
    expect(claimButtons.length).toBe(2);
  });

  it('renders nothing when no records', async () => {
    mockGetPendingCashback.mockResolvedValue([]);
    mockGetPendingTotal.mockResolvedValue(0);

    const { container } = render(<CashbackList />);

    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('claim button calls claimCashback', async () => {
    const records = [makeRecord({ id: 'cb_1', amount: 5000 })];
    mockGetPendingCashback.mockResolvedValue(records);
    mockGetPendingTotal.mockResolvedValue(5000);
    mockClaimCashback.mockResolvedValue(undefined);

    render(<CashbackList />);

    await waitFor(() => {
      expect(screen.getByText('cashback.claim')).toBeDefined();
    });

    fireEvent.click(screen.getByText('cashback.claim'));

    await waitFor(() => {
      expect(mockClaimCashback).toHaveBeenCalledWith('user_1', 'cb_1');
    });
  });

  it('claim all button works', async () => {
    const records = [
      makeRecord({ id: 'cb_1', amount: 5000 }),
      makeRecord({ id: 'cb_2', amount: 12000 }),
    ];
    mockGetPendingCashback.mockResolvedValue(records);
    mockGetPendingTotal.mockResolvedValue(17000);
    mockClaimAll.mockResolvedValue(17000);

    render(<CashbackList />);

    await waitFor(() => {
      expect(screen.getByText((content) => content.startsWith('cashback.claimAll'))).toBeDefined();
    });

    fireEvent.click(screen.getByText((content) => content.startsWith('cashback.claimAll')));

    await waitFor(() => {
      expect(mockClaimAll).toHaveBeenCalledWith('user_1');
    });
  });

  it('shows expiring soon warning', async () => {
    const records = [
      makeRecord({
        id: 'cb_1',
        amount: 5000,
        rateBps: 300,
        expiresAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      }),
    ];

    mockGetPendingCashback.mockResolvedValue(records);
    mockGetPendingTotal.mockResolvedValue(5000);

    render(<CashbackList />);

    await waitFor(() => {
      expect(screen.getByText((content) => content.startsWith('cashback.expiringCount'))).toBeDefined();
    });
  });

  it('does not show claim all with single record', async () => {
    const records = [makeRecord({ id: 'cb_1', amount: 5000 })];
    mockGetPendingCashback.mockResolvedValue(records);
    mockGetPendingTotal.mockResolvedValue(5000);

    render(<CashbackList />);

    await waitFor(() => {
      expect(screen.getByText('cashback.claim')).toBeDefined();
    });

    // The claimAll text should not appear (records.length <= 1)
    expect(screen.queryByText(/cashback.claimAll/)).toBeNull();
  });
});
