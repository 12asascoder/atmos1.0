import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '../components/Navigation';
import StepIndicator from '../components/auto-create/StepIndicator';
import CampaignGoalStep from '../components/auto-create/CampaignGoalStep';
import CreativeAssetsStep from '../components/auto-create/CreativeAssetsStep';
import CopyMessagingStep from '../components/auto-create/CopyMessagingStep';
import AudienceStep from '../components/auto-create/AudienceStep';
import BudgetTestingStep from '../components/auto-create/BudgetTestingStep';

export type CampaignGoal = 'awareness' | 'consideration' | 'conversions' | 'retention' | null;

const AutoCreate: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<CampaignGoal>(null);

  const steps = [
    { id: 'goal', label: 'Campaign Goal', component: CampaignGoalStep },
    { id: 'creative', label: 'Creative Assets', component: CreativeAssetsStep },
    { id: 'copy', label: 'Copy & Messaging', component: CopyMessagingStep },
    { id: 'audience', label: 'Audience', component: AudienceStep },
    { id: 'budget', label: 'Budget & Testing', component: BudgetTestingStep }
  ];

  const CurrentStepComponent = steps[currentStep].component;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    if (index <= currentStep || (index === 1 && selectedGoal)) {
      setCurrentStep(index);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
      <Navigation />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step Indicator */}
        <StepIndicator 
          steps={steps} 
          currentStep={currentStep}
          onStepClick={handleStepClick}
          selectedGoal={selectedGoal}
        />

        {/* Step Content */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStepComponent 
                selectedGoal={selectedGoal}
                setSelectedGoal={setSelectedGoal}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              currentStep === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm'
            }`}
          >
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={currentStep === 0 && !selectedGoal}
            className={`px-8 py-3 rounded-xl font-semibold transition-all ${
              currentStep === 0 && !selectedGoal
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white hover:from-cyan-600 hover:to-teal-700 shadow-lg'
            }`}
          >
            {currentStep === steps.length - 1 ? 'Launch Campaign' : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoCreate;