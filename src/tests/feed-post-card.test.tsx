import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

const mockGetSeller = vi.fn();
vi.mock('../services/sellerService', () => ({
  getSeller: (...args: any[]) => mockGetSeller(...args),
}));

import FeedPostCard from '../components/seller/FeedPostCard';
import type { SellerPost } from '../types';

const basePost: SellerPost = {
  id: 'post-1',
  sellerId: 'seller-1',
  title: 'Nuevo producto disponible',
  content: 'Hemos lanzado un nuevo producto con funcionalidades increíbles.',
  media: [],
  listingIds: [],
  isPublished: true,
  publishedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  createdAt: new Date(Date.now() - 7200000).toISOString(),
};

const mockSeller = {
  id: 'seller-1',
  name: 'Tienda Test',
  slug: 'tienda-test',
  type: 'retail',
  categoryIds: [],
  ownerId: 'owner-1',
  location: { address: '', city: 'Bogotá' },
  contact: {},
  rating: 4.8,
  ratingCount: 50,
  subscription: 'free',
  isActive: true,
  isVerified: true,
  stats: {
    totalTransactions: 100, totalRevenue: 0, totalListings: 50,
    activeListings: 30, completionRate: 0.95, avgRating: 4.8, responseTimeHours: 2,
  },
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('FeedPostCard — Title and content', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows title and content', async () => {
    mockGetSeller.mockResolvedValue(mockSeller);

    render(<FeedPostCard post={basePost} />);

    expect(screen.getByText('Nuevo producto disponible')).toBeDefined();
    expect(await screen.findByText('Hemos lanzado un nuevo producto con funcionalidades increíbles.')).toBeDefined();
  });

  it('shows seller name after loading', async () => {
    mockGetSeller.mockResolvedValue(mockSeller);

    render(<FeedPostCard post={basePost} />);

    expect(await screen.findByText('Tienda Test')).toBeDefined();
  });
});

describe('FeedPostCard — Image rendering', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows image when media includes an image', async () => {
    mockGetSeller.mockResolvedValue(mockSeller);

    const postWithImage: SellerPost = {
      ...basePost,
      media: [{ type: 'image', url: 'https://example.com/photo.jpg' }],
    };

    const { container } = render(<FeedPostCard post={postWithImage} />);

    await waitFor(() => {
      const img = container.querySelector('img');
      expect(img).toBeTruthy();
      expect(img?.getAttribute('src')).toBe('https://example.com/photo.jpg');
    });
  });

  it('does not show image when media is empty', async () => {
    mockGetSeller.mockResolvedValue(mockSeller);

    const { container } = render(<FeedPostCard post={basePost} />);

    await screen.findByText('Tienda Test');
    const img = container.querySelector('img');
    expect(img).toBeNull();
  });
});

describe('FeedPostCard — Relative date', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows relative time for recent post', async () => {
    mockGetSeller.mockResolvedValue(mockSeller);

    render(<FeedPostCard post={basePost} />);

    // 1 hour ago → "hace 1h"
    expect(await screen.findByText('hace 1h')).toBeDefined();
  });

  it('shows "ahora" for just-now post', async () => {
    mockGetSeller.mockResolvedValue(mockSeller);

    const justNow: SellerPost = {
      ...basePost,
      publishedAt: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
    };

    render(<FeedPostCard post={justNow} />);

    expect(await screen.findByText('ahora')).toBeDefined();
  });
});

describe('FeedPostCard — Listing links', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows listing links when listingIds are present', async () => {
    mockGetSeller.mockResolvedValue(mockSeller);

    const postWithListings: SellerPost = {
      ...basePost,
      listingIds: ['listing-1', 'listing-2'],
    };

    render(<FeedPostCard post={postWithListings} />);

    expect(await screen.findByText('Productos (2)')).toBeDefined();
    const buttons = screen.getAllByText('Ver producto');
    expect(buttons).toHaveLength(2);
  });

  it('calls onViewListing when listing button clicked', async () => {
    mockGetSeller.mockResolvedValue(mockSeller);
    const onViewListing = vi.fn();

    const postWithListings: SellerPost = {
      ...basePost,
      listingIds: ['listing-1'],
    };

    render(<FeedPostCard post={postWithListings} onViewListing={onViewListing} />);

    expect(await screen.findByText('Productos (1)')).toBeDefined();
    fireEvent.click(screen.getByText('Ver producto'));
    expect(onViewListing).toHaveBeenCalledWith('listing-1');
  });
});

describe('FeedPostCard — Long content truncation', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('truncates content over 250 characters', async () => {
    mockGetSeller.mockResolvedValue(mockSeller);

    const longContent = 'a'.repeat(300);
    const post: SellerPost = {
      ...basePost,
      content: longContent,
    };

    render(<FeedPostCard post={post} />);

    const truncatedText = await screen.findByText(/^a+\.\.\.$/);
    expect(truncatedText.textContent).toBe('a'.repeat(250) + '...');
  });
});
