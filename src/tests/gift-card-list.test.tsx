/**
 * @file tests/gift-card-list.test.tsx
 * @description Tests for GiftCardList component — loading, empty, cards, navigation, modal.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ─── Hoisted mocks ──────────────────────────────────────────────────────────
const { mockGetCards, mockGetDesignEmoji, mockNavigate } = vi.hoisted(() => ({
  mockGetCards: vi.fn(),
  mockGetDesignEmoji: vi.fn(() => '🎁'),
  mockNavigate: vi.fn(),
}));

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
    i18n: { language: 'en' },
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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
    getCards: mockGetCards,
    getDesignEmoji: mockGetDesignEmoji,
  },
}));

import GiftCardList from '../components/wallet/GiftCardList';
import type { GiftCard } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeCards(count: number): GiftCard[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `card_${i + 1}`,
    userId: 'user_1',
    name: `Card ${i + 1}`,
    balance: 50000 + i * 10000,
    originalAmount: 100000,
    design: 'default' as const,
    status: 'ACTIVE' as const,
    source: 'purchased' as const,
    isPrimary: i === 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

function renderList() {
  return render(
    <MemoryRouter>
      <GiftCardList />
    </MemoryRouter>,
  );
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('GiftCardList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCards.mockResolvedValue([]);
  });

  // ── 1. Loading state ──
  it('renders loading spinner while fetching cards', () => {
    // Don't resolve yet — keep loading
    mockGetCards.mockReturnValue(new Promise(() => {}));
    renderList();
    // The spinner uses the Loader2 icon with animate-spin
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  // ── 2. Gift cards list when loaded ──
  it('renders gift cards list when loaded', async () => {
    const cards = makeCards(3);
    mockGetCards.mockResolvedValue(cards);

    renderList();

    await waitFor(() => {
      expect(screen.getByText('Card 1')).toBeDefined();
    });

    expect(screen.getByText('Card 2')).toBeDefined();
    expect(screen.getByText('Card 3')).toBeDefined();
    // Header "Mis Gift Cards"
    expect(screen.getByText('Mis Gift Cards')).toBeDefined();
    // Active count badge
    expect(screen.getByText('3')).toBeDefined();
  });

  // ── 3. Empty state ──
  it('shows empty state when no cards', async () => {
    mockGetCards.mockResolvedValue([]);

    renderList();

    await waitFor(() => {
      expect(screen.getByText('No tienes gift cards')).toBeDefined();
    });

    expect(screen.getByText('Crear primera gift card')).toBeDefined();
  });

  // ── 4. "Nueva" button opens SendGiftCardModal ──
  it('"Nueva" button opens the create modal', async () => {
    const cards = makeCards(1);
    mockGetCards.mockResolvedValue(cards);

    renderList();

    await waitFor(() => {
      expect(screen.getByText('Card 1')).toBeDefined();
    });

    // Click "Nueva" button
    fireEvent.click(screen.getByText('Nueva'));

    // Modal should be visible now
    await waitFor(() => {
      expect(screen.getByText('Nueva Gift Card')).toBeDefined();
    });
  });

  // ── 5. Empty state "Crear primera gift card" opens modal ──
  it('"Crear primera gift card" button opens the create modal', async () => {
    mockGetCards.mockResolvedValue([]);

    renderList();

    await waitFor(() => {
      expect(screen.getByText('Crear primera gift card')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Crear primera gift card'));

    await waitFor(() => {
      expect(screen.getByText('Nueva Gift Card')).toBeDefined();
    });
  });

  // ── 6. Tapping a card navigates to /gift-cards/{id} ──
  it('clicking a card navigates to its detail page', async () => {
    const cards = makeCards(2);
    mockGetCards.mockResolvedValue(cards);

    renderList();

    await waitFor(() => {
      expect(screen.getByText('Card 1')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Card 1'));

    expect(mockNavigate).toHaveBeenCalledWith('/gift-cards/card_1');
  });
});
