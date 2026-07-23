/**
 * @file RechargePage.tsx
 * @description Página de recargas — celular, servicios públicos, juegos.
 * Selector de operador, montos rápidos, pago con wallet.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Zap, Gamepad2 } from 'lucide-react';
import SEO from '../components/seo/SEO';
import { formatCOP } from '../config/constants';

type RechargeCategory = 'celular' | 'servicios' | 'juegos';

interface Operator {
  id: string;
  name: string;
  icon: string;
}

const OPERATORS: Record<RechargeCategory, Operator[]> = {
  celular: [
    { id: 'claro', name: 'Claro', icon: '📶' },
    { id: 'movistar', name: 'Movistar', icon: '🔵' },
    { id: 'tigo', name: 'Tigo', icon: '🟡' },
    { id: 'wom', name: 'WOM', icon: '🟣' },
  ],
  servicios: [
    { id: 'enel', name: 'ENEL', icon: '⚡' },
    { id: 'epm', name: 'EPM', icon: '💧' },
  ],
  juegos: [
    { id: 'steam', name: 'Steam', icon: '🎮' },
    { id: 'google_play', name: 'Google Play', icon: '▶️' },
    { id: 'xbox', name: 'Xbox', icon: '🟢' },
    { id: 'playstation', name: 'PlayStation', icon: '🔵' },
  ],
};

const QUICK_AMOUNTS = [5_000, 10_000, 20_000, 50_000] as const;

const CATEGORIES: { id: RechargeCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'celular', label: 'Celular', icon: <Smartphone size={18} /> },
  { id: 'servicios', label: 'Servicios', icon: <Zap size={18} /> },
  { id: 'juegos', label: 'Juegos', icon: <Gamepad2 size={18} /> },
];

const RechargePage: React.FC = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<RechargeCategory>('celular');
  const [operator, setOperator] = useState('');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState<number | null>(null);

  const operators = OPERATORS[category];

  const handlePay = () => {
    if (!operator) {
      alert('Selecciona un operador');
      return;
    }
    if (!account.trim()) {
      alert('Ingresa el número de teléfono o cuenta');
      return;
    }
    if (!amount) {
      alert('Selecciona un monto');
      return;
    }
    const op = operators.find(o => o.id === operator);
    alert(`✅ Recarga procesada exitosamente\n${op?.name || operator}: ${account}\nMonto: ${formatCOP(amount)}`);
  };

  return (
    <div className="pb-24 bg-brand-bg min-h-screen">
      <SEO title="Recargas" description="Recarga celular, servicios públicos y videojuegos en Todo" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
            aria-label="Volver"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-extrabold">Recargas</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Selector de categoría */}
        <section>
          <h2 className="text-sm font-bold text-text-secondary mb-3">¿Qué quieres recargar?</h2>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id);
                  setOperator('');
                  setAmount(null);
                }}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-sm font-bold ${
                  category === cat.id
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-text-secondary hover:border-gray-300'
                }`}
              >
                <span className={category === cat.id ? 'text-purple-600' : 'text-text-muted'}>
                  {cat.icon}
                </span>
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* Selector de operador */}
        <section>
          <h2 className="text-sm font-bold text-text-secondary mb-3">Operador</h2>
          <div className="grid grid-cols-2 gap-2">
            {operators.map(op => (
              <button
                key={op.id}
                onClick={() => setOperator(op.id)}
                className={`flex items-center gap-2 py-3 px-4 rounded-xl border-2 transition-all text-sm font-bold ${
                  operator === op.id
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-text-secondary hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{op.icon}</span>
                {op.name}
              </button>
            ))}
          </div>
        </section>

        {/* Input de número/cuenta */}
        <section>
          <h2 className="text-sm font-bold text-text-secondary mb-3">
            {category === 'celular' ? 'Número de teléfono' : 'Número de cuenta'}
          </h2>
          <input
            type={category === 'celular' ? 'tel' : 'text'}
            value={account}
            onChange={e => setAccount(e.target.value)}
            placeholder={category === 'celular' ? 'Ej: 3001234567' : 'Número de cuenta'}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-purple-400 transition-all"
          />
        </section>

        {/* Montos rápidos */}
        <section>
          <h2 className="text-sm font-bold text-text-secondary mb-3">Monto</h2>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_AMOUNTS.map(a => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={`py-3 px-4 rounded-xl border-2 transition-all text-sm font-extrabold ${
                  amount === a
                    ? 'border-purple-600 bg-purple-600 text-white'
                    : 'border-gray-200 bg-white text-text-secondary hover:border-gray-300'
                }`}
              >
                {formatCOP(a)}
              </button>
            ))}
          </div>
        </section>

        {/* Botón de pago */}
        <button
          onClick={handlePay}
          disabled={!operator || !account.trim() || !amount}
          className="w-full py-4 rounded-xl bg-purple-600 text-white font-extrabold text-base transition-all hover:bg-purple-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          💳 Pagar{amount ? ` ${formatCOP(amount)}` : ''}
        </button>
      </main>
    </div>
  );
};

export default RechargePage;
