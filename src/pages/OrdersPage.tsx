import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ShoppingBag, Package, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING_PAYMENT: <Clock size={16} />,
  PAYMENT_CONFIRMED: <Package size={16} />,
  PREPARING: <Package size={16} />,
  READY: <CheckCircle size={16} />,
  DELIVERED: <CheckCircle size={16} />,
  CANCELLED: <XCircle size={16} />,
};

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: 'text-amber-600 bg-amber-50',
  PAYMENT_CONFIRMED: 'text-blue-600 bg-blue-50',
  PREPARING: 'text-purple-600 bg-purple-50',
  READY: 'text-emerald-600 bg-emerald-50',
  DELIVERED: 'text-emerald-600 bg-emerald-50',
  CANCELLED: 'text-red-600 bg-red-50',
};

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const q = query(collection(db, 'transactions'), where('buyerId', '==', user.id), orderBy('createdAt', 'desc'), limit(20));
        const snap = await getDocs(q);
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error('Failed to load orders', e); }
      setLoading(false);
    })();
  }, [user?.id]);

  if (!isAuthenticated) {
    navigate('/login', { state: { from: '/orders' } });
    return null;
  }

  return (
    <div className="pb-24 bg-brand-bg min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-extrabold">Mis Pedidos</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-text-muted gap-2">
            <Loader2 size={20} className="animate-spin" /> Cargando...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={36} className="text-text-muted" />
            </div>
            <h2 className="text-lg font-extrabold text-text-primary mb-2">No tienes pedidos aún</h2>
            <p className="text-sm text-text-secondary mb-6">Explora y compra algo increíble</p>
            <button onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all active:scale-95 shadow-md shadow-purple-200">
              Explorar Todo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border border-border p-4 hover:border-purple-200 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-extrabold text-text-primary">#{order.id?.slice(-8)}</div>
                    <div className="text-[10px] text-text-muted font-semibold">
                      {order.createdAt ? new Date(order.createdAt.toDate?.() || order.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </div>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 ${STATUS_COLORS[order.status] || 'text-gray-600 bg-gray-50'}`}>
                    {STATUS_ICONS[order.status] || <Package size={14} />}
                    {order.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="space-y-1.5 mb-3">
                  {order.lineItems?.slice(0, 3).map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">x{item.quantity || 1}</span>
                      <span className="text-xs font-bold text-text-primary truncate">{item.title}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-text-muted">{order.lineItems?.length || 0} items</span>
                  <span className="text-sm font-extrabold text-purple-700">${(order.totalAmount || 0).toLocaleString('es-CO')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrdersPage;
