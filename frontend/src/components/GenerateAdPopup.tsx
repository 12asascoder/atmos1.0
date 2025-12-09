import React, { useState } from 'react';
import { colors } from '../styles/colors';

interface GenerateAdPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const GenerateAdPopup: React.FC<GenerateAdPopupProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setDebugInfo('');

    try {
      console.log('Sending prompt:', prompt);
      console.log('Sending to: http://localhost:50002/image_gen');
      
      const response = await fetch('http://localhost:5002/image_gen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: prompt }),
        mode: 'cors'
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const data = await response.json();
      console.log('Response data:', data);
      console.log('Data type:', typeof data);
      console.log('Data keys:', Object.keys(data));
      
      setDebugInfo(JSON.stringify(data, null, 2));

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Failed to generate image';
        console.error('API Error:', data);
        throw new Error(errorMessage);
      }

      // Handle different response formats from Qubrid API
      let imageUrl = null;
      
      // Log what we're checking
      console.log('Checking data.image_url:', data.image_url);
      console.log('Checking data.image:', data.image ? 'exists' : 'missing');
      console.log('Checking data.data:', data.data);
      console.log('Checking data.url:', data.url);
      console.log('Checking data.output:', data.output);
      
      if (data.image_url) {
        imageUrl = data.image_url;
        console.log('Using image_url');
      } else if (data.image) {
        imageUrl = `data:image/png;base64,${data.image}`;
        console.log('Using base64 image');
      } else if (data.data && Array.isArray(data.data) && data.data[0]) {
        if (data.data[0].url) {
          imageUrl = data.data[0].url;
          console.log('Using data[0].url');
        } else if (data.data[0].b64_json) {
          imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
          console.log('Using data[0].b64_json');
        }
      } else if (data.url) {
        imageUrl = data.url;
        console.log('Using url');
      } else if (data.output) {
        imageUrl = data.output;
        console.log('Using output');
      }
      
      if (imageUrl) {
        setGeneratedImage(imageUrl);
        console.log('Image set successfully:', imageUrl.substring(0, 100));
      } else {
        console.error('Unexpected response format:', data);
        throw new Error(`No image data received. Response keys: ${Object.keys(data).join(', ')}`);
      }
    } catch (err) {
      console.error('Error generating ad:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate advertisement. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isGenerating && !generatedImage) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleReset = () => {
    setPrompt('');
    setGeneratedImage(null);
    setError(null);
    setIsGenerating(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
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
                {generatedImage ? 'Your ad has been generated!' : 'Describe your ad in a single prompt and let AI create it for you'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center"
              disabled={isGenerating}
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-slate-50/50 to-white">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            
            {/* Loading State */}
            {isGenerating && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative">
                  {/* Animated circles */}
                  <div className="w-24 h-24 rounded-full border-4 border-slate-200 border-t-slate-700 animate-spin"></div>
                  <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-transparent border-r-slate-500 animate-spin" style={{ animationDuration: '1.5s' }}></div>
                </div>
                <h3 className={`text-xl font-semibold ${colors.neutral.textDark} mt-8 mb-2`}>
                  Generating Your Advertisement
                </h3>
                <p className={`text-sm ${colors.neutral.textLight} text-center max-w-md`}>
                  Our AI is crafting your perfect ad. This may take a few moments...
                </p>
                <div className="mt-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}

            {/* Generated Image Display */}
            {generatedImage && !isGenerating && (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden mb-4">
                  <img 
                    src={generatedImage} 
                    alt="Generated Advertisement" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Ad generated successfully!</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <a
                      href={generatedImage}
                      download="generated-ad.png"
                      className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                    <button
                      onClick={handleReset}
                      className="px-5 py-2 rounded-lg bg-gradient-to-r from-slate-700 to-slate-900 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Generate New
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isGenerating && !generatedImage && (
              <div className="mb-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 mb-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-semibold text-red-900 mb-1">Generation Failed</h4>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
                {debugInfo && (
                  <details className="p-4 bg-slate-100 border border-slate-300 rounded-xl">
                    <summary className="text-sm font-semibold text-slate-700 cursor-pointer">Debug Information (Click to expand)</summary>
                    <pre className="mt-2 text-xs text-slate-600 overflow-auto max-h-48">{debugInfo}</pre>
                  </details>
                )}
              </div>
            )}

            {/* Input Form - Only show if not generating and no image */}
            {!isGenerating && !generatedImage && (
              <>
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
                          onClick={handleClose}
                          className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleGenerate}
                          disabled={!prompt.trim()}
                          className="px-6 py-2 rounded-lg bg-gradient-to-r from-slate-700 to-slate-900 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Generate AD</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hint */}
                  <p className="mt-3 text-xs text-slate-500 text-center">
                    Press Enter to generate or Shift + Enter for a new line
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateAdPopup;