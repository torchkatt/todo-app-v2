import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'es' } }),
}));

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: any) => children,
}));

vi.mock('../services/followService', () => ({
  followService: {
    getFollowedSellers: vi.fn(),
  },
}));

vi.mock('../services/sellerContentService', () => ({
  sellerContentService: {
    getPosts: vi.fn(),
  },
}));

// Mock FeedPostCard to avoid nested Firebase calls
vi.mock('../components/seller/FeedPostCard', () => ({
  default: ({ post }: any) => (
    <div data-testid="feed-post-card">
      <h3>{post.title}</h3>
      <p>{post.content}</p>
    </div>
  ),
}));

import SellerFeedPage from '../pages/SellerFeedPage';
import { followService } from '../services/followService';
import { sellerContentService } from '../services/sellerContentService';

const mockPosts = [
  {
    id: 'post-1',
    sellerId: 'seller-1',
    title: 'Nuevo producto disponible',
    content: 'Hemos lanzado un nuevo producto...',
    media: [],
    listingIds: [],
    isPublished: true,
    publishedAt: '2024-06-15T10:00:00Z',
    createdAt: '2024-06-15T09:00:00Z',
  },
  {
    id: 'post-2',
    sellerId: 'seller-2',
    title: 'Oferta especial de verano',
    content: '50% de descuento en todos los servicios...',
    media: [{ type: 'image' as const, url: 'https://example.com/img.jpg' }],
    listingIds: [],
    isPublished: true,
    publishedAt: '2024-06-14T10:00:00Z',
    createdAt: '2024-06-14T09:00:00Z',
  },
];

describe('SellerFeedPage — Loading state', () => {
  it('shows loading skeletons when loading', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1', isGuest: false } });
    (followService.getFollowedSellers as any).mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <MemoryRouter><SellerFeedPage /></MemoryRouter>
    );
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('SellerFeedPage — Empty state', () => {
  it('shows empty state when user has no followed sellers', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1', isGuest: false } });
    (followService.getFollowedSellers as any).mockResolvedValue([]);

    render(<MemoryRouter><SellerFeedPage /></MemoryRouter>);

    expect(await screen.findByText('feed.noContent')).toBeDefined();
    expect(screen.getByText('Explorar vendedores')).toBeDefined();
  });
});

describe('SellerFeedPage — Posts from followed sellers', () => {
  it('shows posts when followed sellers have content', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1', isGuest: false } });
    (followService.getFollowedSellers as any).mockResolvedValue(['seller-1', 'seller-2']);
    (sellerContentService.getPosts as any).mockImplementation((sellerId: string) => {
      if (sellerId === 'seller-1') return Promise.resolve([mockPosts[0]]);
      if (sellerId === 'seller-2') return Promise.resolve([mockPosts[1]]);
      return Promise.resolve([]);
    });

    render(<MemoryRouter><SellerFeedPage /></MemoryRouter>);

    expect(await screen.findByText('Nuevo producto disponible')).toBeDefined();
    expect(screen.getByText('Oferta especial de verano')).toBeDefined();
    expect(screen.getByText('Hemos lanzado un nuevo producto...')).toBeDefined();
    expect(screen.getByText('50% de descuento en todos los servicios...')).toBeDefined();
  });
});

describe('SellerFeedPage — Not authenticated', () => {
  it('shows login prompt when user is null or guest', () => {
    mockUseAuth.mockReturnValue({ user: null });

    render(<MemoryRouter><SellerFeedPage /></MemoryRouter>);

    expect(screen.getByText('Inicia sesión para ver contenido de los vendedores que sigues')).toBeDefined();
    expect(screen.getByText('auth.login')).toBeDefined();
  });

  it('shows login prompt for guest users', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'guest', isGuest: true } });

    render(<MemoryRouter><SellerFeedPage /></MemoryRouter>);

    expect(screen.getByText('Inicia sesión para ver contenido de los vendedores que sigues')).toBeDefined();
  });
});
