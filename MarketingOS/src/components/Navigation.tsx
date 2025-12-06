import React from 'react';
import { Sparkles, TrendingUp, Target, Eye, Zap } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { colors } from '../styles/colors';

const Navigation: React.FC = () => {
  const navItems = [
    { path: '/command-center', icon: Sparkles, label: 'Command Center' },
    { path: '/performance', icon: TrendingUp, label: 'Performance' },
    { path: '/audience', icon: Target, label: 'Audience Intel' },
    { path: '/market', icon: Eye, label: 'Market View' },
    { path: '/quick-launch', icon: Zap, label: 'Quick Launch' }
  ];

  return (
    <nav className={`${colors.neutral.borderLight} border-b bg-white/80 backdrop-blur-sm`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className={`flex items-center gap-3 py-4 ${colors.neutral.border} border-r pr-8`}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.primary.gradient} flex items-center justify-center`}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-lg font-semibold ${colors.neutral.textDark}`}>AdOS</h1>
              <p className={`text-xs ${colors.neutral.textLight}`}>Campaign Intelligence</p>
            </div>
          </div>

          {/* Nav Items */}
          <div className="flex items-center gap-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? `${colors.primary[50]} ${colors.primary.text} font-medium`
                        : `${colors.background.hover} ${colors.neutral.text}`
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.success[50]} ${colors.success.border} border`}>
            <div className={`w-2 h-2 rounded-full ${colors.success[500]} animate-pulse`} />
            <span className={`text-sm font-medium ${colors.success.text}`}>Agent Active</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
