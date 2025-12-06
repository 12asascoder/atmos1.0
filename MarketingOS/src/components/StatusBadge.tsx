import React from 'react';
import { colors } from '../styles/colors';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'processing';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    active: {
      bg: colors.success[50],
      border: colors.success.border,
      dot: colors.success[500],
      text: colors.success.text,
      label: 'Agent Active'
    },
    inactive: {
      bg: colors.neutral[50],
      border: colors.neutral.border,
      dot: colors.neutral[400],
      text: colors.neutral.text,
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