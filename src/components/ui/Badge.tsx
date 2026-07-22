/**
 * @file Badge.tsx
 * @description Componente de etiqueta (pill badge) reutilizable para mostrar categorías,
 * estados de envío, porcentajes de descuento y filtros activos.
 */

import React from 'react';

/**
 * Propiedades del componente Badge.
 */
export interface BadgeProps {
  /** Contenido interno de la etiqueta (texto o elemento react). */
  children: React.ReactNode;
  /** Variante visual de la etiqueta. Por defecto: 'secondary' */
  variant?: 'primary' | 'secondary' | 'discount' | 'success' | 'warning' | 'info';
  /** Tamaño de la etiqueta. Por defecto: 'md' */
  size?: 'sm' | 'md';
  /** Clases adicionales de Tailwind. */
  className?: string;
  /** Callback opcional ejecutado al hacer clic. */
  onClick?: () => void;
  /** Si es true, aplica el estilo de estado seleccionado/activo. */
  active?: boolean;
}

/**
 * Componente Badge.
 * @param {BadgeProps} props - Propiedades de la etiqueta.
 * @returns {JSX.Element} Etiqueta renderizada.
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  onClick,
  active = false,
}) => {
  const baseStyles = 'inline-flex items-center rounded-full font-bold transition-all';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1.5 text-[11px]',
  }[size];

  const variantStyles = active
    ? 'bg-purple-600 text-white shadow-sm'
    : {
        primary: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
        secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
        discount: 'bg-red-500 text-white font-extrabold',
        success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
        warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
        info: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
      }[variant];

  const clickableStyles = onClick ? 'cursor-pointer active-bounce shrink-0' : '';

  return (
    <span
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${clickableStyles} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
