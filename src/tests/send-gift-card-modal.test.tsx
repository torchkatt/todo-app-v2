/**
 * @file tests/send-gift-card-modal.test.tsx
 * @description Tests for SendGiftCardModal — design picker, name, amount, create, close, errors.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Hoisted mocks ──────────────────────────────────────────────────────────
const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
    i18n: { language: 'en' },
  }),
}));

const mockUser = { id: 'user_1', email: 'test@test.com', fullName: 'Test User' };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../services/giftCardService', () => ({
  giftCardService: {
    create: mockCreate,
  },
}));

import SendGiftCardModal from '../components/wallet/SendGiftCardModal';
import type { GiftCard } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const mockOnClose = vi.fn();
const mockOnSuccess = vi.fn();

function renderModal(isOpen = true) {
  return render(
    <SendGiftCardModal
      isOpen={isOpen}
      onClose={mockOnClose}
      onSuccess={mockOnSuccess}
    />,
  );
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('SendGiftCardModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({
      id: 'new_card_1',
      userId: 'user_1',
      name: 'Gift Card',
      balance: 50000,
      originalAmount: 50000,
      design: 'default',
      status: 'ACTIVE' as const,
      source: 'purchased' as const,
      isPrimary: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as GiftCard);
  });

  // ── 1. Hidden when closed ──
  it('renders nothing when isOpen is false', () => {
    const { container } = renderModal(false);
    expect(container.innerHTML).toBe('');
  });

  // ── 2. Shows design picker ──
  it('shows design picker with all design options', () => {
    renderModal();

    expect(screen.getByText('Elige un diseño')).toBeDefined();
    // Labels are i18n keys (mock returns the key itself)
    expect(screen.getByText('giftCard.designDefault')).toBeDefined();
    expect(screen.getByText('giftCard.designBirthday')).toBeDefined();
    expect(screen.getByText('giftCard.designCelebration')).toBeDefined();
    expect(screen.getByText('giftCard.designThanks')).toBeDefined();
    expect(screen.getByText('giftCard.designHoliday')).toBeDefined();
  });

  // ── 3. Card name input works ──
  it('allows user to enter a card name', () => {
    renderModal();

    // Go to name step
    fireEvent.click(screen.getByText('Continuar'));

    const input = screen.getByPlaceholderText('Ej: Para mamá');
    fireEvent.change(input, { target: { value: 'Regalo de cumpleaños' } });

    expect(screen.getByDisplayValue('Regalo de cumpleaños')).toBeDefined();
  });

  // ── 4. Amount presets work ──
  it('amount presets are clickable and navigate to confirm', () => {
    renderModal();

    // Navigate through steps: design → name → message → amount
    fireEvent.click(screen.getByText('Continuar')); // design → name
    fireEvent.click(screen.getByText('Continuar')); // name → message
    fireEvent.click(screen.getByText('Continuar')); // message → amount

    // Click a preset amount
    expect(screen.getByText('$20.000')).toBeDefined();
    fireEvent.click(screen.getByText('$50.000'));

    // Go to confirm
    fireEvent.click(screen.getByText('Revisar'));

    // Should show the create button with amount
    expect(screen.getByText(/Crear gift card/)).toBeDefined();
  });

  // ── 5. "Crear gift card" calls giftCardService.create ──
  it('"Crear gift card" button calls giftCardService.create', async () => {
    renderModal();

    // Navigate through all steps to confirm
    fireEvent.click(screen.getByText('Continuar')); // design → name
    fireEvent.click(screen.getByText('Continuar')); // name → message
    fireEvent.click(screen.getByText('Continuar')); // message → amount
    fireEvent.click(screen.getByText('$50.000'));    // select amount
    fireEvent.click(screen.getByText('Revisar'));    // → confirm

    // Click create
    const createButton = screen.getByText(/Crear gift card/);
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        'user_1',
        'Gift Card', // default name when none entered
        50000,
        'default',
        undefined,
      );
    });

    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  // ── 6. Closes on X button ──
  it('closes when X button is clicked', () => {
    renderModal();

    // The X close button is next to the header
    // It's the button that contains an X icon — the first button with an SVG
    const buttons = screen.getAllByRole('button');
    // In the design step, buttons are: [X close, design options (5), Continuar]
    // Actually looking at the DOM: header has X button + design picker has 5 buttons + footer has 1 button = 7
    // The X button is first
    fireEvent.click(buttons[0]);
    expect(mockOnClose).toHaveBeenCalled();
  });

  // ── 7. Error message display ──
  it('displays error message when creation fails', async () => {
    mockCreate.mockRejectedValue(new Error('Saldo insuficiente'));

    renderModal();

    // Navigate to confirm
    fireEvent.click(screen.getByText('Continuar')); // design → name
    fireEvent.click(screen.getByText('Continuar')); // name → message
    fireEvent.click(screen.getByText('Continuar')); // message → amount
    fireEvent.click(screen.getByText('$50.000'));    // select amount
    fireEvent.click(screen.getByText('Revisar'));    // → confirm

    // Click create
    const createButton = screen.getByText(/Crear gift card/);
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Saldo insuficiente')).toBeDefined();
    });
  });
});
