import React from 'react';
import { Target, Lightbulb, Rocket, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface CampaignGoalStepProps {
  selectedGoal: string | null;
  setSelectedGoal: (goal: string) => void;
}

const CampaignGoalStep: React.FC<CampaignGoalStepProps> = ({ selectedGoal, setSelectedGoal }) => {
  const goals = [
    {
      id: 'awareness',
      title: 'Brand Awareness',
      description: 'Maximize reach and impressions',
      icon: Target,
      color: 'from-pink-400 to-rose-500',
      borderColor: 'border-pink-500',
      bgColor: 'from-pink-50 to-rose-50'
    },
    {
      id: 'consideration',
      title: 'Consideration',
      description: 'Drive engagement and clicks',
      icon: Lightbulb,
      color: 'from-yellow-400 to-orange-500',
      borderColor: 'border-yellow-500',
      bgColor: 'from-yellow-50 to-orange-50'
    },
    {
      id: 'conversions',
      title: 'Conversions',
      description: 'Optimize for sales and signups',
      icon: Rocket,
      color: 'from-blue-400 to-indigo-500',
      borderColor: 'border-blue-500',
      bgColor: 'from-blue-50 to-indigo-50'
    },
    {
      id: 'retention',
      title: 'Retention',
      description: 'Re-engage existing customers',
      icon: RefreshCw,
      color: 'from-cyan-400 to-teal-500',
      borderColor: 'border-cyan-500',
      bgColor: 'from-cyan-50 to-teal-50'
    }
  ];

  const getRecommendation = () => {
    if (selectedGoal === 'conversions') {
      return 'Based on competitor analysis, "Conversions" goal with retargeting strategy shows 34% better ROAS. Recommended daily budget: $450-$680 with gradual scaling.';
    }
    return null;
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-800 mb-2">Select Campaign Goal</h2>
      <p className="text-slate-600 mb-8">Choose the primary objective for your advertising campaign</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selectedGoal === goal.id;

          return (
            <motion.button
              key={goal.id}
              onClick={() => setSelectedGoal(goal.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-8 rounded-2xl text-left transition-all border-2 ${
                isSelected
                  ? `${goal.borderColor} bg-gradient-to-br ${goal.bgColor}`
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${goal.color} flex items-center justify-center mb-4`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-800 mb-2">{goal.title}</h3>
              <p className="text-slate-600">{goal.description}</p>

              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${goal.color} flex items-center justify-center`}>
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* AI Recommendation */}
      {getRecommendation() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">AI Recommendation</h4>
              <p className="text-slate-700">{getRecommendation()}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CampaignGoalStep;