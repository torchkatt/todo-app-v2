/**
 * @file ProductCard.tsx
 * @description Tarjeta de producto/publicación estandarizada para el marketplace Todo.
 * Renderiza imagen/emoji por tipo, título, precio formateado, badge de descuento y valoración.
 */

import React from 'react';
import { Star } from 'lucide-react';
import type { Listing } from '../../types';
import PriceDisplay from './PriceDisplay';

/**
 * Propiedades del componente ProductCard.
 */
export interface ProductCardProps {
  /** Objeto de la publicación/producto a renderizar. */
  listing: Listing;
  /** Callback opcional ejecutado al hacer clic en la tarjeta. */
  onClick?: () => void;
}

/**
 * Componente ProductCard.
 * @param {ProductCardProps} props - Propiedades de la tarjeta.
 * @returns {JSX.Element} Tarjeta de producto renderizada.
 */
export const ProductCard: React.FC<ProductCardProps> = ({ listing, onClick }) => {
  /** Emoji identificador por tipo de publicación */
  const typeEmoji = listing.type === 'service' ? '🛠️' : listing.type === 'digital' ? '📱' : '📦';

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 overflow-hidden hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-500 transition-all cursor-pointer active-bounce"
    >
      <div className="relative h-28 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
        <span className="text-4xl">{typeEmoji}</span>
        {listing.discountPercent ? (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white shadow-sm">
            -{listing.discountPercent}%
          </span>
        ) : null}
      </div>
      <div className="p-3">
        <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate mb-1">
          {listing.title}
        </h4>
        <PriceDisplay
          price={listing.price}
          originalPrice={listing.originalPrice}
          size="sm"
        />
        <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/50">
          <Star size={11} className="text-amber-400 fill-amber-400" />
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
            {listing.stats?.rating || 'Nuevo'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
