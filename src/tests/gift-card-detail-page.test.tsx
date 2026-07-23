/**
 * @file tests/gift-card-detail-page.test.tsx
 * @description Tests for GiftCardDetailPage — loading, card info, transactions, transfer, deactivate.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

// ─── Hoisted mocks ──────────────────────────────────────────────────────────
const { mockGetCard, mockGetTransactions, mockGetActiveCards, mockTransfer, mockDeactivate } = vi.hoisted(() => ({
  mockGetCard: vi.fn(),
  mockGetTransactions: vi.fn(),
  mockGetActiveCards: vi.fn(),
  mockTransfer: vi.fn(),
  mockDeactivate: vi.fn(),
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
    getCard: mockGetCard,
    getTransactions: mockGetTransactions,
    getActiveCards: mockGetActiveCards,
    transfer: mockTransfer,
    deactivate: mockDeactivate,
  },
}));

import GiftCardDetailPage from '../pages/GiftCardDetailPage';
import type { GiftCard, GiftCardTransaction } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const mockCard: GiftCard = {
  id: 'card_abc',
  userId: 'user_1',
  name: 'Mi Gift Card',
  balance: 75000,
  originalAmount: 100000,
  message: 'Feliz cumpleaños!',
  design: 'birthday',
  status: 'ACTIVE',
  source: 'purchased',
  isPrimary: true,
  expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockTxs: GiftCardTransaction[] = [
  {
    id: 'tx_1',
    cardId: 'card_abc',
    userId: 'user_1',
    type: 'LOAD',
    amount: 100000,
    balanceBefore: 0,
    balanceAfter: 100000,
    description: 'Creación de gift card',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx_2',
    cardId: 'card_abc',
    userId: 'user_1',
    type: 'PURCHASE',
    amount: 25000,
    balanceBefore: 100000,
    balanceAfter: 75000,
    description: 'Compra en tienda',
    createdAt: new Date().toISOString(),
  },
];

function renderPage(cardId = 'card_abc') {
  return render(
    <MemoryRouter initialEntries={[`/gift-cards/${cardId}`]}>
      <Routes>
        <Route path="/gift-cards/:id" element={<GiftCardDetailPage />} />
        <Route path="/gift-cards" element={<div>Gift Cards Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('GiftCardDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCard.mockResolvedValue(mockCard);
    mockGetTransactions.mockResolvedValue(mockTxs);
    mockGetActiveCards.mockResolvedValue([mockCard]);
    mockTransfer.mockResolvedValue(undefined);
    mockDeactivate.mockResolvedValue(undefined);
  });

  // ── 1. Loading state ──
  it('renders loading spinner while fetching card data', () => {
    // Don't resolve yet
    mockGetCard.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  // ── 2. Displays card info when loaded ──
  it('displays card details when loaded', async () => {
    renderPage();

    // Card name appears in both header <h1> and hero <h2>
    await waitFor(() => {
      const matches = screen.getAllByText('Mi Gift Card');
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    // Balance displayed (75,000 → $75.000)
    expect(screen.getByText('$75.000')).toBeDefined();

    // Status badge
    expect(screen.getByText('Activa')).toBeDefined();

    // Source ("Comprada" — hardcoded in component SOURCE_LABELS)
    expect(screen.getByText('Comprada')).toBeDefined();

    // Message
    expect(screen.getByText('Feliz cumpleaños!')).toBeDefined();

    // Design emoji (birthday → 🎂)
    expect(screen.getByText('🎂')).toBeDefined();
  });

  // ── 3. Shows transactions ──
  it('displays transaction history', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Mi Gift Card').length).toBeGreaterThanOrEqual(2);
    });

    expect(screen.getByText('Transacciones')).toBeDefined();
    expect(screen.getByText('Creación de gift card')).toBeDefined();
    expect(screen.getByText('Compra en tienda')).toBeDefined();
  });

  // ── 4. "Transferir saldo" button opens transfer form ──
  it('"Transferir saldo" button opens transfer form', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Mi Gift Card').length).toBeGreaterThanOrEqual(2);
    });

    // Click the transfer button (there are 2 buttons with transfer-related text)
    const transferButtons = screen.getAllByText('Transferir saldo');
    fireEvent.click(transferButtons[0]); // Action button comes first

    // Transfer form should appear with selector and input
    await waitFor(() => {
      expect(screen.getByText('Gift card destino')).toBeDefined();
      expect(screen.getByText('Monto')).toBeDefined();
    });
  });

  // ── 5. "Desactivar" button shows confirmation ──
  it('"Desactivar gift card" shows confirmation and deactivates', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Mi Gift Card').length).toBeGreaterThanOrEqual(2);
    });

    // Click deactivate
    fireEvent.click(screen.getByText('Desactivar gift card'));

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText('¿Desactivar gift card?')).toBeDefined();
    });

    // Confirm
    fireEvent.click(screen.getByText('Sí, desactivar'));

    await waitFor(() => {
      expect(mockDeactivate).toHaveBeenCalledWith('card_abc', 'user_1');
    });
  });

  // ── 6. Error state when card not found ──
  it('shows error when card is not found', async () => {
    mockGetCard.mockResolvedValue(null);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Gift card no encontrada')).toBeDefined();
    });
  });
});
