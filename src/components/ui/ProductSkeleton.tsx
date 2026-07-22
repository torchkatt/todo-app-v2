import React from 'react';

interface ProductSkeletonProps {
  count?: number;
}

export const ProductSkeleton: React.FC<ProductSkeletonProps> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between"
        >
          <div>
            {/* Image Placeholder */}
            <div className="w-full aspect-square rounded-xl skeleton-shimmer mb-3" />
            
            {/* Title Line 1 & 2 */}
            <div className="h-4 w-3/4 skeleton-shimmer rounded-md mb-2" />
            <div className="h-3 w-1/2 skeleton-shimmer rounded-md mb-3" />
          </div>

          <div>
            {/* Price & Rating Skeleton */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
              <div className="h-4 w-20 skeleton-shimmer rounded-md" />
              <div className="h-4 w-8 skeleton-shimmer rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductSkeleton;
