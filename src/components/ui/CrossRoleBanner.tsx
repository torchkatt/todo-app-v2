import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Bell, Store, User, X } from 'lucide-react';

const CrossRoleBanner: React.FC = () => {
  const { crossRoleCount, dismissBanner } = useNotifications();
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!crossRoleCount || !user?.roles || user.roles.length < 2) return null;

  const otherRole = user.primaryRole === UserRole.CUSTOMER ? UserRole.SELLER : UserRole.CUSTOMER;
  const roleLabel = t(`role.${otherRole.toLowerCase()}`, otherRole.toLowerCase());

  const handleSwitch = async () => {
    await switchRole(otherRole);
    dismissBanner();
    navigate(otherRole === UserRole.SELLER ? '/seller' : '/app');
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 animate-slide-down">
      <div className="flex items-center justify-between max-w-7xl mx-auto gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Bell size={16} className="text-amber-600 shrink-0" />
          <span className="text-sm font-bold text-amber-800 truncate">
            🔔 {crossRoleCount} {crossRoleCount === 1 ? 'notificación' : 'notificaciones'} en tu perfil de {roleLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSwitch}
            className="text-xs font-extrabold px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all active:scale-95 flex items-center gap-1"
          >
            {otherRole === UserRole.SELLER ? <Store size={12} /> : <User size={12} />}
            {t('role.switchNow', { role: roleLabel })}
          </button>
          <button onClick={dismissBanner} className="p-1 hover:bg-amber-100 rounded-lg transition-colors">
            <X size={14} className="text-amber-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrossRoleBanner;
