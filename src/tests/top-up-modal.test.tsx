/**
 * @file tests/top-up-modal.test.tsx
 * @description Tests for TopUpModal component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';

// ─── Hoisted mocks ──────────────────────────────────────────────────────────
const { mockTopUp } = vi.hoisted(() => ({
  mockTopUp: vi.fn(),
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

const mockUser = { id: 'user_1', email: 'test@test.com', fullName: 'Test User' };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../services/walletService', () => ({
  walletService: {
    topUp: mockTopUp,
  },
}));

import TopUpModal from '../components/wallet/TopUpModal';

describe('TopUpModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <TopUpModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows preset amounts when open', () => {
    render(
      <TopUpModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    expect(screen.getByText('wallet.topUpAmount')).toBeDefined();
    expect(screen.getByText('$20.000')).toBeDefined();
    expect(screen.getByText('$50.000')).toBeDefined();
    expect(screen.getByText('$100.000')).toBeDefined();
    expect(screen.getByText('$200.000')).toBeDefined();
    expect(screen.getByText('$500.000')).toBeDefined();
  });

  it('custom amount input works', () => {
    render(
      <TopUpModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const input = screen.getByPlaceholderText('0');
    fireEvent.change(input, { target: { value: '75000' } });

    // The submit button text should show the amount
    expect(screen.getByText('wallet.topUp $75.000')).toBeDefined();
  });

  it('calls walletService.topUp on submit', async () => {
    mockTopUp.mockResolvedValue({ balance: 150000 });

    render(
      <TopUpModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    // Click a preset button
    fireEvent.click(screen.getByText('$50.000'));

    // Submit
    fireEvent.click(screen.getByText('wallet.topUp $50.000'));

    await waitFor(() => {
      expect(mockTopUp).toHaveBeenCalledWith('user_1', 50000);
    });

    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes on X button click', () => {
    render(
      <TopUpModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    // The first button is the X close button (before presets)
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons[0]; // X button is first
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('submit button is disabled when no amount selected', () => {
    render(
      <TopUpModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const submitButton = screen.getByText('wallet.topUp');
    expect(submitButton).toBeDisabled();
  });
});
