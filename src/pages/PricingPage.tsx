import React, { useState } from 'react';
import {
  Check,
  X,
  Crown,
  Zap,
  Star,
  Shield,
  TrendingUp,
  Gift,
  Truck,
  MessageCircle,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { useSubscriptionPlans } from '../context/SubscriptionPlanContext';
import { useAuth } from '../context/AuthContext';
import { sellerSubscriptionService } from '../services/planService';
import { formatCOP } from '../config/constants';
import { useNavigate } from 'react-router-dom';
import TierBadge from '../components/ui/TierBadge';

// ─── Feature row definition ────────────────────────────────────────────────
interface FeatureRow {
  icon: React.ReactNode;
  label: string;
  /** Derive display string from plan */
  render: (plan: { [key: string]: any }) => string | boolean;
}

const FEATURES: FeatureRow[] = [
  {
    icon: <TrendingUp size={16} className="text-text-secondary" />,
    label: 'Comisión por venta',
    render: (p) => `${p.commissionRate * 100}%`,
  },
  {
    icon: <Gift size={16} className="text-text-secondary" />,
    label: 'Cashback para compradores',
    render: (p) => `${p.cashbackRateBps / 100}%`,
  },
  {
    icon: <Zap size={16} className="text-text-secondary" />,
    label: 'Listings máximos',
    render: (p) => (p.maxListings === -1 ? 'Ilimitado' : `${p.maxListings}`),
  },
  {
    icon: <Truck size={16} className="text-text-secondary" />,
    label: 'Envío gratis',
    render: (p) => p.freeShipping,
  },
  {
    icon: <BarChart3 size={16} className="text-text-secondary" />,
    label: 'Analíticas',
    render: (p) => {
      const map: Record<string, string> = {
        basic: 'Básicas',
        advanced: 'Avanzadas',
        premium: 'Premium',
      };
      return map[p.analyticsAccess] || p.analyticsAccess;
    },
  },
  {
    icon: <MessageCircle size={16} className="text-text-secondary" />,
    label: 'Prioridad IA',
    render: (p) => {
      const map: Record<string, string> = {
        standard: 'Estándar',
        priority: 'Prioritario',
        '247': '24/7',
      };
      return map[p.aiChatPriority] || p.aiChatPriority;
    },
  },
  {
    icon: <Sparkles size={16} className="text-text-secondary" />,
    label: 'Listings destacados',
    render: (p) => `${p.featuredListingsPerMonth}/mes`,
  },
  {
    icon: <Shield size={16} className="text-text-secondary" />,
    label: 'Insignia de vendedor',
    render: (p) => {
      const map: Record<string, string> = {
        none: '—',
        pro: 'Pro',
        verified: 'Verificado',
      };
      return map[p.sellerBadge] || '—';
    },
  },
  {
    icon: <Star size={16} className="text-text-secondary" />,
    label: 'Acceso API',
    render: (p) => {
      const features: string[] = p.features || [];
      return features.some((f: string) => f.toLowerCase().includes('api'));
    },
  },
  {
    icon: <Crown size={16} className="text-text-secondary" />,
    label: 'Soporte',
    render: (p) => {
      const map: Record<string, string> = {
        standard: 'Chat IA',
        priority: 'Prioritario',
        '247': '24/7 Dedicado',
      };
      return map[p.aiChatPriority] || p.aiChatPriority;
    },
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const getPeriodLabel = (period: string, price: number): string => {
  if (price === 0) return 'Para siempre';
  if (period === 'monthly') return '/mes';
  if (period === 'annual') return '/año';
  return '';
};

/** Map plan id to tier for TierBadge */
const getTierFromId = (id: string): 'free' | 'pro' | 'black' => {
  if (id === 'seller_pass_annual') return 'black';
  if (id === 'seller_pass_monthly') return 'pro';
  return 'free';
};

// ─── Skeleton ───────────────────────────────────────────────────────────────
const PricingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-brand-bg dark:bg-gray-900">
    {/* Hero skeleton */}
    <div className="max-w-6xl mx-auto px-4 pt-16 pb-8 text-center space-y-4">
      <div className="mx-auto h-10 w-72 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div className="mx-auto h-5 w-96 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
    {/* Cards skeleton */}
    <div className="max-w-6xl mx-auto px-4 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface dark:bg-gray-800 rounded-2xl border border-border p-6 space-y-4"
          >
            <div className="mx-auto h-10 w-10 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-6 w-24 mx-auto animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-10 w-28 mx-auto animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-4 w-20 mx-auto animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-12 w-full animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="mt-10 space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-5 w-40 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="flex-1 flex gap-4">
              <div className="flex-1 h-5 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="flex-1 h-5 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="flex-1 h-5 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────
const PricingPage: React.FC = () => {
  const { plans, currentPlan, loading } = useSubscriptionPlans();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upgrading, setUpgrading] = useState<string | null>(null);

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

  if (loading) return <PricingSkeleton />;

  // Sort plans: free first, then monthly pro, then annual black
  const sortedPlans = [...plans].sort((a, b) => a.sortOrder - b.sortOrder);

  const isAuthenticatedSeller = !!(user?.sellerId);

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-gray-900">
      {/* ─── Hero ─── */}
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-8 text-center">
        <h1 className="text-4xl font-extrabold text-text-primary dark:text-white mb-4">
          Planes de Suscripción
        </h1>
        <p className="text-lg text-text-secondary dark:text-gray-400 max-w-2xl mx-auto">
          Elige el plan que mejor se adapte a tu negocio. Comisiones más bajas, más
          funcionalidades, más ventas.
        </p>
        {isAuthenticatedSeller && currentPlan && (
          <div className="mt-4 inline-flex items-center gap-2 bg-surface dark:bg-gray-800 border border-border rounded-full px-4 py-2">
            <span className="text-sm text-text-muted">Tu plan actual:</span>
            <TierBadge tier={getTierFromId(currentPlan.id)} size="sm" />
            <span className="text-sm font-bold text-text-primary dark:text-white">
              {currentPlan.name}
            </span>
          </div>
        )}
      </div>

      {/* ─── Cards ─── */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sortedPlans.map((plan) => {
            const isCurrent = currentPlan?.id === plan.id;
            const tier = getTierFromId(plan.id);
            const isHighlighted = tier === 'pro';

            return (
              <div
                key={plan.id}
                className={`relative bg-surface dark:bg-gray-800 rounded-2xl border-2 p-6 flex flex-col transition-all ${
                  isHighlighted
                    ? 'border-purple-500 dark:border-purple-500 shadow-xl shadow-purple-200/20 md:scale-[1.02]'
                    : 'border-border dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                {/* Recommended badge */}
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-4 py-1 rounded-full text-xs font-black whitespace-nowrap">
                    🔥 RECOMENDADO
                  </div>
                )}

                {/* Tier badge */}
                <div className="mb-3 flex justify-center">
                  <TierBadge tier={tier} size="md" />
                </div>

                {/* Name */}
                <h3 className="text-xl font-extrabold text-text-primary dark:text-white mb-1 text-center">
                  {tier === 'pro' ? 'Pro' : tier === 'black' ? 'Black' : 'Gratis'}
                </h3>

                {/* Price */}
                <div className="mb-4 text-center">
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

                {/* Current plan badge */}
                {isCurrent && isAuthenticatedSeller && (
                  <div className="mb-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-bold">
                      <Check size={12} />
                      Actual
                    </span>
                  </div>
                )}

                {/* CTA */}
                <button
                  disabled={isCurrent || upgrading === plan.id}
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full py-3 rounded-xl font-black text-sm transition-all mb-6 ${
                    isCurrent
                      ? 'bg-gray-100 dark:bg-gray-700 text-text-muted cursor-default'
                      : isHighlighted
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

                {/* Key highlights (3 top features inside card) */}
                <div className="space-y-2 border-t border-border pt-4">
                  {[
                    `Comisión ${plan.commissionRate * 100}%`,
                    `Cashback ${plan.cashbackRateBps / 100}%`,
                    plan.maxListings === -1
                      ? 'Listings ilimitados'
                      : `${plan.maxListings} listings`,
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check size={14} className="text-green-500 shrink-0" />
                      <span className="text-text-secondary dark:text-gray-400">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Feature Comparison Table ─── */}
        <div className="mt-12 bg-surface dark:bg-gray-800 rounded-2xl border border-border overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr] bg-gray-50 dark:bg-gray-750 border-b border-border">
            <div className="px-4 py-3 text-sm font-bold text-text-muted uppercase tracking-wider">
              Característica
            </div>
            {sortedPlans.map((plan) => (
              <div
                key={plan.id}
                className="px-4 py-3 text-sm font-bold text-center text-text-primary dark:text-white"
              >
                {getTierFromId(plan.id) === 'pro'
                  ? 'Pro'
                  : getTierFromId(plan.id) === 'black'
                    ? 'Black'
                    : 'Gratis'}
              </div>
            ))}
          </div>

          {/* Table body */}
          <div className="divide-y divide-border">
            {FEATURES.map((feature, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] items-center"
              >
                {/* Feature label */}
                <div className="px-4 py-3 flex items-center gap-2 text-sm font-medium text-text-secondary dark:text-gray-400">
                  {feature.icon}
                  <span>{feature.label}</span>
                </div>

                {/* Values */}
                {sortedPlans.map((plan) => {
                  const value = feature.render(plan);
                  const isBoolean = typeof value === 'boolean';

                  if (isBoolean) {
                    return (
                      <div
                        key={plan.id}
                        className="px-4 py-3 text-center"
                      >
                        {value ? (
                          <Check size={18} className="text-green-500 mx-auto" />
                        ) : (
                          <X size={18} className="text-red-400 mx-auto" />
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={plan.id}
                      className="px-4 py-3 text-center text-sm text-text-primary dark:text-white font-medium"
                    >
                      {/* Mobile label */}
                      <span className="md:hidden text-xs text-text-muted block mb-0.5">
                        {getTierFromId(plan.id) === 'pro'
                          ? 'Pro'
                          : getTierFromId(plan.id) === 'black'
                            ? 'Black'
                            : 'Gratis'}
                        {' — '}
                      </span>
                      {value as string}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-text-muted mt-6">
          Todos los precios incluyen IVA. Puedes cambiar de plan en cualquier momento.
        </p>
      </div>
    </div>
  );
};

export default PricingPage;
