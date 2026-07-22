import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, limit, getDocs, getCountFromServer, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ArrowLeft, Users, Package, TrendingUp, DollarSign, ShoppingBag, Loader2, Shield, AlertTriangle, Check, X } from 'lucide-react';
import { UserRole } from '../types';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [pendingListings, setPendingListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [moderating, setModerating] = useState<string | null>(null);

  const loadPendingListings = async () => {
    const snap = await getDocs(query(collection(db, 'listings'), where('isApproved', '==', false), limit(20)));
    setPendingListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
  };

  useEffect(() => {
    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      navigate('/');
      return;
    }
    (async () => {
      try {
        const [usersCount, sellersCount, listingsCount, txSnap] = await Promise.all([
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(collection(db, 'sellers')),
          getCountFromServer(collection(db, 'listings')),
          getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(10))),
        ]);

        const recentTxs = txSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const totalRevenue = recentTxs.reduce((sum, t: any) => sum + (t.totalAmount || 0), 0);

        setStats({
          users: usersCount.data().count,
          sellers: sellersCount.data().count,
          listings: listingsCount.data().count,
          transactions: txSnap.size,
          totalRevenue,
          recentTransactions: recentTxs,
        });
        await loadPendingListings();
      } catch (e) { console.error('Admin panel error', e); }
      setLoading(false);
    })();
  }, [user, navigate]);

  const moderateListing = async (listingId: string, approve: boolean) => {
    setModerating(listingId);
    try {
      await updateDoc(doc(db, 'listings', listingId), approve ? { isApproved: true } : { isApproved: false, isActive: false });
      setPendingListings(prev => prev.filter(l => l.id !== listingId));
    } catch (e) { console.error('moderateListing error', e); }
    setModerating(null);
  };

  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><Loader2 size={28} className="animate-spin text-purple-600" /></div>;

  return (
    <div className="pb-24 bg-brand-bg min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={22} /></button>
          <h1 className="text-lg font-extrabold flex items-center gap-2"><Shield size={20} className="text-purple-600" /> Admin Panel</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-border p-5 text-center">
            <Users size={24} className="mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-extrabold text-text-primary">{stats.users || 0}</div>
            <div className="text-xs text-text-muted font-semibold">Usuarios</div>
          </div>
          <div className="bg-white rounded-xl border border-border p-5 text-center">
            <ShoppingBag size={24} className="mx-auto mb-2 text-emerald-500" />
            <div className="text-2xl font-extrabold text-text-primary">{stats.sellers || 0}</div>
            <div className="text-xs text-text-muted font-semibold">Vendedores</div>
          </div>
          <div className="bg-white rounded-xl border border-border p-5 text-center">
            <Package size={24} className="mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-extrabold text-text-primary">{stats.listings || 0}</div>
            <div className="text-xs text-text-muted font-semibold">Listados</div>
          </div>
          <div className="bg-white rounded-xl border border-border p-5 text-center">
            <DollarSign size={24} className="mx-auto mb-2 text-amber-500" />
            <div className="text-2xl font-extrabold text-text-primary">${(stats.totalRevenue || 0).toLocaleString('es-CO')}</div>
            <div className="text-xs text-text-muted font-semibold">Ingresos</div>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-extrabold text-text-primary mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-purple-600" /> Transacciones recientes</h3>
          {stats.recentTransactions?.length > 0 ? (
            <div className="space-y-2">
              {stats.recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="text-xs font-mono font-bold text-text-muted">#{tx.id?.slice(-6)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-text-primary truncate">${(tx.totalAmount || 0).toLocaleString('es-CO')}</div>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    tx.status === 'PENDING_PAYMENT' ? 'text-amber-600 bg-amber-50' :
                    tx.status === 'PAYMENT_CONFIRMED' ? 'text-emerald-600 bg-emerald-50' :
                    tx.status === 'DELIVERED' ? 'text-blue-600 bg-blue-50' :
                    tx.status === 'CANCELLED' ? 'text-red-600 bg-red-50' :
                    'text-gray-600 bg-gray-50'
                  }`}>{tx.status?.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted text-center py-4">No hay transacciones aún</p>
          )}
        </div>

        {/* Pending listings moderation */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-extrabold text-text-primary mb-4 flex items-center gap-2">
            <Package size={16} className="text-purple-600" /> Listados pendientes de aprobación
            {pendingListings.length > 0 && <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">{pendingListings.length}</span>}
          </h3>
          {pendingListings.length > 0 ? (
            <div className="space-y-2">
              {pendingListings.map(l => (
                <div key={l.id} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-text-primary truncate">{l.title}</div>
                    <div className="text-[11px] text-text-muted">${(l.price || 0).toLocaleString('es-CO')} · {l.sellerId}</div>
                  </div>
                  <button disabled={moderating === l.id} onClick={() => moderateListing(l.id, true)}
                    className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50" title="Aprobar">
                    <Check size={14} />
                  </button>
                  <button disabled={moderating === l.id} onClick={() => moderateListing(l.id, false)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50" title="Rechazar">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted text-center py-4">No hay listados pendientes</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-extrabold text-text-primary mb-3">Acciones rápidas</h3>
          <div className="grid grid-cols-2 gap-2">
            <button disabled title="Próximamente" className="p-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-400 cursor-not-allowed">👥 Gestionar usuarios</button>
            <button disabled title="Próximamente" className="p-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-400 cursor-not-allowed">🏪 Ver vendedores</button>
          </div>
          <p className="text-[10px] text-text-muted mt-2">La moderación de listados ya está disponible arriba. Gestión de usuarios y vendedores: próximamente.</p>
        </div>

        {/* System status */}
        <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <AlertTriangle size={16} className="text-emerald-500" />
          <span className="text-xs font-bold text-emerald-700">Sistema operando normalmente · Plan Spark</span>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
