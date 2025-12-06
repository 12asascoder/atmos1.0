import React from 'react';
import { Sparkles, TrendingUp, Target, Eye, Zap } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import InsightCard from './InsightCard';

const Navigation: React.FC = () => {
  const navItems = [
    { path: '/command-center', icon: Sparkles, label: 'Command Center' },
    { path: '/performance', icon: TrendingUp, label: 'Performance' },
    { path: '/audience', icon: Target, label: 'Audience Intel' },
    { path: '/market', icon: Eye, label: 'Market View' },
    { path: '/quick-launch', icon: Zap, label: 'Quick Launch' }
  ];

  return (
    <aside className="col-span-3 space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Navigation</h3>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <InsightCard />
    </aside>
  );
};

export default Navigation;