import React, { useState, useEffect } from 'react';
import { Target, Lightbulb, Rocket, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

const CampaignGoalStep = ({ selectedGoal, setSelectedGoal }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState(null);
  const [campaignId, setCampaignId] = useState(null);

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
  }, []);

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

  const sendGoalToBackend = async (goalId) => {
    if (!userId) {
      setError('User ID not found. Please login again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Sending request with:', { goal: goalId, user_id_type: typeof userId });
      
      const response = await fetch('http://localhost:5005/api/campaign-goal', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          goal: goalId,
          user_id: userId  // Pass the token as user_id (it's already a string)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save goal');
      }

      console.log('Goal saved successfully:', result);
      setSuccess(true);
      setCampaignId(result.campaign_id);
      
      // Update parent component's selectedGoal state to enable Next button
      setSelectedGoal(goalId);

      setTimeout(() => setSuccess(false), 3000);

    } catch (error) {
      console.error("Failed to send goal:", error);
      setError(error instanceof Error ? error.message : 'Failed to save goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoalSelect = (goalId) => {
    sendGoalToBackend(goalId);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h2 className="text-3xl font-bold text-slate-800 mb-2">Select Campaign Goal</h2>
      <p className="text-slate-600 mb-8">Choose the primary objective for your advertising campaign</p>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-800 font-medium">Goal saved successfully!</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selectedGoal === goal.id;

          return (
            <button
              key={goal.id}
              onClick={() => handleGoalSelect(goal.id)}
              disabled={isSubmitting || !userId}
              className={`relative p-8 rounded-2xl text-left transition-all border-2 ${
                isSelected
                  ? `${goal.borderColor} bg-gradient-to-br ${goal.bgColor}`
                  : 'border-slate-200 bg-white hover:border-slate-300'
              } ${isSubmitting || !userId ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${goal.color} flex items-center justify-center mb-4`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-800 mb-2">{goal.title}</h3>
              <p className="text-slate-600">{goal.description}</p>

              {isSubmitting && isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {isSelected && !isSubmitting && (
                <div className="absolute top-4 right-4">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${goal.color} flex items-center justify-center`}>
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CampaignGoalStep;