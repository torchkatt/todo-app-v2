import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Package, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const BottomTabs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Mostrar bottom tabs solo en rutas de la app (no landing, auth, checkout)
  const appRoutes = ['/app', '/explore', '/orders', '/profile', '/favorites', '/settings', '/help', '/reviews', '/seller', '/cart'];
  const isAppRoute = appRoutes.some(r => location.pathname === r || location.pathname.startsWith(r + '/'));
  if (!isAppRoute) return null;

  // Ocultar en páginas de login, registro y checkout
  if (['/login', '/register', '/checkout'].some(p => location.pathname.startsWith(p))) return null;

  const tabs = [
    { path: '/app', icon: Home, label: t('nav.home') },
    { path: '/explore', icon: Search, label: t('nav.search') },
    { path: '/orders', icon: Package, label: t('nav.orders') },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-sm pointer-events-auto">
      <div className="bg-slate-950/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 rounded-full px-2 py-1.5 flex items-center justify-between">
        {tabs.map((tab) => {
          const active = tab.path === '/app' ? location.pathname === '/app' : location.pathname.startsWith(tab.path);
          const Icon = tab.icon;

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
              className={`relative flex items-center justify-center transition-all duration-300 ${
                active
                  ? 'bg-slate-800/90 text-white rounded-full px-4 py-2 shadow-sm scale-100 ring-1 ring-white/10'
                  : 'px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-full'
              }`}
            >
              <Icon size={active ? 20 : 19} className={active ? 'fill-current stroke-[2.2]' : 'stroke-[1.8]'} />
              {active && (
                <span className="ml-1.5 text-xs font-bold tracking-tight animate-fade-in">
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabs;
