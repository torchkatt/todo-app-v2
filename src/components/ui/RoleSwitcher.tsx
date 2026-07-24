import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ArrowLeftRight, Store, User } from 'lucide-react';

const RoleSwitcher: React.FC = () => {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!user?.roles || user.roles.length < 2) return null;

  const otherRole = user.primaryRole === UserRole.CUSTOMER ? UserRole.SELLER : UserRole.CUSTOMER;
  const otherLabel = t(`role.${otherRole.toLowerCase()}`, otherRole.toLowerCase());
  const currentKey = `role.${user.primaryRole.toLowerCase()}`;
  const currentLabel = t(currentKey, user.primaryRole.toLowerCase());

  const handleSwitch = async () => {
    await switchRole(otherRole);
    navigate(otherRole === UserRole.SELLER ? '/seller' : '/app');
  };

  return (
    <button
      onClick={handleSwitch}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-slate-900/90 
        backdrop-blur-md border border-white/10 rounded-xl shadow-2xl 
        hover:bg-slate-800 transition-all active:scale-95 group"
      title={t('role.switchNow', { role: otherLabel })}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-bold text-white/70">
        {user.primaryRole === UserRole.CUSTOMER ? <User size={12} /> : <Store size={12} />}
        {currentLabel}
      </span>
      <ArrowLeftRight size={14} className="text-purple-400 group-hover:rotate-180 transition-transform duration-300" />
      <span className="flex items-center gap-1.5 text-[11px] font-bold text-white">
        {otherRole === UserRole.SELLER ? <Store size={12} /> : <User size={12} />}
        {otherLabel}
      </span>
    </button>
  );
};

export default RoleSwitcher;
