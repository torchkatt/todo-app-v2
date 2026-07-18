import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ArrowLeft, Store, Plus, TrendingUp, Package, Star, Loader2, DollarSign, Users } from 'lucide-react';
import type { Seller, Listing } from '../types';
import { UserRole } from '../types';

const SellerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', type: 'product' as const, price: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const q = query(collection(db, 'sellers'), where('ownerId', '==', user.id), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const s = { ...snap.docs[0].data(), id: snap.docs[0].id } as Seller;
          setSeller(s);
          const lq = query(collection(db, 'listings'), where('sellerId', '==', s.id), orderBy('createdAt', 'desc'), limit(30));
          const ls = await getDocs(lq);
          setListings(ls.docs.map(d => ({ ...d.data(), id: d.id } as Listing)));
        }
      } catch (e) { console.error('SellerDash error', e); }
      setLoading(false);
    })();
  }, [user?.id]);

  const createSeller = async () => {
    if (!user) return;
    const ref = await addDoc(collection(db, 'sellers'), {
      ownerId: user.id, name: user.fullName || 'Mi Tienda', slug: `tienda-${user.id?.slice(-6)}`,
      type: 'individual', categoryIds: [], description: 'Vendedor en Todo',
      logo: '🏪', location: { address: '', city: 'Bucaramanga', neighborhood: '' },
      contact: { email: user.email, phone: '' }, rating: 0, ratingCount: 0,
      deliveryConfig: { isEnabled: false, baseFee: 0, pricePerKm: 0, maxDistanceKm: 0 },
      subscription: 'free', isActive: true, isVerified: false,
      stats: { totalTransactions: 0, totalRevenue: 0, totalListings: 0, activeListings: 0, completionRate: 0, avgRating: 0, responseTimeHours: 0 },
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, 'users', user.id), { role: UserRole.SELLER, sellerId: ref.id });
    setSeller({ id: ref.id, ownerId: user.id, name: user.fullName || 'Mi Tienda', slug: `tienda-${user.id?.slice(-6)}`, type: 'individual', categoryIds: [], description: 'Vendedor en Todo', logo: '🏪', location: { address: '', city: 'Bucaramanga', neighborhood: '' }, contact: { email: user.email, phone: '' }, rating: 0, ratingCount: 0, deliveryConfig: { isEnabled: false, baseFee: 0, pricePerKm: 0, maxDistanceKm: 0 }, subscription: 'free', isActive: true, isVerified: false, stats: { totalTransactions: 0, totalRevenue: 0, totalListings: 0, activeListings: 0, completionRate: 0, avgRating: 0, responseTimeHours: 0 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Seller);
  };

  const createListing = async () => {
    if (!seller) return;
    await addDoc(collection(db, 'listings'), {
      sellerId: seller.id, categoryId: 'cat-otros', type: form.type, title: form.name, description: form.description,
      price: form.price, quantity: 1, deliveryMethods: ['pickup'], tags: [], isActive: true, isFeatured: false,
      isApproved: true, discountPercent: 0, stats: { views: 0, favorites: 0, transactions: 0, rating: 0, ratingCount: 0 },
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    setShowForm(false);
    setForm({ name: '', description: '', type: 'product', price: 0 });
    window.location.reload();
  };

  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><Loader2 size={28} className="animate-spin text-purple-600" /></div>;

  return (
    <div className="pb-24 bg-brand-bg min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={22} /></button>
          <h1 className="text-lg font-extrabold">{seller ? `${seller.logo} ${seller.name}` : '🏪 Mi Tienda'}</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        {!seller ? (
          <div className="text-center py-16">
            <Store size={48} className="mx-auto mb-4 text-purple-600" />
            <h2 className="text-xl font-extrabold mb-2">Crea tu tienda en Todo</h2>
            <p className="text-sm text-text-secondary mb-6">Vende productos, servicios o contenido digital. Sin comisión el primer mes.</p>
            <button onClick={createSeller} className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all active:scale-95 shadow-lg shadow-purple-200">
              🚀 Crear mi tienda ahora
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-xl border border-border p-4 text-center"><DollarSign size={20} className="mx-auto mb-1 text-emerald-500" /><div className="text-lg font-extrabold">${seller.stats.totalRevenue.toLocaleString('es-CO')}</div><div className="text-[10px] text-text-muted font-semibold">Ingresos</div></div>
              <div className="bg-white rounded-xl border border-border p-4 text-center"><Package size={20} className="mx-auto mb-1 text-purple-500" /><div className="text-lg font-extrabold">{seller.stats.totalTransactions}</div><div className="text-[10px] text-text-muted font-semibold">Ventas</div></div>
              <div className="bg-white rounded-xl border border-border p-4 text-center"><Star size={20} className="mx-auto mb-1 text-amber-400" /><div className="text-lg font-extrabold">{seller.rating || 'Nuevo'}</div><div className="text-[10px] text-text-muted font-semibold">Rating</div></div>
            </div>

            {/* Listings */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-text-primary">Mis Listados ({listings.length})</h3>
              <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-all active:scale-95 shadow-sm shadow-purple-200">{showForm ? '✕ Cancelar' : '+ Nuevo'}</button>
            </div>

            {showForm && (
              <div className="bg-white rounded-xl border border-border p-4 mb-4 space-y-3">
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre del producto/servicio" className="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm outline-none focus:border-purple-400 transition-all" />
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción breve" className="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm outline-none focus:border-purple-400 transition-all" />
                <div className="flex gap-2">
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm outline-none focus:border-purple-400 transition-all">
                    <option value="product">📦 Producto</option><option value="service">🛠️ Servicio</option><option value="digital">📱 Digital</option>
                  </select>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} placeholder="Precio COP" className="flex-1 px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm outline-none focus:border-purple-400 transition-all" />
                </div>
                <button onClick={createListing} disabled={!form.name || form.price <= 0} className="w-full py-2.5 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-all active:scale-95 disabled:opacity-50">Publicar listado</button>
              </div>
            )}

            <div className="space-y-2">
              {listings.map(l => (
                <div key={l.id} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
                  <span className="text-2xl">{l.type === 'service' ? '🛠️' : l.type === 'digital' ? '📱' : '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold text-text-primary truncate">{l.title}</div>
                    <div className="text-xs text-text-muted">${l.price.toLocaleString('es-CO')} · {l.isActive ? '✅' : '⛔'} · {l.stats?.views || 0} vistas</div>
                  </div>
                  <button onClick={() => navigate(`/listing/${l.id}`)} className="text-xs font-bold text-purple-600 hover:underline">Ver</button>
                </div>
              ))}
              {listings.length === 0 && <p className="text-center text-sm text-text-muted py-8">Aún no has creado listados. ¡Publica tu primero!</p>}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SellerDashboard;
