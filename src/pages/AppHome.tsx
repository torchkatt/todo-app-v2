import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useFeaturedListings, useCategories, useSubcategories, useSellersByIds } from '../hooks/useFirestore';
import { Search, ShoppingBag, MapPin, Bell, User, Sparkles, Star, Clock, TrendingUp, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { CATEGORY_SEED, getRootCategories as getSeedRoot, getSubcategories as getSeedSubs } from '../services/categorySeed';
import SEO from '../components/seo/SEO';
import { useTranslation } from 'react-i18next';

const AppHome: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { totalItems, addItem } = useCart();
  const { unreadCount } = useNotifications();
  const { data: categories } = useCategories();
  const { data: featuredListings, loading: featuredLoading } = useFeaturedListings();
  const rootCategories = categories.length > 0 ? categories : getSeedRoot();
  const [expandedCat, setExpandedCat] = React.useState<string | null>(null);
  const [searchFocused, setSearchFocused] = React.useState(false);
  const sellerIds = featuredListings.map(l => l.sellerId).filter(Boolean);
  const sellers = useSellersByIds(sellerIds);
  const subs = useSubcategories(expandedCat);

  return (
    <div className="pb-24 bg-brand-bg min-h-screen font-sans">
      <SEO title={t('app.home.title')} description={t('app.description')} />

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => navigate('/app')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/25">
                <Sparkles size={18} className="text-white" />
              </div>
              <h1 className="text-xl font-black text-text-primary tracking-tight">Todo</h1>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xl relative">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`w-full pl-10 pr-4 py-2.5 bg-gray-100 border rounded-xl text-sm font-semibold text-text-primary placeholder:text-text-muted outline-none transition-all ${
                  searchFocused ? 'border-purple-400 ring-3 ring-purple-100 bg-white shadow-sm' : 'border-transparent'
                }`}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5">
              <button onClick={() => navigate('/explore')} aria-label={t('nav.search')} className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-text-secondary">
                <MapPin size={20} />
              </button>
              <button aria-label={t('nav.notifications')} className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-text-secondary">
                <Bell size={20} />
              </button>
              <button onClick={() => navigate('/cart')} aria-label={t('nav.cart')} className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-text-secondary relative">
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-purple-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1">
                    {totalItems}
                  </span>
                )}
              </button>
              <button onClick={() => navigate(isAuthenticated ? '/profile' : '/login')} aria-label={t('nav.profile')} className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-text-secondary relative">
                <User size={20} />
                {isAuthenticated && <span className="absolute bottom-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">

        {/* ─── HERO BANNER ─── */}
        <section className="relative mt-4 mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-6 md:p-8 shadow-lg shadow-purple-500/20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white mb-4">
              <Sparkles size={12} /> {t('app.hero.badge')}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">
              {t('app.hero.title1')}<br />
              <span className="text-amber-200">{t('app.hero.title2')}</span>
            </h2>
            <p className="text-sm md:text-base text-violet-200 mb-5 max-w-lg">
              {t('app.hero.subtitle')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => navigate('/explore')} className="px-5 py-2.5 bg-white text-violet-700 rounded-xl text-sm font-extrabold shadow-md hover:shadow-lg transition-all active:scale-95">
                {t('app.hero.explore')}
              </button>
              <button onClick={() => navigate('/register')} className="px-5 py-2.5 bg-white/15 backdrop-blur-sm text-white border border-white/20 rounded-xl text-sm font-extrabold hover:bg-white/25 transition-all active:scale-95">
                {t('app.hero.sell')}
              </button>
            </div>
          </div>
        </section>

        {/* ─── BENEFITS BAR ─── */}
        <div className="grid grid-cols-3 gap-2 mb-8">
          {[
            { icon: TrendingUp, text: t('home.benefits.commission'), sub: t('home.benefits.commission.sub') },
            { icon: Clock, text: t('home.benefits.flexible'), sub: t('home.benefits.flexible.sub') },
            { icon: Star, text: t('home.benefits.verified'), sub: t('home.benefits.verified.sub') },
          ].map(({ icon: Icon, text, sub }) => (
            <div key={text} className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border border-border text-center">
              <Icon size={18} className="text-purple-600" />
              <span className="text-xs font-extrabold text-text-primary">{text}</span>
              <span className="text-[10px] font-semibold text-text-muted">{sub}</span>
            </div>
          ))}
        </div>

        {/* ─── CATEGORIES ─── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-extrabold text-text-primary tracking-tight">{t('home.categories')}</h3>
            <button onClick={() => navigate('/explore')} className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1">
              {t('home.viewAll')} <ChevronRight size={14} />
            </button>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            <button
              onClick={() => setExpandedCat(null)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 border ${
                expandedCat === null
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-200'
                  : 'bg-white border-border text-text-secondary hover:border-purple-300 hover:text-purple-600'
              }`}
            >
              📋 Todo
            </button>
            {rootCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 border ${
                  expandedCat === cat.id
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-200'
                    : 'bg-white border-border text-text-secondary hover:border-purple-300 hover:text-purple-600'
                }`}
              >
                {cat.icon} {cat.name.split(' ').slice(0, -1).join(' ')}
              </button>
            ))}
          </div>

          {/* Subcategory panel */}
          {expandedCat && (() => {
            const parent = rootCategories.find(c => c.id === expandedCat);
            return (
              <div className="mt-3 p-4 bg-white rounded-2xl border border-border shadow-md">
                <h4 className="text-sm font-extrabold text-text-primary mb-3 flex items-center gap-1.5">
                  <span>{parent?.icon || '📌'}</span> {(parent?.name || '').split(' ').slice(0, -1).join(' ') || 'Categoría'}
                  <span className="text-[10px] font-bold text-text-muted ml-1">{subs.length}</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {(subs.length > 0 ? subs : getSeedSubs(expandedCat)).map(sub => (
                    <div key={sub.id} onClick={() => navigate(`/category/${sub.slug}`)} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-violet-50 cursor-pointer transition-colors group">
                      <span className="text-lg group-hover:scale-110 transition-transform">{sub.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-text-primary truncate">{sub.name.split(' ').slice(0, -1).join(' ')}</div>
                      </div>
                      <ChevronRight size={13} className="text-text-muted group-hover:text-purple-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </section>

        {/* ─── FEATURED SECTION ─── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-extrabold text-text-primary tracking-tight">{t('app.featured.title')}</h3>
              <p className="text-xs text-text-muted font-semibold">{t('app.featured.subtitle')}</p>
            </div>
            <button onClick={() => navigate('/explore')} className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1">
              {t('home.viewAll')} <ChevronRight size={14} />
            </button>
          </div>

          {/* Featured grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {featuredLoading ? (
              <div className="col-span-3 flex items-center justify-center py-16 text-text-muted gap-2">
                <Loader2 size={20} className="animate-spin" /> {t('common.loading')}
              </div>
            ) : featuredListings.length === 0 ? (
              <div className="col-span-3 text-center py-16 text-text-muted font-semibold">
                {t('app.featured.empty')}
              </div>
            ) : featuredListings.map(item => {
              const seller = sellers[item.sellerId];
              const badge = (item.discountPercent ?? 0) > 0 ? `-${item.discountPercent}%` : item.type === 'service' ? 'Servicio' : 'Nuevo';
              return (
              <div
                key={item.id}
                onClick={() => navigate(`/listing/${item.id}`)}
                className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="relative h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10" />
                  <span className="text-5xl relative z-20 group-hover:scale-110 transition-transform">{item.type === 'service' ? '🛠️' : item.type === 'digital' ? '📱' : item.categoryId?.includes('food') ? '🍕' : item.categoryId?.includes('tech') ? '💻' : item.categoryId?.includes('fashion') ? '👕' : '📦'}</span>
                  {item.discountPercent != null && item.discountPercent > 0 && (
                    <div className="absolute top-3 left-3 z-20">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white">-{item.discountPercent}%</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <h4 className="text-sm font-extrabold text-text-primary leading-snug flex-1">{item.title}</h4>
                    <span className="text-[10px] font-bold text-text-muted bg-gray-100 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0">{item.type}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-lg font-extrabold text-purple-700">${item.price.toLocaleString('es-CO')}</span>
                    {item.originalPrice && <span className="text-xs text-text-muted line-through font-semibold">${item.originalPrice.toLocaleString('es-CO')}</span>}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-[11px] font-semibold text-text-muted">{seller?.name || item.sellerId?.slice(-8) || 'Vendedor'}</span>
                    <button onClick={(e) => { e.stopPropagation(); addItem({ listingId: item.id, title: item.title, price: item.price, icon: item.type === 'service' ? '🛠️' : '📦', sellerId: item.sellerId, sellerName: seller?.name || 'Vendedor' }); }}
                      className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors active:scale-90 shadow-sm shadow-purple-200">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </section>

        {/* ─── SELLER CTA ─── */}
        <section className="mt-8 mb-4">
          <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 p-6 md:p-8 text-center text-white shadow-lg shadow-purple-500/20">
            <Sparkles size={32} className="mx-auto mb-3 text-amber-300" />
            <h3 className="text-xl font-extrabold mb-2">{t('app.sellerCta.title')}</h3>
            <p className="text-sm text-purple-200 mb-5 max-w-md mx-auto">
              {t('app.sellerCta.subtitle')}
            </p>
            <button onClick={() => navigate('/register')} className="px-6 py-3 bg-white text-purple-700 rounded-xl text-sm font-extrabold shadow-lg hover:shadow-xl transition-all active:scale-95">
              {t('seller.create')}
            </button>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="border-t border-border mt-8 pt-6 pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center">
                <Sparkles size={12} className="text-white" />
              </div>
              <span className="text-sm font-extrabold text-text-primary">{t('app.name')}</span>
              <span className="text-xs text-text-muted">— {t('app.tagline')}</span>
            </div>
            <div className="flex gap-4">
              {[
                { key: t('nav.terms'), path: '/terms' },
                { key: t('nav.privacy'), path: '/privacy' },
                { key: t('nav.help'), path: '/help' },
              ].map(l => (
                <a key={l.key} onClick={() => navigate(l.path)} className="text-xs font-semibold text-text-muted hover:text-purple-600 transition-colors cursor-pointer">{l.key}</a>
              ))}
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
};

export default AppHome;
