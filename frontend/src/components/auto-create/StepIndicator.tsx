import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  component: React.ComponentType<any>;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (index: number) => void;
  selectedGoal: string | null;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep, onStepClick, selectedGoal }) => {
  const getStepIcon = (step: Step, index: number) => {
    const icons: { [key: string]: string } = {
      goal: '🎯',
      creative: '🖼️',
      copy: '✍️',
      audience: '👥',
      budget: '💰'
    };
    return icons[step.id] || '📋';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep || (index === 0 && selectedGoal);
          const isClickable = index <= currentStep || (index === 1 && selectedGoal);

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg scale-105'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-50 text-slate-400 border border-slate-200'
                } ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}`}
              >
                <span className="text-2xl">{getStepIcon(step, index)}</span>
                <span className="font-semibold hidden md:block">{step.label}</span>
                {isCompleted && !isActive && (
                  <Check className="w-5 h-5 text-emerald-600" />
                )}
              </button>
              
              {index < steps.length - 1 && (
                <ChevronRight className="w-6 h-6 text-slate-300 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;