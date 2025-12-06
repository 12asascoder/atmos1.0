import React from 'react';
import { colors } from '../styles/colors';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  title = 'Command Center', 
  subtitle = 'Chat with your autonomous advertising agent' 
}) => {
  return (
    <div className={`${colors.neutral.border} border-b ${colors.background.primary}`}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h2 className={`text-2xl font-semibold ${colors.neutral.textDark}`}>{title}</h2>
        <p className={`text-sm ${colors.neutral.textLight} mt-1`}>{subtitle}</p>
      </div>
    </div>
  );
};

export default Header;