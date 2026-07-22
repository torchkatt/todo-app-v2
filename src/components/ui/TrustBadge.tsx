/**
 * @file TrustBadge.tsx
 * @description Componente de respaldo y garantía de seguridad bancaria/Wompi.
 * Muestra insignias de cifrado SSL 256-bit y respaldo de pago seguro en checkout.
 */

import React from 'react';
import { Shield, Lock, Truck } from 'lucide-react';

/**
 * Componente TrustBadge.
 * @returns {JSX.Element} Bloque visual de garantía de seguridad en el pago.
 */
export const TrustBadge: React.FC = () => {
  return (
    <div className="p-4 bg-emerald-50/80 dark:bg-slate-800/80 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl shadow-sm">
      <div className="flex items-center gap-2.5 mb-2.5">
        <Shield size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div>
          <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">Transacción 100% Protegida</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300">Procesado con el respaldo de <strong className="text-slate-900 dark:text-slate-100">Wompi (Bancolombia)</strong></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-1.5 p-2 bg-white/80 dark:bg-slate-700/60 rounded-xl border border-emerald-100 dark:border-slate-600">
          <Lock size={13} className="text-indigo-600 dark:text-indigo-400" /> Cifrado SSL 256-bit
        </div>
        <div className="flex items-center gap-1.5 p-2 bg-white/80 dark:bg-slate-700/60 rounded-xl border border-emerald-100 dark:border-slate-600">
          <Truck size={13} className="text-amber-600 dark:text-amber-400" /> Despacho garantizado
        </div>
      </div>
    </div>
  );
};

export default TrustBadge;
