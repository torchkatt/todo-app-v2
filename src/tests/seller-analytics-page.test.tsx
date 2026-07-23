import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'es' } }),
}));

const mockGetSummary = vi.fn();
const mockGetTopListings = vi.fn();

vi.mock('../services/sellerAnalyticsService', () => ({
  sellerAnalyticsService: {
    getSummary: (...args: any[]) => mockGetSummary(...args),
    getTopListings: (...args: any[]) => mockGetTopListings(...args),
  },
}));

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: any) => children,
}));

import SellerAnalyticsPage from '../pages/SellerAnalyticsPage';

const mockSummary = {
  totalViews: 1500,
  totalTransactions: 45,
  totalRevenue: 3200000,
  avgConversionRate: 0.12,
  avgOrderValue: 71111,
};

const mockTopListings = [
  { listingId: 'listing-1', views: 500, sales: 20 },
  { listingId: 'listing-2', views: 300, sales: 10 },
  { listingId: 'listing-3', views: 200, sales: 5 },
];

describe('SellerAnalyticsPage — Loading state', () => {
  it('shows loader spinner when loading', () => {
    mockUseAuth.mockReturnValue({ user: { sellerId: 'seller-1' } });
    mockGetSummary.mockReturnValue(new Promise(() => {})); // never resolves
    mockGetTopListings.mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <MemoryRouter><SellerAnalyticsPage /></MemoryRouter>
    );
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });
});

describe('SellerAnalyticsPage — Stats grid', () => {
  it('shows stats grid with views, transactions, revenue, and conversion', async () => {
    mockUseAuth.mockReturnValue({ user: { sellerId: 'seller-1' } });
    mockGetSummary.mockResolvedValue(mockSummary);
    mockGetTopListings.mockResolvedValue(mockTopListings);

    render(<MemoryRouter><SellerAnalyticsPage /></MemoryRouter>);

    expect(await screen.findByText('analytics.visits')).toBeDefined();
    expect(screen.getByText('1500')).toBeDefined();
    expect(screen.getByText('analytics.transactions')).toBeDefined();
    expect(screen.getByText('45')).toBeDefined();
    expect(screen.getByText('analytics.income')).toBeDefined();
    expect(screen.getByText('analytics.conversion')).toBeDefined();
    expect(screen.getByText('12.0%')).toBeDefined();
  });
});

describe('SellerAnalyticsPage — Top listings', () => {
  it('shows top listings when data is available', async () => {
    mockUseAuth.mockReturnValue({ user: { sellerId: 'seller-1' } });
    mockGetSummary.mockResolvedValue(mockSummary);
    mockGetTopListings.mockResolvedValue(mockTopListings);

    render(<MemoryRouter><SellerAnalyticsPage /></MemoryRouter>);

    expect(await screen.findByText('analytics.topProducts')).toBeDefined();
    expect(screen.getByText('#1')).toBeDefined();
    expect(screen.getByText('#2')).toBeDefined();
    expect(screen.getByText('#3')).toBeDefined();
    expect(screen.getByText('listing-1')).toBeDefined();
  });
});

describe('SellerAnalyticsPage — Empty state', () => {
  it('shows empty state when no top listings data', async () => {
    mockUseAuth.mockReturnValue({ user: { sellerId: 'seller-1' } });
    mockGetSummary.mockResolvedValue(mockSummary);
    mockGetTopListings.mockResolvedValue([]);

    render(<MemoryRouter><SellerAnalyticsPage /></MemoryRouter>);

    expect(await screen.findByText('analytics.noData')).toBeDefined();
    expect(screen.getByText('analytics.updatesEvery')).toBeDefined();
  });
});

describe('SellerAnalyticsPage — Avg order value', () => {
  it('shows avg order value section', async () => {
    mockUseAuth.mockReturnValue({ user: { sellerId: 'seller-1' } });
    mockGetSummary.mockResolvedValue(mockSummary);
    mockGetTopListings.mockResolvedValue(mockTopListings);

    render(<MemoryRouter><SellerAnalyticsPage /></MemoryRouter>);

    expect(await screen.findByText('analytics.avgTicket')).toBeDefined();
    expect(screen.getByText('analytics.basedOn')).toBeDefined();
  });
});
