import React from 'react';

interface QuickActionProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ label, icon: Icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group"
    >
      <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
      <span className="text-sm text-slate-600 group-hover:text-slate-800">{label}</span>
    </button>
  );
};

export default QuickAction;