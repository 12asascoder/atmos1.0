import React from 'react';
import { Sparkles } from 'lucide-react';

const InsightCard: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
      <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
        <Sparkles className="w-5 h-5" />
      </div>
      <h4 className="font-semibold mb-2">AI Insights</h4>
      <p className="text-sm text-indigo-100 leading-relaxed">
        Unlock advanced analytics and predictive modeling for your campaigns
      </p>
      <button className="mt-4 w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors text-sm font-medium">
        Learn more
      </button>
    </div>
  );
};

export default InsightCard;