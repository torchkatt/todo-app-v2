/**
 * @file tests/group-deal-page.test.tsx
 * @description Tests for GroupDealPage — loading, 404, deal info, join, share button.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
const mockUseParams = vi.fn();
const mockUseAuth = vi.fn();
const mockGetDeal = vi.fn();
const mockGetParticipants = vi.fn();
const mockJoin = vi.fn();
const mockGetShareUrl = vi.fn();
const mockGetShareText = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../services/groupDealService', () => ({
  groupDealService: {
    getDeal: (...args: any[]) => mockGetDeal(...args),
    getParticipants: (...args: any[]) => mockGetParticipants(...args),
    join: (...args: any[]) => mockJoin(...args),
    getShareUrl: (...args: any[]) => mockGetShareUrl(...args),
    getShareText: (...args: any[]) => mockGetShareText(...args),
  },
}));

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../components/social/ShareDealSheet', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? <div data-testid="share-sheet"><button onClick={onClose}>Close Sheet</button></div> : null,
}));

import GroupDealPage from '../pages/GroupDealPage';
import type { GroupDeal, GroupDealParticipant } from '../types';

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
  expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24h from now
  createdAt: new Date().toISOString(),
  createdBy: 'creator-1',
};

const mockParticipants: GroupDealParticipant[] = [
  { id: 'p1', groupDealId: 'deal-1', userId: 'user-a', status: 'JOINED', joinedAt: new Date().toISOString() },
  { id: 'p2', groupDealId: 'deal-1', userId: 'user-b', status: 'JOINED', joinedAt: new Date().toISOString() },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <GroupDealPage />
    </MemoryRouter>
  );

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('GroupDealPage — Loading state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ id: 'deal-1' });
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false });
    // Make getDeal never resolve (loading stays true)
    mockGetDeal.mockReturnValue(new Promise(() => {}));
    mockGetParticipants.mockReturnValue(new Promise(() => {}));
  });

  it('shows loading spinner while fetching deal', () => {
    renderPage();
    // Loader2 renders an SVG with animate-spin class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });
});

describe('GroupDealPage — 404 when deal not found', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ id: 'nonexistent' });
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false });
    mockGetDeal.mockResolvedValue(null);
    mockGetParticipants.mockResolvedValue([]);
  });

  it('shows 404 message when deal is null', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Oferta grupal no encontrada')).toBeDefined();
    });
  });

  it('shows back-to-home button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Volver al inicio')).toBeDefined();
    });
  });
});

describe('GroupDealPage — Deal info display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ id: 'deal-1' });
    mockUseAuth.mockReturnValue({ user: { id: 'user-x' }, isAuthenticated: true });
    mockGetDeal.mockResolvedValue(mockDeal);
    mockGetParticipants.mockResolvedValue(mockParticipants);
    mockGetShareUrl.mockReturnValue('https://todo-app.example.com/deal/deal-1');
    mockGetShareText.mockReturnValue('Check out this deal!');
  });

  it('shows deal title', async () => {
    renderPage();
    await waitFor(() => {
      const titles = screen.getAllByText('iPhone 15 Pro Max');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows group price formatted', async () => {
    renderPage();
    await waitFor(() => {
      // groupPrice: 3,500,000 → "$3.500.000"
      expect(screen.getByText('$3.500.000')).toBeDefined();
    });
  });

  it('shows original price with line-through', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('$5.000.000')).toBeDefined();
    });
  });

  it('shows discount percentage badge', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('-30%')).toBeDefined();
    });
  });

  it('shows participant count', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('2 de 5 personas')).toBeDefined();
    });
  });

  it('shows participants list', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Participantes (2)')).toBeDefined();
    });
  });
});

describe('GroupDealPage — "Unirme al grupo" button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ id: 'deal-1' });
    mockUseAuth.mockReturnValue({
      user: { id: 'user-z' }, // not in participants
      isAuthenticated: true,
    });
    mockGetDeal.mockResolvedValue(mockDeal);
    mockGetParticipants.mockResolvedValue(mockParticipants);
    mockJoin.mockResolvedValue({ ...mockDeal, currentCount: 3 });
    mockGetShareUrl.mockReturnValue('https://todo-app.example.com/deal/deal-1');
    mockGetShareText.mockReturnValue('Check out this deal!');
  });

  it('renders "Unirme al grupo" button when user can join', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Unirme al grupo')).toBeDefined();
    });
  });

  it('clicking join calls groupDealService.join with correct args', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Unirme al grupo')).toBeDefined();
    });
    fireEvent.click(screen.getByText('Unirme al grupo'));
    await waitFor(() => {
      expect(mockJoin).toHaveBeenCalledWith('deal-1', 'user-z');
    });
  });

  it('does not show join button when user already in group', async () => {
    // User is already in participants
    mockUseAuth.mockReturnValue({
      user: { id: 'user-a' }, // user-a is in mockParticipants
      isAuthenticated: true,
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro Max')).toBeDefined();
    });

    // Should show "Ya estás en este grupo" instead of join button
    expect(screen.getByText('Ya estás en este grupo')).toBeDefined();
    // Should not show join button
    expect(screen.queryByText('Unirme al grupo')).toBeNull();
  });
});

describe('GroupDealPage — "Compartir en WhatsApp" button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ id: 'deal-1' });
    mockUseAuth.mockReturnValue({ user: { id: 'user-x' }, isAuthenticated: true });
    mockGetDeal.mockResolvedValue(mockDeal);
    mockGetParticipants.mockResolvedValue(mockParticipants);
    mockGetShareUrl.mockReturnValue('https://todo-app.example.com/deal/deal-1');
    mockGetShareText.mockReturnValue('Check out this deal!');
  });

  it('always shows WhatsApp share button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Compartir en WhatsApp')).toBeDefined();
    });
  });

  it('clicking WhatsApp button opens share sheet', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Compartir en WhatsApp')).toBeDefined();
    });
    fireEvent.click(screen.getByText('Compartir en WhatsApp'));
    await waitFor(() => {
      expect(screen.getByTestId('share-sheet')).toBeDefined();
    });
  });
});
