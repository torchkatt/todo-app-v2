import React from 'react';
import { Crown, Star } from 'lucide-react';

export interface TierBadgeProps {
  /** Tier identifier: 'free' | 'pro' | 'black' */
  tier: 'free' | 'pro' | 'black' | string;
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-3 py-1 text-xs gap-1.5',
  lg: 'px-4 py-1.5 text-sm gap-2',
} as const;

const iconSizes = {
  sm: 10,
  md: 12,
  lg: 14,
} as const;

const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'md' }) => {
  const s = sizeClasses[size];
  const iconSize = iconSizes[size];

  switch (tier) {
    case 'pro':
      return (
        <span
          className={`inline-flex items-center rounded-full font-bold bg-purple-600 text-white ${s}`}
        >
          <Crown size={iconSize} />
          Pro
        </span>
      );

    case 'black':
      return (
        <span
          className={`inline-flex items-center rounded-full font-bold bg-amber-500 text-white ${s}`}
        >
          <Star size={iconSize} fill="currentColor" />
          Black
        </span>
      );

    case 'free':
    default:
      return (
        <span
          className={`inline-flex items-center rounded-full font-bold bg-gray-500 text-white ${s}`}
        >
          Vendedor
        </span>
      );
  }
};

export default TierBadge;
