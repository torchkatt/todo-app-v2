import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl ${className}`} />
    ))}
  </>
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-border overflow-hidden">
    <Skeleton className="h-28 w-full rounded-none" />
    <div className="p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

export const ListSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map(i => (
      <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-border">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

export const PageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-brand-bg dark:bg-gray-900 p-4 space-y-4">
    <Skeleton className="h-10 w-full" />
    <div className="grid grid-cols-2 gap-3">
      <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
    </div>
  </div>
);

export default Skeleton;
