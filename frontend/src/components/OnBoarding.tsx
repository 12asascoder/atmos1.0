import React, { useState } from 'react';
import { ChevronRight, Sparkles, Briefcase, Target } from 'lucide-react';

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    businessType: '',
    industry: '',
    goals: ''
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const questions = [
    {
      id: 'businessType',
      question: "What type of marketing business do you run?",
      icon: Briefcase,
      options: [
        'Digital Marketing Agency',
        'Social Media Marketing',
        'Content Marketing',
        'Email Marketing',
        'SEO/SEM Services',
        'Influencer Marketing',
        'Brand Strategy',
        'Freelance Marketer'
      ]
    },
    {
      id: 'industry',
      question: "Which industry do you primarily serve?",
      icon: Sparkles,
      options: [
        'E-commerce & Retail',
        'Technology & SaaS',
        'Healthcare & Wellness',
        'Real Estate',
        'Food & Beverage',
        'Fashion & Beauty',
        'Education',
        'Finance & Insurance',
        'Multiple Industries'
      ]
    },
    {
      id: 'goals',
      question: "What's your primary goal with our platform?",
      icon: Target,
      options: [
        'Generate more leads',
        'Improve campaign performance',
        'Automate marketing tasks',
        'Better understand analytics',
        'Create engaging content',
        'Manage multiple clients',
        'Scale my business',
        'Learn new marketing strategies'
      ]
    }
  ];

  const currentQuestion = questions[currentStep];
  const Icon = currentQuestion?.icon;
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleOptionSelect = (option) => {
    const currentQuestionId = currentQuestion?.id;
    if (!currentQuestionId) return;
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestionId]: option
    }));
  };

  const handleNext = () => {
    const currentQuestionId = currentQuestion?.id;
    if (!currentQuestionId || !answers[currentQuestionId]) {
      setError('Please select an option to continue');
      return;
    }
    
    setError('');
    setIsAnimating(true);
    
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmit();
      }
      setIsAnimating(false);
    }, 300);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please sign up again.');
        return;
      }

      const response = await fetch('http://localhost:5003/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(answers)
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        setError(data.error || 'Failed to complete onboarding');
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Orbs - matching Home page */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-cyan-300/20 to-teal-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-200/10 to-teal-200/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-700 text-sm font-bold tracking-tight">
              Step {currentStep + 1} of {questions.length}
            </span>
            <span className="text-cyan-600 text-sm font-bold tracking-tight">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-slate-200/50 rounded-full h-2.5 overflow-hidden backdrop-blur-sm border border-slate-200/50">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-teal-600 rounded-full transition-all duration-700 ease-out shadow-lg"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div 
          className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/50 p-8 md:p-12 transition-all duration-300 ${
            isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
          }`}
        >
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              {Icon && <Icon className="w-10 h-10 text-white" strokeWidth={2.5} />}
            </div>
          </div>

          {/* Question */}
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-10 tracking-tight leading-tight">
            {currentQuestion?.question}
          </h2>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion?.options.map((option, index) => {
              const currentQuestionId = currentQuestion?.id;
              const isSelected = answers[currentQuestionId] === option;
              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full p-4 rounded-xl text-left transition-all duration-200 transform hover:scale-[1.02] ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/20 scale-[1.02]'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border-2 border-slate-200 hover:border-cyan-300'
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: isAnimating ? 'none' : 'slideIn 0.4s ease-out forwards'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {option}
                    </span>
                    {isSelected && (
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                        <div className="w-3 h-3 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700 text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center space-x-2 tracking-tight ${
              isSubmitting
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white hover:from-cyan-600 hover:to-teal-700 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transform hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>Completing...</span>
              </div>
            ) : (
              <>
                <span>{currentStep === questions.length - 1 ? 'Complete Setup' : 'Continue'}</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Skip Button */}
        <div className="text-center mt-6">
          <button 
            onClick={() => window.location.href = '/'}
            className="text-slate-700 hover:text-cyan-600 transition-colors text-sm font-bold underline underline-offset-4 hover:underline-offset-2 tracking-tight"
          >
            Skip for now
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default OnboardingPage;