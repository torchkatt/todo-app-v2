import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getRootCategories } from '../services/categorySeed';
import { Search, ShoppingBag, ArrowLeft, Filter, SlidersHorizontal, Loader2, Star, MapPin } from 'lucide-react';
import SEO from '../components/seo/SEO';
import type { Listing } from '../types';

const CIUDADES = ['Bucaramanga', 'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Todo Colombia'];

const Explore: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState('');
  const categories = getRootCategories();

  useEffect(() => {
    (async () => {
      try {
        let q = query(collection(db, 'listings'), where('isActive', '==', true), where('isApproved', '==', true), orderBy('createdAt', 'desc'), limit(50));
        const snap = await getDocs(q);
        setListings(snap.docs.map(d => ({ ...d.data(), id: d.id } as Listing)));
      } catch (e) { console.error('Explore error', e); }
      setLoading(false);
    })();
  }, []);

  let filtered = listings;
  if (search.trim()) {
    const t = search.toLowerCase();
    filtered = filtered.filter(l => l.title.toLowerCase().includes(t) || l.description?.toLowerCase().includes(t) || l.tags?.some(tag => tag.toLowerCase().includes(t)));
  }
  if (filterType !== 'all') filtered = filtered.filter(l => l.type === filterType);
  if (filterCat !== 'all') filtered = filtered.filter(l => l.categoryId === filterCat || l.subcategoryId === filterCat);

  return (
    <div className="pb-24 bg-brand-bg min-h-screen">
      <SEO title="Buscar" description="Encuentra productos, servicios y contenido digital en Todo" />
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"><ArrowLeft size={22} /></button>
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar productos, servicios..." className="w-full pl-11 pr-4 py-2.5 bg-gray-100 border border-transparent rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all" autoFocus />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button onClick={() => { setFilterType('all'); setFilterCat('all'); }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${filterType === 'all' && filterCat === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'}`}>Todo</button>
          <button onClick={() => setFilterType('product')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${filterType === 'product' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'}`}>📦 Productos</button>
          <button onClick={() => setFilterType('service')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${filterType === 'service' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'}`}>🛠️ Servicios</button>
          <button onClick={() => setFilterType('digital')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${filterType === 'digital' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'}`}>📱 Digital</button>
          {categories.slice(0, 4).map(cat => (
            <button key={cat.id} onClick={() => setFilterCat(cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${filterCat === cat.id ? 'bg-purple-600 text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'}`}>{cat.icon} {cat.name.split(' ').slice(0, -1).join(' ')}</button>
          ))}
        </div>
        {/* Location filter */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-2 pb-1">
          {CIUDADES.map(c => (
            <button key={c} onClick={() => setSelectedCity(selectedCity === c ? '' : c)}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all ${selectedCity === c ? 'bg-purple-600 text-white' : 'bg-gray-100 text-text-muted hover:bg-gray-200'}`}>
              <MapPin size={12} /> {c}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-text-muted gap-2"><Loader2 size={20} className="animate-spin" /> Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><Search size={48} className="mx-auto mb-4 text-text-muted" /><h2 className="text-lg font-extrabold mb-2">No encontramos resultados</h2><p className="text-sm text-text-secondary">Intenta con otros términos o filtros</p></div>
        ) : (
          <>
            <p className="text-xs text-text-muted font-semibold mb-4">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map(item => (
                <div key={item.id} onClick={() => navigate(`/listing/${item.id}`)}
                  className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer active:scale-[0.98]">
                  <div className="relative h-28 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-4xl">{item.type === 'service' ? '🛠️' : item.type === 'digital' ? '📱' : '📦'}</span>
                    {item.discountPercent ? <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white">-{item.discountPercent}%</span> : null}
                  </div>
                  <div className="p-3">
                    <h4 className="text-xs font-extrabold text-text-primary truncate mb-1">{item.title}</h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-extrabold text-purple-700">${item.price.toLocaleString('es-CO')}</span>
                      {item.originalPrice && <span className="text-[10px] text-text-muted line-through">${item.originalPrice.toLocaleString('es-CO')}</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star size={10} className="text-amber-400 fill-amber-400" />
                      <span className="text-[10px] text-text-muted font-semibold">{item.stats?.rating || 'Nuevo'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Explore;
