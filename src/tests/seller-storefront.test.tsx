import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'es' } }),
}));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  getDocs: vi.fn(),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
}));

// Mock useParams to return the seller ID
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'seller-1' }),
  };
});

vi.mock('../hooks/useFollow', () => ({
  useFollow: vi.fn(),
}));

vi.mock('../services/categoryService', () => ({
  getCategory: vi.fn(),
}));

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: any) => children,
}));

import SellerStorefront from '../pages/SellerStorefront';
import { getDocs } from 'firebase/firestore';
import { useFollow } from '../hooks/useFollow';
import { getCategory } from '../services/categoryService';
import { getSeller } from '../services/sellerService';

vi.mock('../services/sellerService', () => ({
  getSeller: vi.fn(),
}));

const mockSeller = {
  id: 'seller-1',
  name: 'Tienda Test',
  slug: 'tienda-test',
  type: 'retail' as any,
  categoryIds: ['cat-1'],
  ownerId: 'owner-1',
  location: { address: 'Calle 123', city: 'Bogotá', neighborhood: 'Chapinero' },
  contact: {},
  rating: 4.5,
  ratingCount: 20,
  subscription: 'seller_pass_monthly',
  isActive: true,
  isVerified: true,
  stats: {
    totalTransactions: 100,
    totalRevenue: 5000000,
    totalListings: 50,
    activeListings: 30,
    completionRate: 0.95,
    avgRating: 4.5,
    responseTimeHours: 2,
  },
  createdAt: '2024-01-01',
  updatedAt: '2024-06-01',
  logo: '🏪',
};

const mockListings = [
  {
    id: 'listing-1',
    sellerId: 'seller-1',
    categoryId: 'cat-1',
    title: 'Producto 1',
    description: 'Desc 1',
    images: [],
    price: 25000,
    listingType: 'product' as any,
    type: 'product' as any,
    quantity: 10,
    attributes: {},
    deliveryMethods: [],
    isActive: true,
    isFeatured: false,
    isApproved: true,
    stats: { views: 100, favorites: 5, transactions: 10, rating: 4.0, ratingCount: 5 },
    tags: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-06-01',
    discountPercent: undefined,
  },
  {
    id: 'listing-2',
    sellerId: 'seller-1',
    categoryId: 'cat-2',
    title: 'Servicio 1',
    description: 'Desc 2',
    images: [],
    price: 50000,
    listingType: 'service' as any,
    type: 'service' as any,
    quantity: 999,
    attributes: {},
    deliveryMethods: [],
    isActive: true,
    isFeatured: false,
    isApproved: true,
    stats: { views: 200, favorites: 8, transactions: 15, rating: 4.5, ratingCount: 10 },
    tags: [],
    createdAt: '2024-01-02',
    updatedAt: '2024-06-02',
    discountPercent: 10,
  },
];

const mockListingDocs = {
  docs: mockListings.map(l => ({
    id: l.id,
    data: () => l,
  })),
};

describe('SellerStorefront — Seller info', () => {
  it('shows seller name, logo, and stats when loaded', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    (useFollow as any).mockReturnValue({
      isFollowing: false,
      followerCount: 42,
      loading: false,
      toggleFollow: vi.fn(),
    });
    (getSeller as any).mockResolvedValue(mockSeller);
    (getDocs as any).mockResolvedValue(mockListingDocs);
    (getCategory as any).mockResolvedValue({ name: 'Categoría 1' });

    render(
      <MemoryRouter initialEntries={['/seller/seller-1']}>
        <SellerStorefront />
      </MemoryRouter>
    );

    expect(await screen.findByText('Tienda Test')).toBeDefined();
    expect(screen.getByText('Bogotá')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText('2 productos')).toBeDefined();
    const ratingEls = screen.getAllByText('4.5');
    expect(ratingEls.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Calificación')).toBeDefined();
  });
});

describe('SellerStorefront — Listings grid', () => {
  it('shows listings grid with product titles and prices', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    (useFollow as any).mockReturnValue({
      isFollowing: false,
      followerCount: 42,
      loading: false,
      toggleFollow: vi.fn(),
    });
    (getSeller as any).mockResolvedValue(mockSeller);
    (getDocs as any).mockResolvedValue(mockListingDocs);
    (getCategory as any).mockResolvedValue({ name: 'Categoría 1' });

    render(
      <MemoryRouter initialEntries={['/seller/seller-1']}>
        <SellerStorefront />
      </MemoryRouter>
    );

    expect(await screen.findByText('Producto 1')).toBeDefined();
    expect(screen.getByText('Servicio 1')).toBeDefined();
    // formatCOP renders without space: "$25.000"
    expect(screen.getByText('$25.000')).toBeDefined();
    expect(screen.getByText('$50.000')).toBeDefined();
    expect(screen.getByText('Productos y servicios (2)')).toBeDefined();
  });
});

describe('SellerStorefront — Follow button', () => {
  it('shows follow button when user is not the owner and not following', async () => {
    const toggleFollow = vi.fn();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1', sellerId: undefined } });
    (useFollow as any).mockReturnValue({
      isFollowing: false,
      followerCount: 42,
      loading: false,
      toggleFollow,
    });
    (getSeller as any).mockResolvedValue(mockSeller);
    (getDocs as any).mockResolvedValue(mockListingDocs);
    (getCategory as any).mockResolvedValue({ name: 'Categoría 1' });

    render(
      <MemoryRouter initialEntries={['/seller/seller-1']}>
        <SellerStorefront />
      </MemoryRouter>
    );

    expect(await screen.findByText('seller.follow')).toBeDefined();

    fireEvent.click(screen.getByText('seller.follow'));
    expect(toggleFollow).toHaveBeenCalledTimes(1);
  });

  it('shows following state when user follows seller', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1', sellerId: undefined } });
    (useFollow as any).mockReturnValue({
      isFollowing: true,
      followerCount: 42,
      loading: false,
      toggleFollow: vi.fn(),
    });
    (getSeller as any).mockResolvedValue(mockSeller);
    (getDocs as any).mockResolvedValue(mockListingDocs);
    (getCategory as any).mockResolvedValue({ name: 'Categoría 1' });

    render(
      <MemoryRouter initialEntries={['/seller/seller-1']}>
        <SellerStorefront />
      </MemoryRouter>
    );

    expect(await screen.findByText('seller.following')).toBeDefined();
  });
});

describe('SellerStorefront — Share store button', () => {
  it('shows share button', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    (useFollow as any).mockReturnValue({
      isFollowing: false,
      followerCount: 42,
      loading: false,
      toggleFollow: vi.fn(),
    });
    (getSeller as any).mockResolvedValue(mockSeller);
    (getDocs as any).mockResolvedValue(mockListingDocs);
    (getCategory as any).mockResolvedValue({ name: 'Categoría 1' });

    render(
      <MemoryRouter initialEntries={['/seller/seller-1']}>
        <SellerStorefront />
      </MemoryRouter>
    );

    expect(await screen.findByText('seller.shareStore')).toBeDefined();
  });
});

describe('SellerStorefront — Verified badge', () => {
  it('shows verified badge when seller is verified', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    (useFollow as any).mockReturnValue({
      isFollowing: false,
      followerCount: 0,
      loading: false,
      toggleFollow: vi.fn(),
    });
    (getSeller as any).mockResolvedValue(mockSeller);
    (getDocs as any).mockResolvedValue(mockListingDocs);
    (getCategory as any).mockResolvedValue({ name: 'Categoría 1' });

    const { container } = render(
      <MemoryRouter initialEntries={['/seller/seller-1']}>
        <SellerStorefront />
      </MemoryRouter>
    );

    await screen.findByText('Tienda Test');
    // Verified seller should have the BadgeCheck icon
    const badges = container.querySelectorAll('.lucide-badge-check');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });
});
