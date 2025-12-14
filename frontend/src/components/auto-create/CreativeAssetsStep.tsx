import React, { useState } from 'react';
import { Sparkles, Download, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreativeAssetsStepProps {
  selectedGoal: string | null;
  setSelectedGoal: (goal: string) => void;
}

const CreativeAssetsStep: React.FC<CreativeAssetsStepProps> = () => {
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);

  const creativeAssets = [
    {
      id: 1,
      title: 'Run Like Never Before',
      type: 'Image',
      score: 94,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=600&fit=crop',
      gradient: 'from-red-500 to-pink-600'
    },
    {
      id: 2,
      title: 'Unleash Your Speed',
      type: 'Image',
      score: 91,
      image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500&h=600&fit=crop',
      gradient: 'from-slate-400 to-slate-600'
    },
    {
      id: 3,
      title: 'Performance Redefined',
      type: 'Image',
      score: 88,
      image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&h=600&fit=crop',
      gradient: 'from-orange-500 to-red-600'
    }
  ];

  const recommendations = [
    { label: 'Optimal Format', value: '9:16 Video', stat: '+42% engagement', color: 'from-purple-500 to-indigo-600' },
    { label: 'Recommended Length', value: '12-15 sec', stat: 'Best retention', color: 'from-blue-500 to-cyan-600' },
    { label: 'Color Scheme', value: 'High Contrast', stat: '+28% CTR', color: 'from-emerald-500 to-teal-600' }
  ];

  const toggleAsset = (id: number) => {
    setSelectedAssets(prev =>
      prev.includes(id) ? prev.filter(assetId => assetId !== id) : [...prev, id]
    );
  };

  return (
    <div>
      {/* AI-Generated Creative Assets */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-slate-800">AI-Generated Creative Assets</h2>
        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold hover:from-cyan-600 hover:to-teal-700 transition-all shadow-md">
          <Sparkles className="w-5 h-5" />
          Generate More
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {creativeAssets.map((asset) => (
          <motion.div
            key={asset.id}
            whileHover={{ y: -4 }}
            className="relative group"
          >
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={asset.image}
                alt={asset.title}
                className="w-full h-full object-cover"
              />
              
              {/* Score Badge */}
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-sm font-bold">
                Score: {asset.score}
              </div>

              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                  <button
                    onClick={() => toggleAsset(asset.id)}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      selectedAssets.includes(asset.id)
                        ? 'bg-cyan-600 text-white'
                        : 'bg-white/90 text-slate-900 hover:bg-white'
                    }`}
                  >
                    {selectedAssets.includes(asset.id) ? 'Selected' : 'Select'}
                  </button>
                  <button className="w-10 h-10 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center transition-colors">
                    <Download className="w-5 h-5 text-slate-900" />
                  </button>
                  <button className="w-10 h-10 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center transition-colors">
                    <Heart className="w-5 h-5 text-slate-900" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-xl font-bold text-slate-800 mb-1">{asset.title}</h3>
              <p className="text-cyan-600 text-sm">{asset.type}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Creative Recommendations */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h3 className="text-2xl font-bold text-slate-800 mb-6">Creative Recommendations</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((rec, index) => (
            <div key={index} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <p className="text-slate-600 text-sm mb-2">{rec.label}</p>
              <p className={`text-2xl font-bold bg-gradient-to-r ${rec.color} bg-clip-text text-transparent mb-1`}>
                {rec.value}
              </p>
              <p className="text-slate-500 text-sm">{rec.stat}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreativeAssetsStep;