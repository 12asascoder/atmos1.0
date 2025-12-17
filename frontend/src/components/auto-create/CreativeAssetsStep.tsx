import React, { useState, useRef } from 'react';
import { Sparkles, Download, Heart, Upload, X, Camera, Image as ImageIcon, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreativeAssetsStepProps {
  selectedGoal: string | null;
  setSelectedGoal: (goal: string) => void;
}

interface GeneratedImage {
  id: number;
  title: string;
  image: string;
  prompt: string;
  score: number;
  type: string;
}

const CreativeAssetsStep: React.FC<CreativeAssetsStepProps> = ({ selectedGoal, setSelectedGoal }) => {
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedImage[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dummy images for demo
  const dummyImages = [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=1000&fit=crop',
    'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=1000&fit=crop',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&h=1000&fit=crop',
    'https://images.unsplash.com/photo-1579722821273-5b84c6b42c0d?w=800&h=1000&fit=crop',
    'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=800&h=1000&fit=crop',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=1000&fit=crop',
  ];

  // Predefined prompts based on campaign goal
  const getPromptForGoal = (goal: string | null): string => {
    const prompts: Record<string, string> = {
      'awareness': 'Professional product advertisement, brand awareness, eye-catching, high quality, commercial photography, studio lighting',
      'engagement': 'Engaging product showcase, interactive concept, lifestyle setting, natural environment, social media optimized',
      'conversion': 'Product in use, compelling call-to-action, clear value proposition, commercial advertisement, conversion-focused',
      'retention': 'Loyalty building, customer success story, product benefits showcase, long-term value, retention-focused',
      'lead': 'Lead generation focused, information gathering, valuable offer presentation, B2B oriented, professional',
    };
    return prompts[goal || 'awareness'] || 'Professional product advertisement, high quality, commercial photography';
  };

  const recommendations = [
    { label: 'Optimal Format', value: '9:16 Video', stat: '+42% engagement', color: 'from-purple-500 to-indigo-600' },
    { label: 'Recommended Length', value: '12-15 sec', stat: 'Best retention', color: 'from-blue-500 to-cyan-600' },
    { label: 'Color Scheme', value: 'High Contrast', stat: '+28% CTR', color: 'from-emerald-500 to-teal-600' }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAssets = async () => {
    if (!uploadedImage || !uploadedFile) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Simulate API call with progress
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          generateDummyData();
          setIsGenerating(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const generateDummyData = () => {
    const prompt = getPromptForGoal(selectedGoal);
    setCurrentPrompt(prompt);
    
    // Create dummy generated assets
    const dummyGeneratedAssets: GeneratedImage[] = [
      {
        id: 1,
        title: 'Professional Product Showcase',
        image: dummyImages[0],
        prompt: `${prompt}, professional photography, studio lighting, product showcase`,
        score: 94,
        type: 'AI Generated'
      },
      {
        id: 2,
        title: 'Lifestyle Setting',
        image: dummyImages[1],
        prompt: `${prompt}, lifestyle setting, natural environment, authentic`,
        score: 91,
        type: 'AI Generated'
      },
      {
        id: 3,
        title: 'Creative Concept',
        image: dummyImages[2],
        prompt: `${prompt}, creative concept, artistic composition, visually appealing`,
        score: 88,
        type: 'AI Generated'
      },
      {
        id: 4,
        title: 'Commercial Advertisement',
        image: dummyImages[3],
        prompt: `${prompt}, commercial advertisement, brand marketing, professional`,
        score: 92,
        type: 'AI Generated'
      },
      {
        id: 5,
        title: 'Minimalist Design',
        image: dummyImages[4],
        prompt: `${prompt}, minimalist design, clean background, modern`,
        score: 89,
        type: 'AI Generated'
      },
      {
        id: 6,
        title: 'Dynamic Composition',
        image: dummyImages[5],
        prompt: `${prompt}, dynamic composition, engaging, high quality`,
        score: 90,
        type: 'AI Generated'
      }
    ];
    
    setGeneratedAssets(dummyGeneratedAssets);
    setHasGenerated(true);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setHasGenerated(false);
    setGeneratedAssets([]);
    setGenerationProgress(0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAsset = (id: number) => {
    setSelectedAssets(prev =>
      prev.includes(id) ? prev.filter(assetId => assetId !== id) : [...prev, id]
    );
  };

  const downloadAsset = (imageUrl: string, title: string) => {
    // For dummy data, we'll open the image in a new tab
    window.open(imageUrl, '_blank');
  };

  return (
    <div>
      {/* Product Image Upload Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-slate-800 mb-6">Upload Your Product Image</h2>
        
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-dashed border-slate-300 p-8">
          {!uploadedImage ? (
            <div
              className="flex flex-col items-center justify-center py-12"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-100 to-teal-100 flex items-center justify-center mb-6">
                <Upload className="w-12 h-12 text-cyan-600" />
              </div>
              
              <h3 className="text-2xl font-semibold text-slate-800 mb-2">
                Upload Product Image
              </h3>
              
              <p className="text-slate-600 text-center mb-6 max-w-md">
                Upload a clear image of your product. Our AI will generate creative assets based on your product.
              </p>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-slate-500" />
                  <span className="text-slate-600">Clear photo</span>
                </div>
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-slate-500" />
                  <span className="text-slate-600">PNG, JPG, WebP</span>
                </div>
              </div>
              
              <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold hover:from-cyan-600 hover:to-teal-700 transition-all shadow-md">
                Choose Image
              </button>
              
              <p className="mt-4 text-slate-500 text-sm">
                or drag and drop your image here
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Uploaded Image Preview */}
                <div className="relative w-full md:w-1/3">
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                    <img
                      src={uploadedImage}
                      alt="Uploaded product"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-md"
                  >
                    <X className="w-5 h-5 text-slate-700" />
                  </button>
                </div>
                
                {/* Upload Details */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">
                    Product Image Uploaded Successfully!
                  </h3>
                  
                  {selectedGoal && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-blue-800 font-medium">
                        Campaign Goal: <span className="font-bold">{selectedGoal}</span>
                      </p>
                      <p className="text-blue-600 text-sm mt-1">
                        AI will generate assets optimized for {selectedGoal} campaigns
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <span className="text-slate-600">Image Status</span>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                        Ready for AI Processing
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-slate-600 text-sm mb-1">AI Model</p>
                        <p className="font-semibold text-slate-800">Kandinsky 2.2 (Demo Mode)</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-slate-600 text-sm mb-1">Estimated Time</p>
                        <p className="font-semibold text-slate-800">5-10 seconds</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {isGenerating && (
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex justify-between text-sm text-slate-600 mb-2">
                          <span>Generating AI assets...</span>
                          <span>{generationProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                          <div 
                            className="bg-gradient-to-r from-cyan-500 to-teal-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${generationProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={handleGenerateAssets}
                      disabled={isGenerating}
                      className="flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold hover:from-cyan-600 hover:to-teal-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Generating... {generationProgress}%
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate Creative Assets
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isGenerating}
                      className="px-6 py-4 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                      Change Image
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI-Generated Creative Assets (Only show after generation) */}
      {hasGenerated && generatedAssets.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">AI-Generated Creative Assets</h2>
              <p className="text-slate-600 mt-2">
                Generated with prompt: <span className="font-medium text-cyan-600">{currentPrompt}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-700 font-medium">
                  Demo Mode: Showing sample data
                </span>
              </div>
            </div>
            <button 
              onClick={handleGenerateAssets}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold hover:from-cyan-600 hover:to-teal-700 transition-all shadow-md disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" />
              Generate More
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {generatedAssets.map((asset) => (
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
                        {selectedAssets.includes(asset.id) ? 'Selected ✓' : 'Select'}
                      </button>
                      <button 
                        onClick={() => downloadAsset(asset.image, asset.title)}
                        className="w-10 h-10 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
                        title="View Full Size"
                      >
                        <Download className="w-5 h-5 text-slate-900" />
                      </button>
                      <button 
                        onClick={() => toggleAsset(asset.id)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          selectedAssets.includes(asset.id)
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-white/90 text-slate-900 hover:bg-white'
                        }`}
                        title="Add to Favorites"
                      >
                        <Heart className={`w-5 h-5 ${selectedAssets.includes(asset.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-2">
                  <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2">
                    {asset.title}
                  </h3>
                  <p className="text-cyan-600 text-sm mb-2">{asset.type}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      {selectedGoal || 'Generic'} Campaign
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                      AI Generated
                    </span>
                  </div>
                  {asset.prompt && (
                    <p className="text-slate-500 text-xs mt-2 line-clamp-2 italic">
                      "{asset.prompt.split(',')[0]}..."
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Selected Assets Summary */}
          {selectedAssets.length > 0 && (
            <div className="mb-8 p-6 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-2xl border border-cyan-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-cyan-900 mb-1">
                    {selectedAssets.length} Asset{selectedAssets.length !== 1 ? 's' : ''} Selected
                  </h3>
                  <p className="text-cyan-700">
                    Ready to use in your campaign. You can download or proceed to next step.
                  </p>
                </div>
                <button className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-700 text-white font-semibold rounded-lg hover:from-cyan-700 hover:to-teal-800 transition-all">
                  Proceed with Selected
                </button>
              </div>
            </div>
          )}

          {/* Creative Recommendations */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Creative Recommendations</h3>
              <span className="text-sm px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                Based on your goal: {selectedGoal || 'Brand Awareness'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map((rec, index) => (
                <div key={index} className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${rec.color} flex items-center justify-center mb-4`}>
                    <div className="w-6 h-6 bg-white rounded-full"></div>
                  </div>
                  <p className="text-slate-600 text-sm mb-2">{rec.label}</p>
                  <p className={`text-2xl font-bold bg-gradient-to-r ${rec.color} bg-clip-text text-transparent mb-1`}>
                    {rec.value}
                  </p>
                  <p className="text-slate-500 text-sm">{rec.stat}</p>
                </div>
              ))}
            </div>

            {/* Additional Tips */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h4 className="text-lg font-semibold text-slate-800 mb-4">Tips for Better Results</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <Camera className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 mb-1">Use High-Quality Images</p>
                    <p className="text-slate-600 text-sm">Upload clear, well-lit product photos for best AI results</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 mb-1">Experiment with Prompts</p>
                    <p className="text-slate-600 text-sm">Try different prompts to generate varied creative concepts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CreativeAssetsStep;