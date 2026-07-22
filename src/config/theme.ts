/**
 * @file theme.ts
 * @description Mapas de Tokens de Diseño y Clases de TailwindCSS.
 * Facilita la reutilización de clases de color, bordes y animaciones dinámicas.
 */

/**
 * Tokens de tema visual para botones, bordes y animaciones.
 */
export const THEME_TOKENS = {
  /** Clases de colores según variante */
  colors: {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white',
    primarySoft: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    accent: 'bg-amber-500 hover:bg-amber-600 text-white',
    success: 'bg-emerald-600 text-white',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  },
  /** Clases de bordes y estados de foco */
  borders: {
    default: 'border-border dark:border-slate-700/60',
    focus: 'focus:border-purple-400 focus:bg-white dark:focus:bg-slate-800',
  },
  /** Animaciones y feedback táctil */
  animations: {
    active: 'active-bounce active:scale-[0.97]',
    fadeUp: 'animate-fade-up',
    shimmer: 'skeleton-shimmer',
  },
} as const;
