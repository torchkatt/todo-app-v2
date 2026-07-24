import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserRole } from '../../types';
import { Store, User, Bike } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  onSwitch?: () => void;
  className?: string;
}

const ROLE_CONFIG: Record<UserRole, { icon: React.ReactNode; color: string }> = {
  [UserRole.CUSTOMER]: { icon: <User size={14} />, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  [UserRole.SELLER]: { icon: <Store size={14} />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  [UserRole.COURIER]: { icon: <Bike size={14} />, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  [UserRole.ADMIN]: { icon: <User size={14} />, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  [UserRole.SUPER_ADMIN]: { icon: <User size={14} />, color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, onSwitch, className = '' }) => {
  const { t } = useTranslation();
  const config = ROLE_CONFIG[role] || ROLE_CONFIG[UserRole.CUSTOMER];
  const label = t(`role.${role.toLowerCase()}`, role.toLowerCase());

  return (
    <button
      onClick={onSwitch}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-extrabold 
        transition-all hover:opacity-80 active:scale-95 ${config.color} ${className}`}
      title={onSwitch ? t('role.switchNow', { role: label }) : label}
    >
      {config.icon}
      {label}
      {onSwitch && <span className="text-[10px] opacity-60">⇅</span>}
    </button>
  );
};

export default RoleBadge;
