/**
 * @file tests/share-deal-sheet.test.tsx
 * @description Tests for ShareDealSheet — WhatsApp, Copy Link, overlay close.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockGetShareUrl = vi.fn();
const mockGetShareText = vi.fn();

vi.mock('../services/groupDealService', () => ({
  groupDealService: {
    getShareUrl: (...args: any[]) => mockGetShareUrl(...args),
    getShareText: (...args: any[]) => mockGetShareText(...args),
  },
}));

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

import ShareDealSheet from '../components/social/ShareDealSheet';
import type { GroupDeal } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const mockDeal: GroupDeal = {
  id: 'deal-1',
  listingId: 'listing-1',
  sellerId: 'seller-1',
  title: 'iPhone 15 Pro Max',
  originalPrice: 5000000,
  groupPrice: 3500000,
  discountPercent: 30,
  minParticipants: 5,
  maxParticipants: 10,
  currentCount: 2,
  status: 'ACTIVE',
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
  createdAt: new Date().toISOString(),
  createdBy: 'creator-1',
};

const renderSheet = (isOpen: boolean, onClose = vi.fn()) =>
  render(<ShareDealSheet deal={mockDeal} isOpen={isOpen} onClose={onClose} />);

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ShareDealSheet — Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetShareUrl.mockReturnValue('https://todo-app.example.com/deal/deal-1');
    mockGetShareText.mockReturnValue('🎉 Check out this group deal!');
  });

  it('renders when isOpen=true', () => {
    renderSheet(true);
    // Should render the title
    expect(screen.getByText('Compartir oferta grupal')).toBeDefined();
  });

  it('does not render when isOpen=false', () => {
    const { container } = renderSheet(false);
    expect(container.innerHTML).toBe('');
  });

  it('renders deal preview with title and prices', () => {
    renderSheet(true);
    expect(screen.getByText('iPhone 15 Pro Max')).toBeDefined();
    expect(screen.getByText('$3.500.000')).toBeDefined();
    expect(screen.getByText('$5.000.000')).toBeDefined();
    expect(screen.getByText('-30%')).toBeDefined();
  });
});

describe('ShareDealSheet — WhatsApp share button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetShareUrl.mockReturnValue('https://todo-app.example.com/deal/deal-1');
    mockGetShareText.mockReturnValue('🎉 Check out this group deal!');
    // Mock window.open
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('renders WhatsApp share button', () => {
    renderSheet(true);
    const whatsappButtons = screen.getAllByText('Compartir en WhatsApp');
    expect(whatsappButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('clicking WhatsApp opens wa.me URL', () => {
    renderSheet(true);
    const btn = screen.getAllByText('Compartir en WhatsApp')[0];
    fireEvent.click(btn);
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/?text='),
      '_blank'
    );
  });
});

describe('ShareDealSheet — Copy link button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetShareUrl.mockReturnValue('https://todo-app.example.com/deal/deal-1');
    mockGetShareText.mockReturnValue('🎉 Check out this group deal!');
  });

  it('renders "Copiar enlace" button', () => {
    renderSheet(true);
    expect(screen.getByText('Copiar enlace')).toBeDefined();
  });

  it('clicking copy button copies link to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    renderSheet(true);
    fireEvent.click(screen.getByText('Copiar enlace'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
  });

  it('shows "¡Enlace copiado!" after copying', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    renderSheet(true);
    fireEvent.click(screen.getByText('Copiar enlace'));

    await waitFor(() => {
      expect(screen.getByText('¡Enlace copiado!')).toBeDefined();
    });
  });
});

describe('ShareDealSheet — Overlay close', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetShareUrl.mockReturnValue('https://todo-app.example.com/deal/deal-1');
    mockGetShareText.mockReturnValue('🎉 Check out this group deal!');
  });

  it('closes when overlay is clicked', () => {
    const onClose = vi.fn();
    renderSheet(true, onClose);

    // The overlay has onClick={onClose} and bg-black/50 class
    const overlay = document.querySelector('.bg-black\\/50') as HTMLElement;
    expect(overlay).toBeTruthy();
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('close button calls onClose', () => {
    const onClose = vi.fn();
    renderSheet(true, onClose);

    // The close (×) button is a button with an X icon
    const buttons = screen.getAllByRole('button');
    // First button is the × close button
    fireEvent.click(buttons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
