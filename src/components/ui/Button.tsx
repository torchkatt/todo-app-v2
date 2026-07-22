/**
 * @file Button.tsx
 * @description Componente de botón reutilizable con soporte para variantes de estilo,
 * tamaños, estado de carga animado e interacción táctil (active-bounce).
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Propiedades del componente Button.
 * @extends React.ButtonHTMLAttributes<HTMLButtonElement>
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual del botón. Por defecto: 'primary' */
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
  /** Tamaño del botón. Por defecto: 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Indica si el botón está en estado de carga (muestra spinner animado). */
  loading?: boolean;
  /** Si es true, el botón se expande al 100% del ancho de su contenedor. */
  fullWidth?: boolean;
}

/**
 * Componente Botón Principal.
 * @param {ButtonProps} props - Propiedades del botón.
 * @returns {JSX.Element} Elemento botón renderizado con soporte táctil.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  /** Estilos base compartidos por todos los botones */
  const baseStyles = 'inline-flex items-center justify-center font-extrabold rounded-xl transition-all active-bounce disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  /** Mapeo de clases según variante visual */
  const variantStyles = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200',
    accent: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200',
  }[variant];

  /** Mapeo de clases según tamaño */
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5',
  }[size];

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${widthStyle} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
