import React, { useState } from 'react';
import { colors } from '../styles/colors';

interface GenerateAdPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
}

const GenerateAdPopup: React.FC<GenerateAdPopupProps> = ({ isOpen, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      await onGenerate(prompt);
      setPrompt('');
      onClose();
    } catch (error) {
      console.error('Error generating ad:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Popup Container - 70% of screen */}
      <div className="relative w-[70vw] h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-semibold ${colors.neutral.textDark} mb-1`}>
                Generate Advertisement
              </h2>
              <p className={`text-sm ${colors.neutral.textLight}`}>
                Describe your ad in a single prompt and let AI create it for you
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-slate-50/50 to-white">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {/* Instructions Card */}
            <div className="mb-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${colors.neutral.textDark} mb-2`}>
                    How to create your ad
                  </h3>
                  <p className={`text-sm ${colors.neutral.textLight} leading-relaxed`}>
                    Provide a detailed description of the advertisement you want to create. Include information about your product, target audience, tone, key messages, and any specific requirements. The more details you provide, the better the result!
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Input Area */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Example: Create a Facebook ad for our new eco-friendly water bottle. Target audience: environmentally conscious millennials. Tone: inspiring and hopeful. Highlight: made from 100% recycled materials..."
                  className={`w-full px-6 py-4 text-base ${colors.neutral.text} placeholder-slate-400 focus:outline-none resize-none`}
                  rows={8}
                  disabled={isGenerating}
                />
                
                {/* Input Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${colors.neutral.textLight}`}>
                      {prompt.length} characters
                    </span>
                    {prompt.length > 0 && (
                      <span className="text-xs text-emerald-600 font-medium">
                        • Ready to generate
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                      disabled={isGenerating}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      className={`px-6 py-2 rounded-lg bg-gradient-to-r from-slate-700 to-slate-900 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                        !isGenerating ? 'hover:scale-105' : ''
                      }`}
                    >
                      {isGenerating ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Generate AD</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Hint */}
              <p className="mt-3 text-xs text-slate-500 text-center">
                Press Enter to generate or Shift + Enter for a new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateAdPopup;