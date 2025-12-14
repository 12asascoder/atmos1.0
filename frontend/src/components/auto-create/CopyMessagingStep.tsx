import React, { useState } from 'react';
import { Sparkles, Copy, ThumbsUp, RefreshCw, MessageSquare, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';

const CopyMessagingStep: React.FC = () => {
  const [selectedTone, setSelectedTone] = useState<string>('energetic');
  const [selectedCopies, setSelectedCopies] = useState<number[]>([]);

  const tones = [
    { id: 'energetic', label: 'Energetic', emoji: '⚡' },
    { id: 'professional', label: 'Professional', emoji: '💼' },
    { id: 'friendly', label: 'Friendly', emoji: '😊' },
    { id: 'urgent', label: 'Urgent', emoji: '🔥' }
  ];

  const copyVariations = [
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

  const messagingInsights = [
    { metric: 'Emotional Appeal', value: 'High', score: 94, icon: '❤️' },
    { metric: 'Call-to-Action Strength', value: 'Strong', score: 91, icon: '🎯' },
    { metric: 'Clarity & Conciseness', value: 'Excellent', score: 96, icon: '✨' },
    { metric: 'Brand Alignment', value: 'Perfect', score: 98, icon: '🏆' }
  ];

  const toggleCopy = (id: number) => {
    setSelectedCopies(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">AI-Generated Copy & Messaging</h2>
          <p className="text-slate-600">Select your preferred messaging tone and copy variations</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold hover:from-cyan-600 hover:to-teal-700 transition-all shadow-md">
          <Sparkles className="w-5 h-5" />
          Generate More
        </button>
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
              className={`p-4 rounded-xl border-2 transition-all ${
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
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-cyan-600" />
          AI-Generated Copy Variations
        </h3>

        <div className="space-y-4">
          {copyVariations.map((copy) => {
            const isSelected = selectedCopies.includes(copy.id);

            return (
              <motion.div
                key={copy.id}
                whileHover={{ scale: 1.01 }}
                className={`relative p-6 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-teal-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
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
                        onClick={() => toggleCopy(copy.id)}
                        className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                          isSelected
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ Selected' : 'Select This Copy'}
                      </button>
                      
                      <button className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
                        <Copy className="w-5 h-5 text-slate-700" />
                      </button>
                      
                      <button className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
                        <RefreshCw className="w-5 h-5 text-slate-700" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Messaging Insights */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-600" />
          Messaging Performance Insights
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

      {/* AI Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2">AI Copywriting Tips</h4>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-cyan-600 mt-1">•</span>
                <span>Your selected copy variations show <strong className="text-cyan-700">42% higher engagement</strong> compared to industry benchmarks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-600 mt-1">•</span>
                <span>Consider testing headlines with <strong className="text-cyan-700">action verbs</strong> for 15-20% better click-through rates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-600 mt-1">•</span>
                <span>The "Energetic" tone aligns perfectly with your <strong className="text-cyan-700">target audience demographics</strong></span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CopyMessagingStep;