import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Settings, CircleHelp, LogOut, Sparkles, Heart, Package, MapPin, Phone, Mail, Shield, BadgeCheck, Loader2, TrendingUp, Flame, Award } from 'lucide-react';
import GuestConversion from '../components/auth/GuestConversion';
import CashbackBadge from '../components/wallet/CashbackBadge';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [showConversion, setShowConversion] = React.useState(false);

  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><Loader2 size={28} className="animate-spin text-purple-600" /></div>;

  if (!isAuthenticated && !user?.isGuest) {
    navigate('/login', { state: { from: '/profile' } });
    return null;
  }

  const impact = user?.impact || { points: 0, level: 'NOVICE', totalSpent: 0, totalTransactions: 0, streak: { current: 0, longest: 0 } };

  return (
    <div className="pb-24 bg-brand-bg min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={22} /></button>
          <h1 className="text-lg font-extrabold">Mi Perfil</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Avatar + Name */}
        <div className="bg-white rounded-2xl border border-border p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg shadow-purple-200">
            {user?.fullName?.charAt(0).toUpperCase() || '👤'}
          </div>
          <h2 className="text-xl font-extrabold text-text-primary">{user?.fullName || 'Usuario'}</h2>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Shield size={12} className="text-emerald-500" />
            <span className="text-xs text-text-secondary">{user?.isGuest ? 'Invitado' : user?.role?.replace(/_/g, ' ').toLowerCase() || 'Miembro'}</span>
            {user?.isVerified && <BadgeCheck size={14} className="text-blue-500" />}
          </div>
          <div className="flex items-center justify-center gap-1 mt-1.5 text-xs text-text-muted">
            <MapPin size={12} /> {user?.city || 'Colombia'}
          </div>
          <button onClick={() => navigate('/settings')} className="mt-4 px-4 py-1.5 bg-gray-100 rounded-lg text-xs font-bold text-text-secondary hover:bg-gray-200 transition-colors">Editar perfil</button>
        </div>

        {/* Cashback Badge */}
        <CashbackBadge />

        {/* Impact / Stats */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h3 className="text-xs font-extrabold text-text-primary mb-4 flex items-center gap-2"><Sparkles size={14} className="text-amber-500" /> Tu impacto en Todo</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-lg font-extrabold text-amber-500">
                <Award size={16} /> {impact.points}
              </div>
              <div className="text-[10px] text-text-muted font-semibold">Puntos</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-lg font-extrabold text-purple-700">
                <Package size={16} /> {impact.totalTransactions}
              </div>
              <div className="text-[10px] text-text-muted font-semibold">Compras</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-lg font-extrabold text-emerald-600">
                <TrendingUp size={16} /> ${impact.totalSpent.toLocaleString('es-CO')}
              </div>
              <div className="text-[10px] text-text-muted font-semibold">Gastado</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-lg font-extrabold text-red-500">
                <Flame size={16} /> {impact.streak?.current || 0}
              </div>
              <div className="text-[10px] text-text-muted font-semibold">Racha (días)</div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-2">
          <button onClick={() => navigate('/orders')} className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-border hover:border-purple-200 hover:shadow-sm transition-all group">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><Package size={18} className="text-purple-600" /></div>
            <div className="flex-1 text-left"><div className="text-sm font-extrabold text-text-primary">Mis pedidos</div><div className="text-[10px] text-text-muted font-semibold">Historial y estado</div></div>
            <span className="text-xs font-bold text-purple-600 group-hover:mr-1 transition-all">→</span>
          </button>
          <button onClick={() => navigate('/favorites')} className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-border hover:border-purple-200 hover:shadow-sm transition-all group">
            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center"><Heart size={18} className="text-pink-500" /></div>
            <div className="flex-1 text-left"><div className="text-sm font-extrabold text-text-primary">Favoritos</div><div className="text-[10px] text-text-muted font-semibold">Productos guardados</div></div>
            <span className="text-xs font-bold text-purple-600 group-hover:mr-1 transition-all">→</span>
          </button>
          <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-border hover:border-purple-200 hover:shadow-sm transition-all group">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"><Settings size={18} className="text-text-secondary" /></div>
            <div className="flex-1 text-left"><div className="text-sm font-extrabold text-text-primary">Configuración</div><div className="text-[10px] text-text-muted font-semibold">Cuenta, notificaciones, privacidad</div></div>
            <span className="text-xs font-bold text-purple-600 group-hover:mr-1 transition-all">→</span>
          </button>
          <button onClick={() => navigate('/help')} className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-border hover:border-purple-200 hover:shadow-sm transition-all group">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><CircleHelp size={18} className="text-amber-500" /></div>
            <div className="flex-1 text-left"><div className="text-sm font-extrabold text-text-primary">Ayuda</div><div className="text-[10px] text-text-muted font-semibold">FAQ, soporte, guías</div></div>
            <span className="text-xs font-bold text-purple-600 group-hover:mr-1 transition-all">→</span>
          </button>
        </div>

        {/* Contact info */}
        {!user?.isGuest && (
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="text-xs font-extrabold text-text-primary mb-3">Información de contacto</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3"><Mail size={16} className="text-text-muted" /><span className="text-text-secondary">{user?.email || 'No registrado'}</span></div>
              <div className="flex items-center gap-3"><Phone size={16} className="text-text-muted" /><span className="text-text-secondary">{user?.phone || 'No registrado'}</span></div>
              {user?.isGuest && <p className="text-xs text-amber-600 font-semibold">Crea una cuenta para acceder a más funciones.</p>}
            </div>
          </div>
        )}

        {/* Guest conversion */}
        {user?.isGuest && (
          <button onClick={() => setShowConversion(true)} className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-purple-200">
            <Sparkles size={18} /> Guardar mi cuenta
          </button>
        )}

        {/* Logout */}
        <button onClick={logout} className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-red-500 bg-white rounded-xl border border-border hover:bg-red-50 transition-colors active:scale-[0.98]">
          <LogOut size={18} /> Cerrar sesión
        </button>
      </main>
      {showConversion && <GuestConversion onClose={() => setShowConversion(false)} />}
    </div>
  );
};

export default Profile;
