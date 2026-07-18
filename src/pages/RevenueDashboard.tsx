import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, DollarSign, ShoppingCart, Percent,
  Users, Package, RefreshCw,
} from 'lucide-react';
import { useRevenue } from '../hooks/useRevenue';
import { DateRangeFilter } from '../components/revenue/DateRangeFilter';

// ─── Formatting ───
const fmtCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

const fmtNum = (n: number) => new Intl.NumberFormat('es-CO').format(n);

// ─── Chart colors ───
const COLORS = ['#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];

// ─── Stat Card ───
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}> = ({ icon, label, value, sub, color }) => (
  <div className="bg-surface dark:bg-gray-800 rounded-2xl border border-border dark:border-gray-700 p-5 flex items-start gap-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0`} style={{ backgroundColor: color + '20' }}>
      <div style={{ color }}>{icon}</div>
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-xs font-bold text-text-muted dark:text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-xl font-black text-text-primary dark:text-white mt-0.5 truncate">{value}</span>
      {sub && <span className="text-xs text-text-muted dark:text-gray-500 mt-0.5">{sub}</span>}
    </div>
  </div>
);

// ─── Custom Tooltip ───
const ChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-xl p-3 shadow-xl">
      <p className="text-xs font-bold text-text-muted mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-sm font-black" style={{ color: entry.color }}>
          {entry.name}: {fmtCOP(entry.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Main Component ───
const RevenueDashboard: React.FC = () => {
  const { data, loading, error, dateRange, setPreset, refresh } = useRevenue();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-bg dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-bold mb-2">Error al cargar datos</p>
          <button onClick={refresh} className="text-brand-primary font-bold text-sm underline">Reintentar</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, byDay, bySeller } = data;

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-text-primary dark:text-white">
              Dashboard de Revenue
            </h1>
            <p className="text-sm text-text-muted dark:text-gray-500 mt-1">
              Análisis de ingresos, comisiones y transacciones
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangeFilter
              currentPreset={dateRange.preset}
              onPresetChange={setPreset}
            />
            <button
              onClick={refresh}
              className="p-2.5 rounded-xl bg-surface dark:bg-gray-800 border border-border dark:border-gray-700 text-text-muted dark:text-gray-400 hover:text-brand-primary transition-all"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<DollarSign size={20} />}
            label="Revenue Total"
            value={fmtCOP(summary.totalRevenue)}
            sub={`${fmtNum(summary.totalTransactions)} transacciones`}
            color="#7c3aed"
          />
          <StatCard
            icon={<Percent size={20} />}
            label="Comisiones"
            value={fmtCOP(summary.totalCommission)}
            sub={summary.totalRevenue > 0
              ? `${((summary.totalCommission / summary.totalRevenue) * 100).toFixed(1)}% del revenue`
              : '0% del revenue'}
            color="#f59e0b"
          />
          <StatCard
            icon={<Users size={20} />}
            label="Ganancias Sellers"
            value={fmtCOP(summary.sellerEarnings)}
            sub={`Avg: ${fmtCOP(summary.avgOrderValue)}/orden`}
            color="#10b981"
          />
          <StatCard
            icon={<ShoppingCart size={20} />}
            label="Ticket Promedio"
            value={fmtCOP(summary.avgOrderValue)}
            sub={`${fmtNum(summary.totalTransactions)} órdenes completadas`}
            color="#3b82f6"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Over Time */}
          <div className="bg-surface dark:bg-gray-800 rounded-2xl border border-border dark:border-gray-700 p-6">
            <h3 className="text-lg font-extrabold text-text-primary dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-brand-primary" />
              Revenue Diario
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(d) => {
                    const date = new Date(d + 'T00:00:00');
                    return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => fmtCOP(v)} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#7c3aed' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="commission"
                  name="Comisión"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Transactions by Day */}
          <div className="bg-surface dark:bg-gray-800 rounded-2xl border border-border dark:border-gray-700 p-6">
            <h3 className="text-lg font-extrabold text-text-primary dark:text-white mb-4 flex items-center gap-2">
              <Package size={20} className="text-emerald-500" />
              Transacciones por Día
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(d) => {
                    const date = new Date(d + 'T00:00:00');
                    return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-3 shadow-xl">
                        <p className="text-xs font-bold text-text-muted mb-1">{label}</p>
                        <p className="text-sm font-black text-brand-primary">
                          {payload[0].value} transacciones
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="transactions" name="Transacciones" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Seller Rankings + Revenue Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Sellers */}
          <div className="bg-surface dark:bg-gray-800 rounded-2xl border border-border dark:border-gray-700 p-6">
            <h3 className="text-lg font-extrabold text-text-primary dark:text-white mb-4 flex items-center gap-2">
              <Users size={20} className="text-amber-500" />
              Top Sellers por Revenue
            </h3>
            <div className="space-y-3">
              {bySeller.slice(0, 10).map((s, idx) => (
                <div
                  key={s.sellerId}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                    idx < 3 ? 'bg-brand-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-text-muted'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary dark:text-white truncate">
                      {s.sellerName}
                    </p>
                    <p className="text-xs text-text-muted">{fmtNum(s.transactions)} transacciones</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {fmtCOP(s.revenue)}
                    </p>
                    <p className="text-xs text-text-muted">
                      Comisión: {fmtCOP(s.commission)}
                    </p>
                  </div>
                </div>
              ))}
              {bySeller.length === 0 && (
                <p className="text-sm text-text-muted text-center py-4">Sin datos en este período</p>
              )}
            </div>
          </div>

          {/* Revenue Composition */}
          <div className="bg-surface dark:bg-gray-800 rounded-2xl border border-border dark:border-gray-700 p-6">
            <h3 className="text-lg font-extrabold text-text-primary dark:text-white mb-4 flex items-center gap-2">
              <Percent size={20} className="text-pink-500" />
              Composición del Revenue
            </h3>
            {summary.totalRevenue > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Comisión', value: summary.totalCommission },
                        { name: 'Ganancias Sellers', value: summary.sellerEarnings },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      <Cell fill="#f59e0b" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => fmtCOP(Number(value))}
                      labelFormatter={(label: any) => String(label)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-8 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-text-muted">
                      Comisión ({((summary.totalCommission / summary.totalRevenue) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-text-muted">
                      Sellers ({((summary.sellerEarnings / summary.totalRevenue) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-text-muted text-center py-12">Sin datos en este período</p>
            )}
          </div>
        </div>

        {/* Summary Footer */}
        <div className="mt-8 p-4 bg-surface dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 text-center">
          <p className="text-xs text-text-muted dark:text-gray-500">
            Período: {new Date(summary.periodStart).toLocaleDateString('es-CO')} —{' '}
            {new Date(summary.periodEnd).toLocaleDateString('es-CO')}
            {' · '}
            {fmtNum(summary.totalTransactions)} transacciones completadas
            {' · '}
            {fmtCOP(summary.totalRevenue)} revenue total
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevenueDashboard;
