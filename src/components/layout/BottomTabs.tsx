/**
 * @file components/layout/BottomTabs.tsx
 * @description Bottom navigation bar — acceso rápido a las secciones principales.
 * El chat IA tiene su propio FAB flotante (AIChatButton). El rol activo se muestra
 * como indicador sutil junto al perfil; el switcher completo está en RoleSwitcher.
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Package, User, Rss, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const BottomTabs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();

  // No mostrar en páginas de autenticación ni en la landing de marketing
  if (['/login', '/register', '/landing'].some(p => location.pathname === p)) return null;

  const isSeller = user?.primaryRole === UserRole.SELLER;
  const tabs = [
    { path: '/app', icon: Home, label: t('nav.home') },
    { path: '/explore', icon: Search, label: t('nav.search') },
    { path: '/feed', icon: Rss, label: 'Feed' },
    { path: '/orders', icon: Package, label: t('nav.orders') },
    { path: isSeller ? '/seller' : '/profile', icon: isSeller ? Store : User, label: isSeller ? t('seller.dashboard') : t('nav.profile') },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-sm pointer-events-auto">
      <div className="bg-slate-950/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 rounded-full px-2 py-1.5 flex items-center justify-between">
        {tabs.map((tab) => {
          const active = tab.path === '/app' ? (location.pathname === '/app' || location.pathname === '/') : location.pathname.startsWith(tab.path);
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
        {/* Role indicator sutil */}
        {user?.roles && user.roles.length > 1 && (
          <div className="absolute -top-1.5 right-0 flex items-center gap-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isSeller ? 'bg-emerald-400' : 'bg-blue-400'}`} />
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
              {isSeller ? 'V' : 'C'}
            </span>
          </div>
        )}
      </div>
    </nav>
  );
};

export default BottomTabs;
