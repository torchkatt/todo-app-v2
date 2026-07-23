/**
 * @file components/wallet/WalletCard.tsx
 * @description Card que muestra el saldo de la wallet con estilo moderno.
 */
import React from 'react';
import { Wallet, TrendingUp, Gift, ArrowUpRight } from 'lucide-react';
import { formatCOP } from '../../config/constants';
import type { Wallet as WalletType } from '../../types';

interface Props {
  wallet: WalletType;
  onTopUp: () => void;
}

const WalletCard: React.FC<Props> = ({ wallet, onTopUp }) => {
  return (
    <div className="bg-gradient-to-br from-purple-700 via-indigo-700 to-purple-900 rounded-2xl p-6 text-white shadow-xl shadow-purple-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Wallet size={20} className="text-purple-200" />
          <span className="text-sm font-semibold text-purple-200">Mi Billetera</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <TrendingUp size={16} />
        </div>
      </div>

      <div className="mb-6">
        <div className="text-3xl font-extrabold tracking-tight">
          {formatCOP(wallet.balance)}
        </div>
        <div className="text-xs text-purple-200 mt-1">Saldo disponible</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onTopUp}
          className="bg-white/15 hover:bg-white/25 backdrop-blur rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-[0.97]"
        >
          <ArrowUpRight size={16} />
          Recargar
        </button>
        <div className="bg-white/10 rounded-xl py-3 px-3">
          <div className="text-[10px] text-purple-200 font-semibold">Cashback total</div>
          <div className="text-sm font-extrabold flex items-center gap-1">
            <Gift size={14} className="text-amber-300" />
            {formatCOP(wallet.lifetimeCashback || 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
