import React from 'react';

const QuickFilters: React.FC = () => {
  const filters = [
    { id: 1, label: 'All Campaigns', active: true },
    { id: 2, label: 'Digital', active: false },
    { id: 3, label: 'Social Media', active: false },
    { id: 4, label: 'Video', active: false },
    { id: 5, label: 'Display', active: false },
    { id: 6, label: 'Email', active: false }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter.id}
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all font-mulish ${
              filter.active
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickFilters;