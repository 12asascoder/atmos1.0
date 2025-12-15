import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Download, Heart, Upload, X, Camera, Image as ImageIcon, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { imageGenerationAPI, type GeneratedImage } from '../../services/imageGeneration';



interface CreativeAssetsStepProps {
  selectedGoal: string | null;
  setSelectedGoal: (goal: string) => void;
}

const CreativeAssetsStep: React.FC<CreativeAssetsStepProps> = () => {
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedImage[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    
    try {
      // Upload image to backend
      const base64Image = await imageGenerationAPI.uploadImage(uploadedFile);
      
      // Get prompt based on selected goal
      const prompt = getPromptForGoal(selectedGoal);
      setCurrentPrompt(prompt);
      
      // Generate batch of images
      const variations = await imageGenerationAPI.generateBatch({
        image: base64Image,
        prompt: prompt,
        num_variations: 3,
        strength: 0.7,
      });
      
      setGeneratedAssets(variations);
      setHasGenerated(true);
      
    } catch (error) {
      console.error('Error generating assets:', error);
      alert('Failed to generate assets. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(100);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setHasGenerated(false);
    setGeneratedAssets([]);
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

  const downloadAsset = (imageBase64: string, title: string) => {
    const link = document.createElement('a');
    link.href = imageBase64;
    link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Initialize WebSocket connection for progress updates
  useEffect(() => {
    // You can implement WebSocket connection here for real-time progress
    // const socket = new WebSocket('ws://localhost:5000');
    
    return () => {
      // Cleanup WebSocket connection
    };
  }, []);

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
                        <p className="font-semibold text-slate-800">Kandinsky 2.2</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-slate-600 text-sm mb-1">Estimated Time</p>
                        <p className="font-semibold text-slate-800">30-60 seconds</p>
                      </div>
                    </div>
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
                      className="px-6 py-4 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {generatedAssets.map((asset) => (
              <motion.div
                key={asset.id}
                whileHover={{ y: -4 }}
                className="relative group"
              >
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={asset.image}
                    alt={asset.prompt || 'Generated asset'}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Score Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-sm font-bold">
                    Score: {asset.score || 85}
                  </div>

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                      <button
                        onClick={() => toggleAsset(asset.id || 0)}
                        className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                          selectedAssets.includes(asset.id || 0)
                            ? 'bg-cyan-600 text-white'
                            : 'bg-white/90 text-slate-900 hover:bg-white'
                        }`}
                      >
                        {selectedAssets.includes(asset.id || 0) ? 'Selected' : 'Select'}
                      </button>
                      <button 
                        onClick={() => downloadAsset(asset.image, asset.prompt || 'generated-asset')}
                        className="w-10 h-10 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
                      >
                        <Download className="w-5 h-5 text-slate-900" />
                      </button>
                      <button className="w-10 h-10 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center transition-colors">
                        <Heart className="w-5 h-5 text-slate-900" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-xl font-bold text-slate-800 mb-1 line-clamp-2">
                    {asset.prompt?.split(',')[0] || 'Generated Asset'}
                  </h3>
                  <p className="text-cyan-600 text-sm">{asset.type || 'AI Generated'}</p>
                  {asset.prompt && (
                    <p className="text-slate-500 text-xs mt-2 line-clamp-2">
                      {asset.prompt}
                    </p>
                  )}
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
        </>
      )}
    </div>
  );
};

export default CreativeAssetsStep;