import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Package, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BottomTabs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Show bottom tabs only on app routes (not landing, auth, checkout)
  const appRoutes = ['/app', '/explore', '/orders', '/profile', '/favorites', '/settings', '/help', '/reviews', '/seller', '/cart'];
  const isAppRoute = appRoutes.some(r => location.pathname === r || location.pathname.startsWith(r + '/'));
  if (!isAppRoute) return null;

  // Hide on auth and checkout pages
  if (['/login', '/register', '/checkout'].some(p => location.pathname.startsWith(p))) return null;

  const tabs = [
    { path: '/app', icon: Home, label: t('nav.home') },
    { path: '/explore', icon: Search, label: t('nav.search') },
    { path: '/orders', icon: Package, label: t('nav.orders') },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(tab => {
          const active = tab.path === '/app' ? location.pathname === '/app' : location.pathname.startsWith(tab.path);
          return (
            <button key={tab.path} onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 px-4 py-2 transition-colors ${
                active ? 'text-purple-600' : 'text-text-muted hover:text-text-secondary'
              }`}>
              <tab.icon size={active ? 22 : 20} className={active ? '' : ''} />
              <span className={`text-[10px] font-bold ${active ? '' : 'font-semibold'}`}>{tab.label}</span>
              {active && <div className="absolute bottom-1 w-6 h-0.5 rounded-full bg-purple-600" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabs;
