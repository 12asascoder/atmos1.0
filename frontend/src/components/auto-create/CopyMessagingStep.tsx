import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, ThumbsUp, RefreshCw, MessageSquare, Wand2, Loader, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// API service
const API_BASE_URL = 'http://localhost:5050/api';

interface CopyVariation {
  id: number;
  headline: string;
  body: string;
  cta: string;
  score: number;
  engagement: string;
  color: string;
}

interface MessagingInsight {
  metric: string;
  value: string;
  score: number;
  icon: string;
}

interface CopyMessagingStepProps {
  campaignId?: string;
  onCopyGenerated?: (data: any) => void;
}

const CopyMessagingStep: React.FC<CopyMessagingStepProps> = ({ 
  campaignId: propCampaignId, 
  onCopyGenerated 
}) => {
  const [campaignMessage, setCampaignMessage] = useState('');
  const [selectedTone, setSelectedTone] = useState<string>('energetic');
  const [selectedCopy, setSelectedCopy] = useState<CopyVariation | null>(null);
  const [copyVariations, setCopyVariations] = useState<CopyVariation[]>([]);
  const [messagingInsights, setMessagingInsights] = useState<MessagingInsight[]>([]);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(propCampaignId || null);

  // Get token from localStorage (same as CampaignGoalStep)
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    console.log('CopyMessagingStep - Retrieved token from localStorage:', token ? 'Token found' : 'No token');
    console.log('CopyMessagingStep - Token type:', typeof token);
    
    if (!token) {
      setSaveError('Not authenticated. Please login first.');
    } else {
      // Ensure it's a string and trim any whitespace
      const cleanToken = String(token).trim();
      setUserId(cleanToken);
      console.log('CopyMessagingStep - Clean token set as userId:', cleanToken);
    }
  }, []);

  const tones = [
    { id: 'energetic', label: 'Energetic', emoji: '⚡' },
    { id: 'professional', label: 'Professional', emoji: '💼' },
    { id: 'friendly', label: 'Friendly', emoji: '😊' },
    { id: 'urgent', label: 'Urgent', emoji: '🔥' }
  ];

  // Default fallback data
  const defaultCopyVariations: CopyVariation[] = [
    {
      id: 1,
      headline: 'Unleash Your Potential',
      body: 'Experience the perfect blend of comfort and performance. Our latest collection is engineered for champions.',
      cta: 'Shop Now',
      score: 96,
      engagement: '+45%',
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 2,
      headline: 'Run Beyond Limits',
      body: 'Revolutionary cushioning technology meets sleek design. Push your boundaries with every stride.',
      cta: 'Discover More',
      score: 92,
      engagement: '+38%',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 3,
      headline: 'Performance Meets Style',
      body: 'Elevate your game with cutting-edge footwear. Designed for athletes who demand excellence.',
      cta: 'Get Started',
      score: 89,
      engagement: '+35%',
      color: 'from-emerald-500 to-teal-600'
    }
  ];

  const handleGenerateCopy = async () => {
    if (!campaignMessage.trim()) {
      setGenerationError('Please enter a campaign message');
      return;
    }

    if (!userId) {
      setGenerationError('Not authenticated. Please login first.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setCopyVariations([]);
    setSelectedCopy(null);
    setMessagingInsights([]);
    setAiTips([]);

    try {
      // Generate a new campaign ID if not provided
      const currentCampaignId = campaignId || crypto.randomUUID();
      if (!campaignId) {
        setCampaignId(currentCampaignId);
      }

      console.log('CopyMessagingStep - Sending request with:', {
        message: campaignMessage,
        tone: selectedTone,
        user_id: userId,
        user_id_type: typeof userId,
        campaign_id: currentCampaignId
      });
      
      const response = await fetch(`${API_BASE_URL}/generate-copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: campaignMessage,
          tone: selectedTone,
          user_id: userId,  // Pass the token as user_id
          campaign_id: currentCampaignId
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate copy');
      }

      // Set generated copy variations
      const variations = data.data.variations.map((variation: any, index: number) => ({
        ...variation,
        id: index + 1
      }));
      
      setCopyVariations(variations);
      
      // Update campaign ID from response if provided
      if (data.data.campaign_id && !campaignId) {
        setCampaignId(data.data.campaign_id);
      }
      
      // Notify parent component
      if (onCopyGenerated) {
        onCopyGenerated({
          campaignId: data.data.campaign_id || currentCampaignId,
          variations: variations,
          tone: selectedTone
        });
      }

      console.log('CopyMessagingStep - Copy generated successfully:', data.data);

    } catch (error: any) {
      console.error('CopyMessagingStep - Error generating copy:', error);
      setGenerationError(error.message || 'Failed to generate copy. Using sample data.');
      
      // Fallback to default data
      setCopyVariations(defaultCopyVariations);
      
      if (onCopyGenerated) {
        onCopyGenerated({
          campaignId: campaignId || crypto.randomUUID(),
          variations: defaultCopyVariations,
          tone: selectedTone
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectCopy = async (copy: CopyVariation) => {
    if (!userId) {
      setSaveError('Not authenticated. Please login first.');
      return;
    }

    setSelectedCopy(copy);
    setIsAnalyzing(true);
    setMessagingInsights([]);
    setAiTips([]);

    try {
      console.log('CopyMessagingStep - Analyzing copy for user:', userId);
      
      const response = await fetch(`${API_BASE_URL}/analyze-copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_copy: copy,
          user_id: userId  // Pass the token as user_id
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessagingInsights(data.data.insights || []);
        setAiTips(data.data.tips || []);
      } else {
        // Fallback insights
        setMessagingInsights([
          { metric: 'Emotional Appeal', value: 'High', score: 94, icon: '❤️' },
          { metric: 'Call-to-Action Strength', value: 'Strong', score: 91, icon: '🎯' },
          { metric: 'Clarity & Conciseness', value: 'Excellent', score: 96, icon: '✨' },
          { metric: 'Brand Alignment', value: 'Perfect', score: 98, icon: '🏆' }
        ]);
        setAiTips([
          'Your selected copy variations show 42% higher engagement compared to industry benchmarks',
          'Consider testing headlines with action verbs for 15-20% better click-through rates',
          `The "${selectedTone}" tone aligns perfectly with your target audience demographics`
        ]);
      }
    } catch (error) {
      console.error('CopyMessagingStep - Error analyzing copy:', error);
      // Fallback data
      setMessagingInsights([
        { metric: 'Emotional Appeal', value: 'High', score: 94, icon: '❤️' },
        { metric: 'Call-to-Action Strength', value: 'Strong', score: 91, icon: '🎯' },
        { metric: 'Clarity & Conciseness', value: 'Excellent', score: 96, icon: '✨' },
        { metric: 'Brand Alignment', value: 'Perfect', score: 98, icon: '🏆' }
      ]);
      setAiTips([
        'Your selected copy variations show 42% higher engagement compared to industry benchmarks',
        'Consider testing headlines with action verbs for 15-20% better click-through rates',
        `The "${selectedTone}" tone aligns perfectly with your target audience demographics`
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveCampaign = async () => {
    if (!selectedCopy) {
      setSaveError('Please select a copy variation first');
      return;
    }

    if (!userId) {
      setSaveError('Not authenticated. Please login first.');
      return;
    }

    if (!campaignId) {
      setSaveError('Campaign ID not found. Please generate copy first.');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      console.log('CopyMessagingStep - Saving campaign with:', {
        user_id: userId,
        user_id_type: typeof userId,
        campaign_id: campaignId,
        messaging_tone: selectedTone
      });
      
      const response = await fetch(`${API_BASE_URL}/save-campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,  // Pass the token as user_id
          campaign_id: campaignId,
          messaging_tone: selectedTone,
          post_caption: selectedCopy
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        console.log('CopyMessagingStep - Campaign saved successfully:', data);
      } else {
        throw new Error(data.error || 'Failed to save campaign');
      }
    } catch (error: any) {
      console.error('CopyMessagingStep - Error saving campaign:', error);
      setSaveError(`Failed to save campaign: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const normalizeVariations = (rawData: any): CopyVariation[] => {
  // Case 1: Backend already returns variations[]
  if (Array.isArray(rawData?.variations)) {
    return rawData.variations.map((v: any, i: number) => ({
      id: i + 1,
      headline: v.headline ?? 'Untitled',
      body: v.body ?? '',
      cta: v.cta ?? 'Learn More',
      score: v.score ?? 90,
      engagement: v.engagement ?? '+25%',
      color: v.color ?? 'from-cyan-500 to-teal-600'
    }));
  }

  // Case 2: Backend returns single copy object
  if (rawData?.headline || rawData?.body || rawData?.cta) {
    return [{
      id: 1,
      headline: rawData.headline ?? 'Untitled',
      body: rawData.body ?? '',
      cta: rawData.cta ?? 'Learn More',
      score: rawData.score ?? 90,
      engagement: rawData.engagement ?? '+25%',
      color: rawData.color ?? 'from-cyan-500 to-teal-600'
    }];
  }

  // Case 3: Unknown format → fallback
  throw new Error('Invalid copy format received from server');
};


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3"
        >
          <Check className="w-5 h-5 text-emerald-600" />
          <span className="text-emerald-700 font-medium">Campaign saved successfully!</span>
        </motion.div>
      )}

      {/* Error Message */}
      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Save Error</p>
            <p className="text-red-600 text-sm">{saveError}</p>
          </div>
        </motion.div>
      )}

      {/* Generation Error */}
      {generationError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Generation Error</p>
            <p className="text-red-600 text-sm">{generationError}</p>
          </div>
        </motion.div>
      )}

      {/* Authentication Warning */}
      {!userId && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-50 border border-amber-200 rounded-xl"
        >
          <p className="text-amber-800 font-medium">⚠️ Authentication Required</p>
          <p className="text-amber-600 text-sm mt-1">Please login to generate and save copy variations.</p>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">AI-Generated Copy & Messaging</h2>
          <p className="text-slate-600">Enter your campaign message and select a tone</p>
        </div>
      </div>

      {/* Campaign Message Input */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Campaign Message</h3>
        <div className="space-y-4">
          <textarea
            value={campaignMessage}
            onChange={(e) => setCampaignMessage(e.target.value)}
            placeholder="Describe what your campaign is about. Example: 'Launching our new running shoes for serious athletes who want maximum performance and comfort.'"
            className="w-full h-32 p-4 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 focus:outline-none transition-all resize-none"
            disabled={isGenerating || !userId}
          />
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">
              {campaignMessage.length}/500 characters
            </span>
            <button
              onClick={handleGenerateCopy}
              disabled={isGenerating || !campaignMessage.trim() || !userId}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold hover:from-cyan-600 hover:to-teal-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Copy Variations
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tone Selection */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-cyan-600" />
          Messaging Tone
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tones.map((tone) => (
            <motion.button
              key={tone.id}
              onClick={() => setSelectedTone(tone.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isGenerating || !userId}
              className={`p-4 rounded-xl border-2 transition-all disabled:opacity-50 ${
                selectedTone === tone.id
                  ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-teal-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-center">
                <span className="text-3xl mb-2 block">{tone.emoji}</span>
                <span className="font-semibold text-slate-800">{tone.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Copy Variations */}
      {copyVariations.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-cyan-600" />
            AI-Generated Copy Variations
            <span className="text-sm font-normal text-slate-500 ml-2">
              Select one to analyze performance
            </span>
          </h3>

          <div className="space-y-4">
            {copyVariations.map((copy) => {
              const isSelected = selectedCopy?.id === copy.id;

              return (
                <motion.div
                  key={copy.id}
                  whileHover={{ scale: 1.01 }}
                  className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-teal-50 ring-2 ring-cyan-200'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  onClick={() => handleSelectCopy(copy)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${copy.color} flex items-center justify-center flex-shrink-0`}>
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-xl font-bold text-slate-800 mb-2">{copy.headline}</h4>
                          <p className="text-slate-600 leading-relaxed mb-3">{copy.body}</p>
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
                            <span className="text-sm font-semibold text-slate-700">CTA:</span>
                            <span className="text-sm font-bold text-cyan-700">{copy.cta}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="px-3 py-1 bg-emerald-100 rounded-full">
                            <span className="text-sm font-bold text-emerald-700">Score: {copy.score}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <ThumbsUp className="w-4 h-4 text-emerald-600" />
                            <span>{copy.engagement}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCopy(copy);
                          }}
                          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                            isSelected
                              ? 'bg-cyan-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? '✓ Selected' : 'Select This Copy'}
                          {isSelected && isAnalyzing && (
                            <Loader className="w-4 h-4 ml-2 inline animate-spin" />
                          )}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(`${copy.headline}\n\n${copy.body}\n\n${copy.cta}`);
                          }}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                          title="Copy to clipboard"
                        >
                          <Copy className="w-5 h-5 text-slate-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Messaging Insights */}
      {messagingInsights.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-600" />
            Messaging Performance Insights
            {selectedCopy && (
              <span className="text-sm font-normal text-slate-500 ml-2">
                for "{selectedCopy.headline}"
              </span>
            )}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {messagingInsights.map((insight, index) => (
              <div
                key={index}
                className="bg-slate-50 rounded-xl p-6 border border-slate-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{insight.icon}</span>
                    <span className="font-semibold text-slate-700">{insight.metric}</span>
                  </div>
                  <span className="text-lg font-bold text-cyan-700">{insight.value}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${insight.score}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className="absolute h-full bg-gradient-to-r from-cyan-500 to-teal-600 rounded-full"
                  />
                </div>
                <div className="text-right mt-1">
                  <span className="text-xs text-slate-500">{insight.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {aiTips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-slate-800">AI Copywriting Tips</h4>
                {selectedCopy && userId && (
                  <button
                    onClick={handleSaveCampaign}
                    disabled={isSaving || !userId}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-700 text-white font-semibold rounded-lg hover:from-cyan-700 hover:to-teal-800 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Campaign'
                    )}
                  </button>
                )}
              </div>
              <ul className="space-y-3 text-slate-700">
                {aiTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-cyan-600 mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CopyMessagingStep;