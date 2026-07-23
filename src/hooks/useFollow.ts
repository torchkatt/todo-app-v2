/**
 * @file useFollow.ts
 * @description Hook para seguir/dejar de seguir sellers con estado de UI.
 */
import { useState, useEffect, useCallback } from 'react';
import { followService } from '../services/followService';

interface UseFollowReturn {
  isFollowing: boolean;
  followerCount: number;
  loading: boolean;
  toggleFollow: () => Promise<void>;
}

export function useFollow(
  userId: string | undefined,
  sellerId: string | undefined,
): UseFollowReturn {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !sellerId) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const [following, count] = await Promise.all([
          followService.isFollowing(userId, sellerId),
          followService.getFollowerCount(sellerId),
        ]);
        if (!cancelled) {
          setIsFollowing(following);
          setFollowerCount(count);
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId, sellerId]);

  const toggleFollow = useCallback(async () => {
    if (!userId || !sellerId) return;
    try {
      if (isFollowing) {
        await followService.unfollow(userId, sellerId);
        setIsFollowing(false);
        setFollowerCount(p => Math.max(0, p - 1));
      } else {
        await followService.follow(userId, sellerId);
        setIsFollowing(true);
        setFollowerCount(p => p + 1);
      }
    } catch {
      // Revert on failure
    }
  }, [userId, sellerId, isFollowing]);

  return { isFollowing, followerCount, loading, toggleFollow };
}
