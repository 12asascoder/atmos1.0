// BudgetTestingStep.jsx
import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, TrendingUp, Zap, BarChart3, Target, Save, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const BudgetTestingStep = ({ campaignId, onSave, initialData }) => {
  const [budgetType, setBudgetType] = useState('daily');
  const [budget, setBudget] = useState(500);
  const [duration, setDuration] = useState(14);
  const [selectedTests, setSelectedTests] = useState(['creative', 'audience']);
  const [messagingTone, setMessagingTone] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projections, setProjections] = useState(null);
  const [testingOptions, setTestingOptions] = useState([]);
  const [budgetOptions, setBudgetOptions] = useState([
    { value: 250, label: '$250', desc: 'Starter' },
    { value: 500, label: '$500', desc: 'Recommended' },
    { value: 1000, label: '$1,000', desc: 'Aggressive' },
    { value: 2500, label: '$2,500', desc: 'Enterprise' }
  ]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState(null);

  // Get token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      setError('Not authenticated. Please login first.');
    }
  }, []);

  // Load initial data
  useEffect(() => {
    if (initialData) {
      setBudgetType(initialData.budget_type || 'daily');
      setBudget(initialData.budget_amount || 500);
      setDuration(initialData.campaign_duration || 14);
      setSelectedTests(initialData.selected_tests || []);
      setMessagingTone(initialData.messaging_tone || '');
      
      if (initialData.projections) {
        setProjections(initialData.projections);
      }
    }
  }, [initialData]);

  // Load testing options and recommendations
  useEffect(() => {
    if (token) {
      loadTestingOptions();
      loadBudgetRecommendations();
    }
  }, [token]);

  const loadTestingOptions = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/budget-testing/testing-options');
      const data = await response.json();
      setTestingOptions(data.testing_options);
    } catch (error) {
      console.error('Error loading testing options:', error);
      // Set default testing options if API fails
      setTestingOptions([
        { id: 'creative', title: 'Creative Testing', description: 'Test multiple ad variations', variants: 3 },
        { id: 'audience', title: 'Audience Testing', description: 'Compare audience segments', variants: 2 },
        { id: 'messaging', title: 'Message Testing', description: 'Test different copy variations', variants: 4 }
      ]);
    }
  };

  const loadBudgetRecommendations = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/budget-testing/budget-recommendations');
      const data = await response.json();
      
      // Only update if we get valid recommendations
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setBudgetOptions(data.recommendations);
      }
    } catch (error) {
      console.error('Error loading budget recommendations:', error);
      // Keep default options on error (already set in state initialization)
    }
  };

  const calculateTotalBudget = () => {
    return budgetType === 'daily' ? budget * duration : budget;
  };

  const getProjections = async () => {
    if (!token) {
      setError('Not authenticated. Please login first.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5050/api/budget-testing/projections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          budget_type: budgetType,
          budget_amount: budget,
          campaign_duration: duration,
          selected_tests: selectedTests,
          campaign_goal: initialData?.campaign_goal
        })
      });

      const data = await response.json();
      if (data.success) {
        setProjections(data.projections);
      } else {
        setError(data.error || 'Failed to get projections');
      }
    } catch (error) {
      console.error('Error getting projections:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const saveBudgetTestingData = async () => {
    if (!token) {
      setError('Not authenticated. Please login first.');
      return;
    }

    if (budget < 0) {
      setError('Budget amount must be greater than or equal to 0');
      return;
    }

    if (duration < 1) {
      setError('Campaign duration must be at least 1 day');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const payload = {
        budget_type: budgetType,
        budget_amount: budget,
        campaign_duration: duration,
        selected_tests: selectedTests,
        user_id: token,
        messaging_tone: messagingTone || null
      };

      // Add campaign_id if we have one
      if (campaignId) {
        payload.campaign_id = campaignId;
      }

      // Add any existing campaign data
      if (initialData) {
        ['campaign_goal', 'demographics', 'age_range_min', 'age_range_max', 
         'selected_interests', 'target_locations'].forEach(field => {
          if (initialData[field] !== undefined) {
            payload[field] = initialData[field];
          }
        });
      }

      const response = await fetch('http://localhost:5050/api/budget-testing/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setProjections(data.projections);
        if (onSave) {
          onSave(data.campaign_id);
        }
      } else {
        setError(data.error || 'Failed to save budget and testing data');
      }
    } catch (error) {
      console.error('Error saving budget data:', error);
      setError('Failed to connect to server');
    } finally {
      setSaving(false);
    }
  };

  const toggleTest = (id) => {
    setSelectedTests(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  // Update projections when settings change
  useEffect(() => {
    if (token) {
      const timeoutId = setTimeout(() => {
        getProjections();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [budgetType, budget, duration, selectedTests, token]);

  // Default projections if API fails
  const getDefaultProjections = () => ({
    daily: {
      impressions: '45,000 - 62,000',
      clicks: '1,200 - 1,800',
      conversions: '85 - 120',
      cpa: '$4.20 - $5.90'
    },
    lifetime: {
      impressions: `${(45 * duration).toLocaleString()}K - ${(62 * duration).toLocaleString()}K`,
      clicks: `${(1.2 * duration).toFixed(1)}K - ${(1.8 * duration).toFixed(1)}K`,
      conversions: `${85 * duration} - ${120 * duration}`,
      total_spend: `${calculateTotalBudget().toLocaleString()}`
    }
  });

  const currentProjections = projections && projections.daily ? projections : getDefaultProjections();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Budget & Testing Strategy</h2>
          <p className="text-slate-600">Set your campaign budget and configure A/B testing parameters</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={saveBudgetTestingData}
          disabled={saving || !token}
          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Saving...' : 'Save Budget'}
        </motion.button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-800 font-medium">Budget and testing saved successfully!</p>
        </div>
      )}

      {/* Budget Type Selection */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-cyan-600" />
          Budget Configuration
        </h3>

        <div className="flex gap-4 mb-6">
          <motion.button
            onClick={() => setBudgetType('daily')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              budgetType === 'daily'
                ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-teal-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="text-center">
              <h4 className="font-semibold text-slate-800 mb-1">Daily Budget</h4>
              <p className="text-sm text-slate-500">Spend per day</p>
            </div>
          </motion.button>

          <motion.button
            onClick={() => setBudgetType('lifetime')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              budgetType === 'lifetime'
                ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-teal-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="text-center">
              <h4 className="font-semibold text-slate-800 mb-1">Lifetime Budget</h4>
              <p className="text-sm text-slate-500">Total campaign spend</p>
            </div>
          </motion.button>
        </div>

        {/* Budget Amount */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            {budgetType === 'daily' ? 'Daily' : 'Total'} Budget: ${budget.toLocaleString()}
          </label>
          <input
            type="range"
            min="100"
            max="5000"
            step="50"
            value={budget}
            onChange={(e) => setBudget(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
          />
          <div className="flex justify-between mt-2">
            {budgetOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setBudget(option.value)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  budget === option.value
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign Duration */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-600" />
            Campaign Duration: {duration} days
          </label>
          <input
            type="range"
            min="7"
            max="90"
            step="1"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
          />
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>1 week</span>
            <span>1 month</span>
            <span>3 months</span>
          </div>
        </div>

        {/* Total Budget Summary */}
        <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-4 border border-cyan-200">
          <div className="flex items-center justify-between">
            <span className="text-slate-700 font-medium">Total Campaign Budget</span>
            <span className="text-2xl font-bold text-cyan-700">${calculateTotalBudget().toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* A/B Testing Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-cyan-600" />
          A/B Testing Strategy
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testingOptions.map((test) => {
            const Icon = Zap;
            const isSelected = selectedTests.includes(test.id);

            return (
              <motion.button
                key={test.id}
                onClick={() => toggleTest(test.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-teal-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-2">{test.title}</h4>
                  <p className="text-sm text-slate-500 mb-3">{test.description}</p>
                  <span className="px-3 py-1 bg-white rounded-full text-xs text-slate-700 border border-slate-200">
                    {test.variants} variants
                  </span>
                  {isSelected && (
                    <div className="mt-3 w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Performance Projections */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-cyan-600" />
          Projected Performance
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Est. Impressions</p>
            <p className="text-xl font-bold text-slate-800">{currentProjections.daily.impressions}</p>
            <p className="text-xs text-emerald-600 mt-1">per day</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Est. Clicks</p>
            <p className="text-xl font-bold text-slate-800">{currentProjections.daily.clicks}</p>
            <p className="text-xs text-emerald-600 mt-1">per day</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Est. Conversions</p>
            <p className="text-xl font-bold text-slate-800">{currentProjections.daily.conversions}</p>
            <p className="text-xs text-emerald-600 mt-1">per day</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Target CPA</p>
            <p className="text-xl font-bold text-slate-800">{currentProjections.daily.cpa}</p>
            <p className="text-xs text-cyan-600 mt-1">optimizing</p>
          </div>
        </div>

        {/* Campaign Summary */}
        <div className="mt-6 bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Campaign Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Total Spend</p>
                  <p className="font-bold text-cyan-700">${calculateTotalBudget().toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-600">Duration</p>
                  <p className="font-bold text-cyan-700">{duration} days</p>
                </div>
                <div>
                  <p className="text-slate-600">Test Variants</p>
                  <p className="font-bold text-cyan-700">{selectedTests.length} active</p>
                </div>
                <div>
                  <p className="text-slate-600">Expected ROAS</p>
                  <p className="font-bold text-emerald-600">
                    {projections?.expected_roas || '3.2x - 4.8x'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetTestingStep;