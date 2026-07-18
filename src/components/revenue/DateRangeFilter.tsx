import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { DateRangePreset } from '../../hooks/useRevenue';

interface DateRangeFilterProps {
  currentPreset: DateRangePreset;
  onPresetChange: (preset: DateRangePreset) => void;
}

const PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: '7d', label: 'Últimos 7 días' },
  { key: '30d', label: 'Últimos 30 días' },
  { key: 'thisMonth', label: 'Este mes' },
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ currentPreset, onPresetChange }) => {
  return (
    <div className="flex items-center gap-2 bg-surface dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-1">
      <Calendar size={16} className="text-text-muted dark:text-gray-500 ml-2" />
      {PRESETS.map((p) => (
        <button
          key={p.key}
          onClick={() => onPresetChange(p.key)}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            currentPreset === p.key
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-text-secondary dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {p.label}
        </button>
      ))}
      <ChevronDown size={16} className="text-text-muted dark:text-gray-500 mr-2" />
    </div>
  );
};

export default DateRangeFilter;
