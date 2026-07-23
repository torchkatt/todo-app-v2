/**
 * @file pages/SellerAnalyticsPage.tsx
 * @description Dashboard de analíticas para sellers (Brands by Todo style).
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, ShoppingCart, TrendingUp, DollarSign, Loader2, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sellerAnalyticsService } from '../services/sellerAnalyticsService';
import { formatCOP } from '../config/constants';
import { getSeller } from '../services/sellerService';

const SellerAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [topListings, setTopListings] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.sellerId) { setLoading(false); return; }
    (async () => {
      try {
        const [s, t] = await Promise.all([
          sellerAnalyticsService.getSummary(user.sellerId!),
          sellerAnalyticsService.getTopListings(user.sellerId!),
        ]);
        setSummary(s);
        setTopListings(t);
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [user?.sellerId]);

  if (loading) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-purple-600" />
    </div>
  );

  const statCards = [
    { label: 'Visitas (30d)', value: summary?.totalViews || 0, icon: Eye, color: 'bg-blue-50 text-blue-600' },
    { label: 'Ventas (30d)', value: summary?.totalTransactions || 0, icon: ShoppingCart, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Ingresos (30d)', value: formatCOP(summary?.totalRevenue || 0), icon: DollarSign, color: 'bg-purple-50 text-purple-600' },
    { label: 'Conversión', value: `${(summary?.avgConversionRate * 100).toFixed(1)}%`, icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="pb-24 bg-brand-bg min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/seller')} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={22} /></button>
          <h1 className="text-lg font-extrabold">Mis Analíticas</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-border p-4">
              <div className={`w-9 h-9 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
                <card.icon size={18} />
              </div>
              <div className="text-lg font-extrabold text-text-primary">{card.value}</div>
              <div className="text-[10px] text-text-muted font-semibold mt-0.5">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Avg Order Value */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-xs font-extrabold text-text-primary mb-3 flex items-center gap-2">
            <BarChart3 size={14} className="text-purple-600" /> Ticket promedio
          </h3>
          <div className="text-2xl font-extrabold text-purple-700">
            {formatCOP(summary?.avgOrderValue || 0)}
          </div>
          <p className="text-[10px] text-text-muted mt-1">Basado en {summary?.totalTransactions || 0} transacciones de los últimos 30 días</p>
        </div>

        {/* Top Listings */}
        <div>
          <h3 className="text-sm font-extrabold text-text-primary mb-3">Top productos</h3>
          {topListings.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-6 text-center">
              <p className="text-sm text-text-muted">Aún no hay datos suficientes</p>
              <p className="text-xs text-text-muted mt-1">Las analíticas se actualizan cada 15 minutos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topListings.map((item, i) => (
                <div key={item.listingId} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-extrabold text-text-muted">#{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-text-primary truncate">{item.listingId}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      {item.views} visitas · {item.sales} ventas
                    </div>
                  </div>
                  <div className="text-xs font-extrabold text-purple-600">
                    {item.views > 0 ? `${((item.sales / item.views) * 100).toFixed(1)}%` : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SellerAnalyticsPage;
