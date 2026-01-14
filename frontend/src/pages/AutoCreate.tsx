// src/pages/AutoCreate.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '../components/Navigation';
import StepIndicator from '../components/auto-create/StepIndicator';
import PlatformSelectorStep from '../components/auto-create/PlatformSelectorStep';
import CampaignGoalStep from '../components/auto-create/CampaignGoalStep';
import CreativeAssetsStep from '../components/auto-create/CreativeAssetsStep';
import CopyMessagingStep from '../components/auto-create/CopyMessagingStep';
import AudienceStep from '../components/auto-create/AudienceStep';
import BudgetTestingStep from '../components/auto-create/BudgetTestingStep';

export type CampaignGoal = 'awareness' | 'consideration' | 'conversions' | 'retention' | null;

const AutoCreate: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<CampaignGoal>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Updated steps array to include platform selector as step 0
  const steps = [
    { id: 'platform', label: 'Platforms', component: PlatformSelectorStep },
    { id: 'goal', label: 'Campaign Goal', component: CampaignGoalStep },
    { id: 'creative', label: 'Creative Assets', component: CreativeAssetsStep },
    { id: 'copy', label: 'Copy & Messaging', component: CopyMessagingStep },
    { id: 'audience', label: 'Audience', component: AudienceStep },
    { id: 'budget', label: 'Budget & Testing', component: BudgetTestingStep }
  ];

  const CurrentStepComponent = steps[currentStep].component;

  const handleNext = () => {
    if (currentStep === 0 && selectedPlatforms.length === 0) {
      // Don't proceed from platform selection without selecting at least one platform
      alert('Please select at least one platform to continue.');
      return;
    }

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
    // Allow navigation to platform selector always
    if (index === 0) {
      setCurrentStep(index);
      return;
    }

    // For other steps, check if platforms are selected (for step 1+)
    if (index === 1 && selectedPlatforms.length === 0) {
      alert('Please select platforms first before proceeding to campaign goal.');
      return;
    }

    // Allow navigation to steps that have been completed or are current
    if (index <= currentStep || (index === 1 && selectedPlatforms.length > 0)) {
      setCurrentStep(index);
    }
  };

  const handlePlatformSelect = (platforms: string[]) => {
    setSelectedPlatforms(platforms);
  };

  // Props to pass to each step component
  // Update getStepProps in AutoCreate.tsx to pass platforms to other steps
  const getStepProps = () => {
    switch (currentStep) {
      case 0:
        return { onPlatformSelect: handlePlatformSelect };
      case 1:
        return {
          selectedGoal,
          setSelectedGoal,
          selectedPlatforms // Pass to CampaignGoalStep if needed
        };
      default:
        return {
          selectedGoal,
          selectedPlatforms // Pass to other steps
        };
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
          selectedGoal={selectedPlatforms.length > 0} // Use platforms selection as completion indicator for step 0
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
              <CurrentStepComponent {...getStepProps()} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${currentStep === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm'
              }`}
          >
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={currentStep === 0 ? selectedPlatforms.length === 0 : currentStep === 1 && !selectedGoal}
            className={`px-8 py-3 rounded-xl font-semibold transition-all ${(currentStep === 0 && selectedPlatforms.length === 0) ||
                (currentStep === 1 && !selectedGoal)
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white hover:from-cyan-600 hover:to-teal-700 shadow-lg'
              }`}
          >
            {currentStep === steps.length - 1
              ? 'Launch Campaign'
              : currentStep === 0
                ? 'Continue to Campaign Goal'
                : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoCreate;