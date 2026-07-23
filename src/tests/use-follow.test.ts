/**
 * @file tests/use-follow.test.ts
 * @description Tests for useFollow hook
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// vi.mock is hoisted — mock functions must be created with vi.hoisted()
const {
  mockIsFollowing,
  mockGetFollowerCount,
  mockFollow,
  mockUnfollow,
} = vi.hoisted(() => ({
  mockIsFollowing: vi.fn(),
  mockGetFollowerCount: vi.fn(),
  mockFollow: vi.fn(),
  mockUnfollow: vi.fn(),
}));

vi.mock('../services/followService', () => ({
  followService: {
    isFollowing: mockIsFollowing,
    getFollowerCount: mockGetFollowerCount,
    follow: mockFollow,
    unfollow: mockUnfollow,
  },
}));

// Mock firebase (needed by module graph)
vi.mock('../services/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
  functions: {},
}));

import { useFollow } from '../hooks/useFollow';

describe('useFollow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads isFollowing and followerCount on mount', async () => {
    mockIsFollowing.mockResolvedValue(true);
    mockGetFollowerCount.mockResolvedValue(42);

    const { result } = renderHook(() => useFollow('user_1', 'seller_1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isFollowing).toBe(true);
    expect(result.current.followerCount).toBe(42);
    expect(mockIsFollowing).toHaveBeenCalledWith('user_1', 'seller_1');
    expect(mockGetFollowerCount).toHaveBeenCalledWith('seller_1');
  });

  it('toggleFollow calls follow when not following', async () => {
    mockIsFollowing.mockResolvedValue(false);
    mockGetFollowerCount.mockResolvedValue(10);
    mockFollow.mockResolvedValue(undefined);

    const { result } = renderHook(() => useFollow('user_1', 'seller_1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFollow();
    });

    expect(mockFollow).toHaveBeenCalledWith('user_1', 'seller_1');
    expect(result.current.isFollowing).toBe(true);
    expect(result.current.followerCount).toBe(11);
  });

  it('toggleFollow calls unfollow when already following', async () => {
    mockIsFollowing.mockResolvedValue(true);
    mockGetFollowerCount.mockResolvedValue(10);
    mockUnfollow.mockResolvedValue(undefined);

    const { result } = renderHook(() => useFollow('user_1', 'seller_1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFollow();
    });

    expect(mockUnfollow).toHaveBeenCalledWith('user_1', 'seller_1');
    expect(result.current.isFollowing).toBe(false);
    expect(result.current.followerCount).toBe(9);
  });

  it('returns early when userId or sellerId is undefined', async () => {
    const { result } = renderHook(() => useFollow(undefined, undefined));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isFollowing).toBe(false);
    expect(result.current.followerCount).toBe(0);
    expect(mockIsFollowing).not.toHaveBeenCalled();
  });
});
