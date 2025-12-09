export const colors = {
  // Primary Brand Colors - Teal/Cyan
  primary: {
    50: 'bg-cyan-50',
    100: 'bg-cyan-100',
    500: 'bg-cyan-500',
    600: 'bg-cyan-600',
    700: 'bg-cyan-700',
    text: 'text-cyan-700',
    textLight: 'text-cyan-600',
    textDark: 'text-cyan-800',
    border: 'border-cyan-200',
    borderHover: 'border-cyan-300',
    hover: 'hover:bg-cyan-600',
    gradient: 'from-cyan-500 to-teal-600'
  },

  // Accent Colors - Emerald/Green
  accent: {
    50: 'bg-emerald-50',
    100: 'bg-emerald-100',
    500: 'bg-emerald-500',
    600: 'bg-emerald-600',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    gradient: 'from-emerald-500 to-teal-600'
  },

  // Neutral Colors - Slate
  neutral: {
    50: 'bg-slate-50',
    100: 'bg-slate-100',
    200: 'bg-slate-200',
    400: 'bg-slate-400',
    500: 'bg-slate-500',
    600: 'bg-slate-600',
    700: 'bg-slate-700',
    800: 'bg-slate-800',
    text: 'text-slate-700',
    textLight: 'text-slate-500',
    textDark: 'text-slate-800',
    border: 'border-slate-200',
    borderLight: 'border-slate-100',
    hover: 'hover:bg-slate-50'
  },

  // Success/Status Colors
  success: {
    50: 'bg-emerald-50',
    500: 'bg-emerald-500',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },

  // Background Colors
  background: {
    primary: 'bg-white',
    secondary: 'bg-slate-50',
    gradient: 'bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50',
    card: 'bg-white',
    hover: 'hover:bg-slate-50'
  }
};

// Helper function to get combined classes
export const getButtonClasses = (variant: 'primary' | 'secondary' = 'primary') => {
  if (variant === 'primary') {
    return `${colors.primary[600]} ${colors.primary.hover} text-white`;
  }
  return `${colors.background.primary} ${colors.neutral.border} ${colors.background.hover} ${colors.neutral.text}`;
};

export const getInputClasses = () => {
  return `${colors.neutral.border} focus:${colors.primary.border} focus:ring-4 focus:ring-cyan-50`;
};