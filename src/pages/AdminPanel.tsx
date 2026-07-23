import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, limit, getDocs, getCountFromServer, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  ArrowLeft, Users, Package, TrendingUp, DollarSign, ShoppingBag,
  Loader2, Shield, AlertTriangle, Check, X,
  UserCog, CreditCard, LayoutDashboard, Clock, Star, UserPlus,
  Ban, RefreshCw,
} from 'lucide-react';
import { UserRole, TransactionStatus } from '../types';
import { formatCOP } from '../config/constants';

// ─── Helpers ──────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  SELLER: 'bg-emerald-100 text-emerald-700',
  COURIER: 'bg-orange-100 text-orange-700',
  CUSTOMER: 'bg-gray-100 text-gray-700',
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  SELLER: 'Vendedor',
  COURIER: 'Mensajero',
  CUSTOMER: 'Cliente',
};

function formatFirebaseDate(ts: any): string {
  if (!ts) return '—';
  try {
    if (typeof ts.toDate === 'function') return ts.toDate().toLocaleDateString('es-CO');
    if (ts.seconds != null) return new Date(ts.seconds * 1000).toLocaleDateString('es-CO');
  } catch { /* fall through */ }
  if (typeof ts === 'string') {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? ts.slice(0, 10) : d.toLocaleDateString('es-CO');
  }
  return '—';
}

function getStatusBadge(status: string): { label: string; className: string } {
  const s = status || '';
  if (s === 'DELIVERED' || s === 'ATTENDED' || s === 'COMPLETED') {
    return { label: 'Completado', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (s === 'PENDING_PAYMENT' || s === 'PAYMENT_CONFIRMED' || s === 'PREPARING' || s === 'READY' || s === 'IN_TRANSIT' || s === 'CONFIRMED' || s === 'PENDING') {
    return { label: 'Pendiente', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  if (s === 'CANCELLED' || s === 'REFUNDED' || s === 'DISPUTED' || s === 'NO_SHOW') {
    return { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200' };
  }
  return { label: s.replace(/_/g, ' '), className: 'bg-gray-50 text-gray-600 border-gray-200' };
}

function isCompletedStatus(status: string): boolean {
  return status === 'DELIVERED' || status === 'ATTENDED' || status === 'COMPLETED';
}

// ─── Component ────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'users' | 'transactions' | 'moderation';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
  { key: 'users', label: 'Usuarios', icon: <UserCog size={14} /> },
  { key: 'transactions', label: 'Transacciones', icon: <CreditCard size={14} /> },
  { key: 'moderation', label: 'Moderación', icon: <Shield size={14} /> },
];

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // ── tab state ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // ── data ─────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    users: 0,
    sellers: 0,
    listings: 0,
    transactions: 0,
    totalRevenue: 0,
    activeSellers: 0,
    pendingReviews: 0,
    newUsersToday: 0,
  });
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [pendingListings, setPendingListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moderating, setModerating] = useState<string | null>(null);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  // ── redirect non-admin ───────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && (!user || user.role !== UserRole.SUPER_ADMIN)) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // ── load all data ────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // ── parallel fetches ──────────────────────────────────────────
      const [
        usersCountSnap,
        sellersCountSnap,
        listingsCountSnap,
        txSnap,
        sellersSnap,
        pendingSnap,
        usersSnap,
        allTxSnap,
      ] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(collection(db, 'sellers')),
        getCountFromServer(collection(db, 'listings')),
        getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(500))),
        getDocs(collection(db, 'sellers')),
        getDocs(query(collection(db, 'listings'), where('isApproved', '==', false), limit(50))),
        getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(20))),
        getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(20))),
      ]);

      // ── compute stats ──────────────────────────────────────────────
      const allTx = txSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const completedTx = allTx.filter((t: any) => isCompletedStatus(t.status));
      const totalRevenue = completedTx.reduce((sum: number, t: any) => sum + (t.totalAmount || 0), 0);

      const activeSellers = sellersSnap.docs.filter(d => d.data().isActive !== false).length;

      const pendingListingsData = pendingSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const txData = allTxSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      // new users today (client-side filtering — firestore range queries need indexes)
      let newUsersToday = 0;
      for (const u of usersSnap.docs) {
        const d = u.data();
        const created = d.createdAt;
        if (created) {
          let date: Date | null = null;
          try {
            if (typeof created.toDate === 'function') date = created.toDate();
            else if (created.seconds != null) date = new Date(created.seconds * 1000);
            else date = new Date(created);
            if (date && !isNaN(date.getTime()) && date >= todayStart) newUsersToday++;
          } catch { /* skip */ }
        }
      }

      setStats({
        users: usersCountSnap.data().count,
        sellers: sellersCountSnap.data().count,
        listings: listingsCountSnap.data().count,
        transactions: allTx.length,
        totalRevenue,
        activeSellers,
        pendingReviews: pendingListingsData.length,
        newUsersToday,
      });

      setAllUsers(usersData);
      setAllTransactions(txData);
      setPendingListings(pendingListingsData);
    } catch (e: any) {
      console.error('Admin panel error', e);
      setError(e?.message || 'Error al cargar datos');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user && user.role === UserRole.SUPER_ADMIN) {
      loadData();
    }
  }, [user]);

  // ── moderation ──────────────────────────────────────────────────────
  const moderateListing = async (listingId: string, approve: boolean) => {
    setModerating(listingId);
    try {
      await updateDoc(doc(db, 'listings', listingId), approve
        ? { isApproved: true }
        : { isApproved: false, isActive: false });
      setPendingListings(prev => prev.filter(l => l.id !== listingId));
      setStats(prev => ({ ...prev, pendingReviews: Math.max(0, prev.pendingReviews - 1) }));
    } catch (e) {
      console.error('moderateListing error', e);
    }
    setModerating(null);
  };

  // ── user role update ────────────────────────────────────────────────
  const updateUserRole = async (userId: string, newRole: string) => {
    setRoleUpdating(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (e) {
      console.error('updateUserRole error', e);
    }
    setRoleUpdating(null);
  };

  // ── deactivate user ─────────────────────────────────────────────────
  const deactivateUser = async (userId: string) => {
    setDeactivating(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { isActive: false });
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: false } : u));
    } catch (e) {
      console.error('deactivateUser error', e);
    }
    setDeactivating(null);
  };

  // ── loading / no-access states ──────────────────────────────────────
  if (authLoading || (loading && !stats.users)) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    return null; // will redirect via useEffect
  }

  // ── render helpers ─────────────────────────────────────────────────

  const renderStatCard = (
    icon: React.ReactNode,
    value: string | number,
    label: string,
    colorClass: string = 'text-purple-600',
  ) => (
    <div className="bg-white rounded-xl border border-border p-5 text-center">
      <div className={`mx-auto mb-2 ${colorClass}`}>{icon}</div>
      <div className="text-2xl font-extrabold text-text-primary">{value}</div>
      <div className="text-xs text-text-muted font-semibold mt-0.5">{label}</div>
    </div>
  );

  // ──────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────
  return (
    <div className="pb-24 bg-brand-bg min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-lg font-extrabold flex items-center gap-2">
              <Shield size={20} className="text-purple-600" /> Admin Panel
            </h1>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            title="Refrescar datos"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-purple-600' : 'text-text-muted'} />
          </button>
        </div>
      </header>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <nav className="sticky top-[57px] z-30 bg-brand-bg/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 flex overflow-x-auto gap-0">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.key === 'moderation' && pendingListings.length > 0 && (
                <span className="ml-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {pendingListings.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* ── Error banner ─────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700">Error al cargar datos</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
            <button onClick={loadData} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors shrink-0">
              <RefreshCw size={16} className="text-red-500" />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            DASHBOARD TAB
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {renderStatCard(<Users size={24} />, stats.users, 'Usuarios totales', 'text-purple-600')}
              {renderStatCard(<ShoppingBag size={24} />, stats.activeSellers, 'Vendedores activos', 'text-emerald-500')}
              {renderStatCard(<Package size={24} />, stats.listings, 'Listados totales', 'text-blue-500')}
              {renderStatCard(<CreditCard size={24} />, stats.transactions, 'Transacciones', 'text-indigo-500')}
              {renderStatCard(<DollarSign size={24} />, formatCOP(stats.totalRevenue), 'Ingresos totales', 'text-amber-500')}
              {renderStatCard(<AlertTriangle size={24} />, stats.pendingReviews, 'Pendientes revisión', 'text-orange-500')}
              {renderStatCard(<Clock size={24} />, stats.newUsersToday, 'Nuevos hoy', 'text-teal-500')}
              {renderStatCard(<Star size={24} />, stats.sellers, 'Vendedores totales', 'text-pink-500')}
            </div>

            {/* System status */}
            <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <AlertTriangle size={16} className="text-emerald-500" />
              <span className="text-xs font-bold text-emerald-700">Sistema operando normalmente · Plan Spark</span>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            USERS TAB
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="text-sm font-extrabold text-text-primary mb-4 flex items-center gap-2">
              <UserCog size={16} className="text-purple-600" /> Gestión de usuarios
              <span className="text-[10px] font-bold text-text-muted ml-auto">
                {allUsers.length} recientes
              </span>
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-purple-600" />
              </div>
            ) : allUsers.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-8">No hay usuarios registrados</p>
            ) : (
              <div className="space-y-1.5">
                {allUsers.map((u: any) => (
                  <div
                    key={u.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      u.isActive === false ? 'bg-red-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-extrabold text-purple-700">
                        {(u.fullName || u.email || 'U')[0]?.toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary truncate">
                          {u.fullName || 'Sin nombre'}
                        </span>
                        {u.isActive === false && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 text-red-600 shrink-0">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-muted truncate">{u.email || '—'}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${ROLE_COLORS[u.role] || ROLE_COLORS.CUSTOMER}`}>
                          {ROLE_LABELS[u.role] || u.role || 'Cliente'}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {formatFirebaseDate(u.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Role dropdown */}
                      <select
                        value={u.role || UserRole.CUSTOMER}
                        onChange={(e) => updateUserRole(u.id, e.target.value)}
                        disabled={roleUpdating === u.id}
                        className="text-[10px] font-bold border border-border rounded-lg px-2 py-1.5 bg-white text-text-primary cursor-pointer disabled:opacity-50"
                      >
                        {Object.values(UserRole).map(r => (
                          <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                        ))}
                      </select>

                      {/* Deactivate button */}
                      {u.isActive !== false && (
                        <button
                          onClick={() => deactivateUser(u.id)}
                          disabled={deactivating === u.id}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                          title="Desactivar usuario"
                        >
                          {deactivating === u.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Ban size={12} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TRANSACTIONS TAB
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="text-sm font-extrabold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-600" /> Transacciones recientes
              <span className="text-[10px] font-bold text-text-muted ml-auto">
                {allTransactions.length} últimas
              </span>
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-purple-600" />
              </div>
            ) : allTransactions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard size={28} className="mx-auto mb-2 text-text-muted opacity-40" />
                <p className="text-xs text-text-muted">No hay transacciones aún</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {allTransactions.map((tx: any) => {
                  const badge = getStatusBadge(tx.status);
                  return (
                    <div key={tx.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                      {/* Amount */}
                      <div className="text-sm font-extrabold text-text-primary shrink-0 w-24">
                        {formatCOP(tx.totalAmount || 0)}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-primary truncate">
                            {tx.buyerEmail || tx.buyerName || tx.buyerId?.slice(0, 8) || '—'}
                          </span>
                        </div>
                        <div className="text-[11px] text-text-muted truncate">
                          Vendedor: {tx.sellerName || tx.sellerId?.slice(0, 8) || '—'}
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          {formatFirebaseDate(tx.createdAt)} · #{tx.id?.slice(-6)}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full border shrink-0 ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODERATION TAB
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'moderation' && (
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="text-sm font-extrabold text-text-primary mb-4 flex items-center gap-2">
              <Shield size={16} className="text-purple-600" /> Listados pendientes de aprobación
              {pendingListings.length > 0 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                  {pendingListings.length}
                </span>
              )}
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-purple-600" />
              </div>
            ) : pendingListings.length === 0 ? (
              <div className="text-center py-8">
                <Check size={28} className="mx-auto mb-2 text-emerald-400" />
                <p className="text-xs text-text-muted">No hay listados pendientes de revisión</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {pendingListings.map(l => (
                  <div key={l.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-text-primary truncate">{l.title}</div>
                      <div className="text-[11px] text-text-muted">
                        {formatCOP(l.price || 0)} · Vendedor: {l.sellerId?.slice(0, 8) || '—'}
                      </div>
                    </div>
                    <button
                      disabled={moderating === l.id}
                      onClick={() => moderateListing(l.id, true)}
                      className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      title="Aprobar"
                    >
                      {moderating === l.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    </button>
                    <button
                      disabled={moderating === l.id}
                      onClick={() => moderateListing(l.id, false)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                      title="Rechazar"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
