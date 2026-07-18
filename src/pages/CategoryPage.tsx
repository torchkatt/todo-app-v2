import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { CATEGORY_SEED } from '../services/categorySeed';
import { ArrowLeft, ShoppingBag, MapPin, Star, Loader2 } from 'lucide-react';
import type { Listing } from '../types';
import { Category } from '../types';
import SEO from '../components/seo/SEO';
import { CardSkeleton } from '../components/skeleton/Skeleton';

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const cat = CATEGORY_SEED.find(c => c.slug === slug) || null;
    if (!cat) {
      // Try to find by slug in seed
      const all = Object.values(CATEGORY_SEED) as any[];
      const found = all.find((c: any) => c.slug === slug);
      setCategory(found || null);
    } else {
      setCategory(cat as unknown as Category);
    }
  }, [slug]);

  useEffect(() => {
    if (!category) return;
    (async () => {
      try {
        const q = query(collection(db, 'listings'), where('isActive', '==', true), where('isApproved', '==', true), orderBy('createdAt', 'desc'), limit(30));
        const snap = await getDocs(q);
        let all = snap.docs.map(d => ({ ...d.data(), id: d.id } as Listing));
        // Match by category or subcategory
        all = all.filter(l => l.categoryId === category.id || l.subcategoryId === category.id);
        setListings(all);
      } catch (e) { console.error('CategoryPage error', e); }
      setLoading(false);
    })();
  }, [category]);

  return (
    <div className="pb-24 bg-brand-bg min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={22} /></button>
          <h1 className="text-lg font-extrabold">{category?.icon} {category?.name}</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
      <SEO title={category?.name || 'Categoría'} description={`Explora ${category?.name || 'productos'} en Todo`} />
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-4xl">{category?.icon || '📂'}</div>
            <h2 className="text-lg font-extrabold mb-2">No hay listados en esta categoría</h2>
            <p className="text-sm text-text-secondary mb-6">Sé el primero en publicar algo aquí</p>
            <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all active:scale-95 shadow-md shadow-purple-200">Volver al inicio</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {listings.map(item => (
              <div key={item.id} onClick={() => navigate(`/listing/${item.id}`)} className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer active:scale-[0.98]">
                <div className="relative h-28 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-4xl">{item.type === 'service' ? '🛠️' : item.type === 'digital' ? '📱' : '📦'}</span>
                  {item.discountPercent ? <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white">-{item.discountPercent}%</span> : null}
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-extrabold text-text-primary leading-snug mb-1 truncate">{item.title}</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-extrabold text-purple-700">${item.price.toLocaleString('es-CO')}</span>
                    {item.originalPrice ? <span className="text-[10px] text-text-muted line-through">${item.originalPrice.toLocaleString('es-CO')}</span> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CategoryPage;
