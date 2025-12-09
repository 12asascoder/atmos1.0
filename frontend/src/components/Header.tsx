import React, { useState } from 'react';
import { colors } from '../styles/colors';
import GenerateAdPopup from './GenerateAdPopup';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  title = 'Command Center', 
  subtitle = 'Chat with your autonomous advertising agent' 
}) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className={`${colors.background.primary} rounded-2xl ${colors.neutral.border} border shadow-sm overflow-hidden backdrop-blur-sm bg-white/80`}>
          <div className="px-8 py-6 bg-gradient-to-r from-cyan-50/50 to-teal-50/50 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-semibold ${colors.neutral.textDark} mb-1`}>
                  {title}
                </h2>
                <p className={`text-sm ${colors.neutral.textLight} flex items-center gap-2`}>
                  <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                  {subtitle}
                </p>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <div className={`px-4 py-2 rounded-xl ${colors.neutral[50]} border ${colors.neutral.border} flex items-center gap-2`}>
                  <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className={`text-xs font-medium ${colors.neutral.text}`}>AI Powered</span>
                </div>
                <div className={`px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white flex items-center gap-2 shadow-sm`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold">Active</span>
                </div>
                <button 
                  onClick={() => setIsPopupOpen(true)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 text-white flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm">Generate AD</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Quick Stats Bar */}
          <div className="px-8 py-4 bg-white/50 backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <p className={`text-xs ${colors.neutral.textLight}`}>Messages</p>
                  <p className={`text-lg font-semibold ${colors.neutral.textDark}`}>127</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className={`text-xs ${colors.neutral.textLight}`}>Campaigns</p>
                  <p className={`text-lg font-semibold ${colors.neutral.textDark}`}>24</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className={`text-xs ${colors.neutral.textLight}`}>Performance</p>
                  <p className={`text-lg font-semibold ${colors.neutral.textDark}`}>+24%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GenerateAdPopup 
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
      />
    </>
  );
};

export default Header;