import React from 'react';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'processing';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    active: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      text: 'text-emerald-700',
      label: 'Agent Active'
    },
    inactive: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
      text: 'text-slate-700',
      label: 'Agent Offline'
    },
    processing: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      text: 'text-amber-700',
      label: 'Processing'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} border ${config.border}`}>
      <div className={`w-2 h-2 rounded-full ${config.dot} ${status === 'active' ? 'animate-pulse' : ''}`} />
      <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
    </div>
  );
};

export default StatusBadge;