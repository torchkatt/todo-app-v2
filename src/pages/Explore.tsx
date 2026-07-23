import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getRootCategories } from '../services/categorySeed';
import { Search, ArrowLeft, Loader2, Star, MapPin, Mic, MicOff, Clock, X, MessageCircle, TrendingUp } from 'lucide-react';
import SEO from '../components/seo/SEO';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type { Listing } from '../types';

import ProductSkeleton from '../components/ui/ProductSkeleton';
import ProductCard from '../components/ui/ProductCard';
import { CIUDADES_COLOMBIA } from '../config/constants';

// ─── Recent Searches ────────────────────────────────────────────────────
const RECENT_KEY = 'todo_recent_searches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(term: string): void {
  if (!term.trim()) return;
  const current = getRecentSearches().filter(s => s !== term);
  current.unshift(term);
  localStorage.setItem(RECENT_KEY, JSON.stringify(current.slice(0, MAX_RECENT)));
}

function clearRecentSearches(): void {
  localStorage.removeItem(RECENT_KEY);
}

// ─── Trends ──────────────────────────────────────────────────────────────
const TRENDS = ['📱 Electrónicos', '🏠 Hogar', '🔧 Reparaciones', '👗 Ropa'] as const;

const Explore: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState('');
  const [showRecent, setShowRecent] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);
  const categories = getRootCategories();

  // Voice search
  const { isSupported: voiceSupported, isListening, transcript, start: startVoice, stop: stopVoice } = useSpeechRecognition();

  // Update search when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setSearch(transcript);
    }
  }, [transcript]);

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

  const handleSearchSubmit = useCallback((term: string) => {
    if (term.trim()) {
      addRecentSearch(term.trim());
      setRecentSearches(getRecentSearches());
    }
    setShowRecent(false);
  }, []);

  // Save search on Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(search);
    }
  };

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
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowRecent(true)}
              placeholder="Buscar productos, servicios..."
              className="w-full pl-11 pr-12 py-2.5 bg-gray-100 border border-transparent rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all"
              autoFocus
            />
            {voiceSupported && (
              <button
                type="button"
                onClick={() => isListening ? stopVoice() : startVoice()}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                  isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-text-muted hover:text-purple-600'
                }`}
                aria-label={isListening ? 'Detener voz' : 'Buscar por voz'}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
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
          {CIUDADES_COLOMBIA.map(c => (
            <button key={c} onClick={() => setSelectedCity(selectedCity === c ? '' : c)}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all ${selectedCity === c ? 'bg-purple-600 text-white' : 'bg-gray-100 text-text-muted hover:bg-gray-200'}`}>
              <MapPin size={12} /> {c}
            </button>
          ))}
        </div>
        {/* Recent searches dropdown */}
        {showRecent && recentSearches.length > 0 && (
          <div className="absolute left-0 right-0 top-full bg-white border-t border-gray-100 shadow-lg rounded-b-2xl px-4 py-3 z-50 mx-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                <Clock size={12} /> Búsquedas recientes
              </span>
              <button
                onClick={() => { clearRecentSearches(); setRecentSearches([]); }}
                className="text-[10px] text-text-muted hover:text-red-500 font-bold transition-colors"
              >
                Limpiar
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentSearches.map((term, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSearch(term);
                    handleSearchSubmit(term);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-purple-50 rounded-lg text-xs font-bold text-text-secondary hover:text-purple-700 transition-colors"
                >
                  <Clock size={11} />
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Voice listening indicator */}
        {isListening && (
          <div className="mt-2 px-4 py-2 bg-purple-50 rounded-xl border border-purple-200 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold text-purple-700">Escuchando... habla ahora</span>
          </div>
        )}
      </header>

      {/* AI suggestion banner + Trends */}
      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-3">
        {/* AI Suggestion Banner */}
        <Link
          to="/chat"
          className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl hover:shadow-md transition-shadow group"
        >
          <span className="text-2xl">💬</span>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-purple-800">¿No encuentras lo que buscas?</p>
            <p className="text-xs text-text-secondary">Pregúntale al asistente IA</p>
          </div>
          <MessageCircle size={20} className="text-purple-400 group-hover:text-purple-600 transition-colors" />
        </Link>

        {/* Trends */}
        {!search.trim() && (
          <div>
            <h3 className="text-xs font-bold text-text-muted flex items-center gap-1.5 mb-2">
              <TrendingUp size={13} /> Tendencias
            </h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {TRENDS.map((trend) => (
                <button
                  key={trend}
                  onClick={() => {
                    setSearch(trend);
                    handleSearchSubmit(trend);
                  }}
                  className="shrink-0 px-3 py-2 bg-gray-100 hover:bg-purple-50 rounded-full text-xs font-bold text-text-secondary hover:text-purple-700 transition-colors"
                >
                  {trend}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <ProductSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><Search size={48} className="mx-auto mb-4 text-text-muted" /><h2 className="text-lg font-extrabold mb-2">No encontramos resultados</h2><p className="text-sm text-text-secondary">Intenta con otros términos o filtros</p></div>
        ) : (
          <>
            <p className="text-xs text-text-muted font-semibold mb-4">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map(item => (
                <ProductCard
                  key={item.id}
                  listing={item}
                  onClick={() => navigate(`/listing/${item.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Explore;
