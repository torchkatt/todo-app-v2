import React, { useState } from 'react';
import { Check, Zap, Crown } from 'lucide-react';
import { useSubscriptionPlans } from '../context/SubscriptionPlanContext';
import { useAuth } from '../context/AuthContext';
import { sellerSubscriptionService } from '../services/planService';
import { useNavigate } from 'react-router-dom';

const PricingPage: React.FC = () => {
  const { plans, currentPlan, loading } = useSubscriptionPlans();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const formatCOP = (n: number) =>
    n === 0
      ? 'Gratis'
      : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

  const getPeriodLabel = (period: string, price: number) => {
    if (price === 0) return 'Para siempre';
    if (period === 'monthly') return '/mes';
    if (period === 'annual') return '/año';
    return '';
  };

  const handleUpgrade = async (planId: string) => {
    if (!user?.sellerId) {
      navigate('/login');
      return;
    }
    if (planId === currentPlan?.id) return;
    setUpgrading(planId);
    try {
      await sellerSubscriptionService.upgradePlan(user.sellerId, planId);
      window.location.reload();
    } catch {
      setUpgrading(null);
    }
  };

  const planIcons: Record<string, React.ReactNode> = {
    free: <Zap size={24} className="text-gray-400" />,
    seller_pass_monthly: <Crown size={24} className="text-brand-primary" />,
    seller_pass_annual: <Crown size={24} className="text-amber-500" />,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-gray-900">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-8 text-center">
        <h1 className="text-4xl font-extrabold text-text-primary dark:text-white mb-4">
          Planes de Suscripción
        </h1>
        <p className="text-lg text-text-secondary dark:text-gray-400 max-w-2xl mx-auto">
          Elige el plan que mejor se adapte a tu negocio. Comisiones más bajas, más
          funcionalidades, más ventas.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan?.id === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative bg-surface dark:bg-gray-800 rounded-2xl border-2 p-6 flex flex-col transition-all ${
                  plan.highlight
                    ? 'border-brand-primary dark:border-purple-500 shadow-xl shadow-purple-200/20 scale-[1.02]'
                    : 'border-border dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-primary to-brand-dark text-white px-4 py-1 rounded-full text-xs font-black">
                    MÁS POPULAR
                  </div>
                )}

                {/* Icon */}
                <div className="mb-4">{planIcons[plan.id] || <Zap size={24} />}</div>

                {/* Name */}
                <h3 className="text-xl font-extrabold text-text-primary dark:text-white mb-1">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-black text-text-primary dark:text-white">
                    {formatCOP(plan.price)}
                  </span>
                  <span className="text-sm text-text-muted dark:text-gray-500 ml-1">
                    {getPeriodLabel(plan.period, plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <p className="text-xs text-text-muted dark:text-gray-500 mt-1">
                      Comisión {plan.commissionRate * 100}% por venta
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <span className="text-text-secondary dark:text-gray-400">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  disabled={isCurrent || upgrading === plan.id}
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full py-3 rounded-xl font-black text-sm transition-all ${
                    isCurrent
                      ? 'bg-gray-100 dark:bg-gray-700 text-text-muted cursor-default'
                      : plan.highlight
                        ? 'bg-gradient-to-r from-brand-primary to-brand-dark text-white hover:shadow-lg active:scale-95'
                        : 'bg-gray-100 dark:bg-gray-700 text-text-primary dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95'
                  } ${upgrading === plan.id ? 'opacity-70' : ''}`}
                >
                  {upgrading === plan.id
                    ? 'Procesando...'
                    : isCurrent
                      ? 'Plan Actual'
                      : plan.price === 0
                        ? 'Comenzar Gratis'
                        : 'Actualizar'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
