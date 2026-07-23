/**
 * @file tests/cashback-badge.test.tsx
 * @description Tests for CashbackBadge component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ─── Hoisted mocks ──────────────────────────────────────────────────────────
const { mockGetPendingTotal, mockNavigate } = vi.hoisted(() => ({
  mockGetPendingTotal: vi.fn(),
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

vi.mock('../services/cashbackService', () => ({
  cashbackService: {
    getPendingTotal: mockGetPendingTotal,
  },
}));

import CashbackBadge from '../components/wallet/CashbackBadge';

describe('CashbackBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no cashback available (total is 0)', async () => {
    mockGetPendingTotal.mockResolvedValue(0);

    const { container } = render(
      <MemoryRouter>
        <CashbackBadge />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('renders nothing when cashback is null/loading error', async () => {
    mockGetPendingTotal.mockResolvedValue(null as any);

    const { container } = render(
      <MemoryRouter>
        <CashbackBadge />
      </MemoryRouter>,
    );

    // Wait for async useEffect to settle
    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('shows badge with total when cashback > 0', async () => {
    mockGetPendingTotal.mockResolvedValue(25000);

    render(
      <MemoryRouter>
        <CashbackBadge />
      </MemoryRouter>,
    );

    // Text includes emoji prefix: "💰 cashback.title"
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('cashback.title'))).toBeDefined();
    });

    expect(screen.getByText('$25.000')).toBeDefined();
    expect(screen.getByText((content) => content.includes('cashback.claim'))).toBeDefined();
  });

  it('click navigates to /wallet', async () => {
    mockGetPendingTotal.mockResolvedValue(10000);

    render(
      <MemoryRouter>
        <CashbackBadge />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('cashback.title'))).toBeDefined();
    });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/wallet');
  });
});
