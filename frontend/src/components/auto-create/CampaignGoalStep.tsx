// src/components/auto-create/CampaignGoalStep.tsx
import React, { useState, useEffect } from 'react';
import { Target, Lightbulb, Rocket, RefreshCw, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface CampaignGoalStepProps {
  selectedGoal: 'awareness' | 'consideration' | 'conversions' | 'retention' | null;
  setSelectedGoal: (goal: 'awareness' | 'consideration' | 'conversions' | 'retention' | null) => void;
  selectedPlatforms?: string[];
}

const CampaignGoalStep: React.FC<CampaignGoalStepProps> = ({ 
  selectedGoal, 
  setSelectedGoal,
  selectedPlatforms = []
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // Get token from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    console.log('Retrieved token from localStorage:', token ? 'Token found' : 'No token');
    console.log('Token type:', typeof token);
    
    if (!token) {
      setError('Not authenticated. Please login first.');
    } else {
      // Ensure it's a string and trim any whitespace
      const cleanToken = String(token).trim();
      setUserId(cleanToken);
      console.log('Clean token set as userId');
    }

    // Log selected platforms for debugging
    console.log('Selected platforms received:', selectedPlatforms);
    console.log('Selected goal received:', selectedGoal);
  }, [selectedPlatforms, selectedGoal]);

  const goals = [
    {
      id: 'awareness' as const,
      title: 'Brand Awareness',
      description: 'Maximize reach and impressions',
      icon: Target,
      color: 'from-pink-400 to-rose-500',
      borderColor: 'border-pink-500',
      bgColor: 'from-pink-50 to-rose-50',
      bestFor: ['meta', 'twitter'], // Best platforms for this goal
      metrics: ['Reach', 'Impressions', 'Brand recall']
    },
    {
      id: 'consideration' as const,
      title: 'Consideration',
      description: 'Drive engagement and clicks',
      icon: Lightbulb,
      color: 'from-yellow-400 to-orange-500',
      borderColor: 'border-yellow-500',
      bgColor: 'from-yellow-50 to-orange-50',
      bestFor: ['meta', 'linkedin', 'twitter'], // Best platforms for this goal
      metrics: ['Clicks', 'Engagement', 'Website visits']
    },
    {
      id: 'conversions' as const,
      title: 'Conversions',
      description: 'Optimize for sales and signups',
      icon: Rocket,
      color: 'from-blue-400 to-indigo-500',
      borderColor: 'border-blue-500',
      bgColor: 'from-blue-50 to-indigo-50',
      bestFor: ['meta', 'google'], // Best platforms for this goal
      metrics: ['Conversions', 'Sales', 'Sign-ups']
    },
    {
      id: 'retention' as const,
      title: 'Retention',
      description: 'Re-engage existing customers',
      icon: RefreshCw,
      color: 'from-cyan-400 to-teal-500',
      borderColor: 'border-cyan-500',
      bgColor: 'from-cyan-50 to-teal-50',
      bestFor: ['meta', 'google', 'linkedin'], // Best platforms for this goal
      metrics: ['Repeat purchases', 'Loyalty', 'Customer LTV']
    }
  ];

  const platformNames: Record<string, string> = {
    'meta': 'Meta',
    'google': 'Google',
    'linkedin': 'LinkedIn',
    'twitter': 'X (Twitter)'
  };

  const sendGoalToBackend = async (goalId: string) => {
    if (!userId) {
      setError('User ID not found. Please login again.');
      return;
    }

    // Check if platforms are selected
    if (selectedPlatforms.length === 0) {
      setError('Please select platforms first.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Sending request with:', { 
        goal: goalId, 
        user_id: userId,
        platforms: selectedPlatforms 
      });
      
      const response = await fetch('http://localhost:5050/api/campaign-goal', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          goal: goalId,
          user_id: userId,
          platforms: selectedPlatforms  // Send selected platforms to backend
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save goal');
      }

      console.log('Goal saved successfully:', result);
      setSuccess(true);
      setCampaignId(result.campaign_id);
      
      // Update parent component's selectedGoal state
      setSelectedGoal(goalId as any);

      setTimeout(() => setSuccess(false), 3000);

    } catch (error) {
      console.error("Failed to send goal:", error);
      setError(error instanceof Error ? error.message : 'Failed to save goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoalSelect = (goalId: string) => {
    sendGoalToBackend(goalId);
  };

  // Get recommended goals based on selected platforms
  const getRecommendedGoals = () => {
    if (selectedPlatforms.length === 0) return [];

    const platformGoals: Record<string, string[]> = {
      'meta': ['awareness', 'consideration', 'conversions'],
      'google': ['conversions', 'retention'],
      'linkedin': ['consideration', 'retention'],
      'twitter': ['awareness', 'consideration']
    };

    // Count how many platforms recommend each goal
    const goalCounts: Record<string, number> = {};
    selectedPlatforms.forEach(platform => {
      const recommended = platformGoals[platform] || [];
      recommended.forEach(goal => {
        goalCounts[goal] = (goalCounts[goal] || 0) + 1;
      });
    });

    // Sort goals by recommendation count
    return Object.entries(goalCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([goal]) => goal)
      .slice(0, 2); // Top 2 recommended goals
  };

  const recommendedGoals = getRecommendedGoals();

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header with platform context */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Select Campaign Goal</h2>
        <p className="text-slate-600 mb-4">Choose the primary objective for your advertising campaign</p>
        
        {/* Selected Platforms Display */}
        {selectedPlatforms.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-slate-700 font-medium">Selected platforms:</span>
            <div className="flex flex-wrap gap-2">
              {selectedPlatforms.map(platform => (
                <span 
                  key={platform} 
                  className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium border border-cyan-200"
                >
                  {platformNames[platform] || platform}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Platform-based recommendations */}
        {recommendedGoals.length > 0 && (
          <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 rounded-xl p-4 flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-cyan-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-cyan-800 font-medium mb-1">Platform Recommendations</p>
              <p className="text-cyan-700 text-sm">
                Based on your selected platforms, we recommend focusing on{' '}
                <span className="font-semibold">
                  {recommendedGoals.map(goalId => {
                    const goal = goals.find(g => g.id === goalId);
                    return goal?.title.toLowerCase() || goalId;
                  }).join(' or ')}
                </span>
                {' '}goals for best results.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-emerald-800 font-medium">Campaign goal saved successfully!</p>
            <p className="text-emerald-700 text-sm">
              Campaign ID: <span className="font-mono">{campaignId}</span>
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Failed to save goal</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selectedGoal === goal.id;
          const isRecommended = recommendedGoals.includes(goal.id);
          const platformMatches = goal.bestFor.filter(p => selectedPlatforms.includes(p));

          return (
            <button
              key={goal.id}
              onClick={() => handleGoalSelect(goal.id)}
              disabled={isSubmitting || !userId || selectedPlatforms.length === 0}
              className={`relative p-6 rounded-2xl text-left transition-all border-2 ${
                isSelected
                  ? `${goal.borderColor} bg-gradient-to-br ${goal.bgColor}`
                  : 'border-slate-200 bg-white hover:border-slate-300'
              } ${
                isSubmitting || !userId || selectedPlatforms.length === 0 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-105 cursor-pointer'
              }`}
            >
              {/* Recommendation Badge */}
              {isRecommended && !isSelected && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Recommended
                </div>
              )}

              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${goal.color} flex items-center justify-center mb-4`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              
              {/* Title and Description */}
              <h3 className="text-xl font-bold text-slate-800 mb-2">{goal.title}</h3>
              <p className="text-slate-600 mb-4">{goal.description}</p>

              {/* Platform Compatibility */}
              {selectedPlatforms.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-slate-500 mb-2">Works best with:</p>
                  <div className="flex flex-wrap gap-2">
                    {goal.bestFor.map(platform => {
                      const isSelectedPlatform = selectedPlatforms.includes(platform);
                      return (
                        <span 
                          key={platform}
                          className={`px-2 py-1 text-xs rounded-full ${
                            isSelectedPlatform
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {platformNames[platform] || platform}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Metrics */}
              <div className="mb-2">
                <p className="text-sm text-slate-500 mb-1">Key metrics:</p>
                <div className="flex flex-wrap gap-1">
                  {goal.metrics.map(metric => (
                    <span 
                      key={metric} 
                      className="px-2 py-1 bg-slate-50 text-slate-700 text-xs rounded-lg border border-slate-200"
                    >
                      {metric}
                    </span>
                  ))}
                </div>
              </div>

              {/* Loading/Selected Indicators */}
              <div className="absolute bottom-4 right-4">
                {isSubmitting && isSelected ? (
                  <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                ) : isSelected ? (
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${goal.color} flex items-center justify-center`}>
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : null}
              </div>

              {/* Platform Match Indicator */}
              {platformMatches.length > 0 && !isSelected && (
                <div className="absolute bottom-4 left-4">
                  <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{platformMatches.length} match{platformMatches.length > 1 ? 'es' : ''}</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
        <p className="text-slate-600 text-sm">
          <span className="font-semibold">💡 Need help choosing?</span> Select the goal that aligns with your business objective. 
          {selectedPlatforms.length === 0 && ' First, select your advertising platforms above.'}
          {selectedPlatforms.length > 0 && ' Your platform selection has been saved.'}
        </p>
      </div>
    </div>
  );
};

export default CampaignGoalStep;