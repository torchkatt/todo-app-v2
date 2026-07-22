/**
 * @file PriceDisplay.tsx
 * @description Componente unificado para la presentación de precios en pesos colombianos (COP).
 * Soporta formateo estándar, precio original tachado y badge de porcentaje de descuento.
 */

import React from 'react';
import { formatCOP } from '../../config/constants';

/**
 * Propiedades del componente PriceDisplay.
 */
export interface PriceDisplayProps {
  /** Precio actual a mostrar. */
  price: number;
  /** Precio original antes del descuento (opcional). */
  originalPrice?: number;
  /** Porcentaje de descuento aplicado (opcional). */
  discountPercent?: number;
  /** Tamaño del texto del precio ('sm', 'md', 'lg'). Por defecto: 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Clases adicionales de Tailwind. */
  className?: string;
}

/**
 * Componente PriceDisplay.
 * @param {PriceDisplayProps} props - Propiedades del componente.
 * @returns {JSX.Element} Presentación de precios formateada.
 */
export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  originalPrice,
  discountPercent,
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: { main: 'text-sm', original: 'text-[10px]' },
    md: { main: 'text-base', original: 'text-xs' },
    lg: { main: 'text-xl', original: 'text-sm' },
  }[size];

  return (
    <div className={`flex items-baseline gap-1.5 flex-wrap ${className}`}>
      <span className={`font-extrabold text-purple-700 dark:text-purple-400 ${sizeStyles.main}`}>
        {formatCOP(price)}
      </span>
      {originalPrice && (
        <span className={`text-text-muted line-through font-semibold ${sizeStyles.original}`}>
          {formatCOP(originalPrice)}
        </span>
      )}
      {discountPercent && (
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white">
          -{discountPercent}%
        </span>
      )}
    </div>
  );
};

export default PriceDisplay;
