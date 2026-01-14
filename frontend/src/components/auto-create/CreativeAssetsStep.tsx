// CreativeAssetsStep.tsx - Modified for Image/Video Selection
import React, { useState, useRef } from 'react';
import { Sparkles, Download, Heart, Upload, X, Camera, Image as ImageIcon, Loader, Video } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreativeAssetsStepProps {
  selectedGoal: string | null;
  setSelectedGoal: (goal: string) => void;
}

interface GeneratedImage {
  id: number;
  title: string;
  image_url: string;
  prompt: string;
  score: number;
  type: string;
  task_id?: string;
}

// Add type for generation mode
type GenerationMode = 'image' | 'video' | null;

const CreativeAssetsStep: React.FC<CreativeAssetsStepProps> = ({ selectedGoal, setSelectedGoal }) => {
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generatedImageAssets, setGeneratedImageAssets] = useState<GeneratedImage[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [adTypeInput, setAdTypeInput] = useState<string>('');
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [generationMode, setGenerationMode] = useState<GenerationMode>(null); // Add this state

  // Backend API URL
  const API_BASE_URL = 'http://localhost:5050';

  const recommendations = [
    { label: 'Optimal Format', value: '1:1 Square', stat: '+42% engagement', color: 'from-purple-500 to-indigo-600' },
    { label: 'Recommended Style', value: 'High Quality', stat: 'Best results', color: 'from-blue-500 to-cyan-600' },
    { label: 'AI Model', value: 'Gen4 Turbo', stat: 'Fast generation', color: 'from-emerald-500 to-teal-600' }
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedFile(file);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        // Only upload to backend if in image generation mode
        if (generationMode === 'image') {
          await uploadImageToBackend(file, result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload an image file (PNG, JPG, or WebP)');
    }
  };

  const uploadImageToBackend = async (file: File, imageDataUrl: string) => {
    try {
      setUploading(true);
      const base64Data = imageDataUrl.split(',')[1];

      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || 'demo_user';
      const campaignId = localStorage.getItem('campaign_id');

      const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: token,
          image_data: base64Data,
          filename: file.name,
          campaign_id: campaignId,
          ad_type: adTypeInput,
          asset_data: {
            title: file.name,
            type: 'user_uploaded',
            score: 0
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✓ Image uploaded successfully');
        if (data.campaign_id) {
          localStorage.setItem('campaign_id', data.campaign_id);
        }
      } else {
        console.error('✗ Upload failed:', data.error);
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please make sure the backend is running.');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateAssets = async () => {
    // Only proceed if in image generation mode
    if (generationMode !== 'image') return;
    
    // Validation: Both image and ad type must be present
    if (!uploadedImage) {
      alert('Please upload an image first');
      return;
    }

    if (!adTypeInput || adTypeInput.trim() === '') {
      alert('Please specify the type of ads you want to generate');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Preparing generation...');

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + 3;
      });
    }, 500);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || 'demo_user';
      const campaignId = localStorage.getItem('campaign_id');

      if (!campaignId) {
        throw new Error('No campaign found. Please upload image again.');
      }

      setGenerationStatus('Uploading to Runway ML...');

      const response = await fetch(`${API_BASE_URL}/api/generate-assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: token,
          campaign_goal: selectedGoal || 'awareness',
          campaign_id: campaignId,
          ad_type: adTypeInput
        })
      });

      const data = await response.json();

      clearInterval(progressInterval);

      if (data.success) {
        setGenerationStatus('Generation complete!');
        setGenerationProgress(100);

        const assets = data.assets.map((asset: any) => ({
          ...asset,
          id: asset.id
        }));

        setGeneratedImageAssets(assets);
        setCurrentPrompt(assets[0]?.prompt || '');
        setHasGenerated(true);

        console.log(`✓ Successfully generated ${assets.length} images`);
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error: any) {
      console.error('Error generating assets:', error);
      clearInterval(progressInterval);
      setGenerationStatus('Generation failed');
      
      alert(`Failed to generate images: ${error.message}\n\nPlease check:\n1. Backend is running on ${API_BASE_URL}\n2. RUNWAY_API_KEY is set\n3. You have Runway credits available`);
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationStatus('');
      }, 1000);
    }
  };

  const saveSelectedAssets = async () => {
    try {
      const selectedAssetsData = generatedImageAssets
        .filter(asset => selectedAssets.includes(asset.id))
        .map(asset => ({
          id: asset.id,
          title: asset.title,
          image_url: asset.image_url,
          prompt: asset.prompt,
          score: asset.score,
          type: asset.type
        }));

      if (selectedAssetsData.length === 0) {
        alert('Please select at least one asset');
        return;
      }

      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || 'demo_user';
      const campaignId = localStorage.getItem('campaign_id');

      if (!campaignId) {
        alert('No campaign found. Please upload image again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/save-selected-assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: token,
          selected_assets: selectedAssetsData,
          campaign_id: campaignId
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`${selectedAssetsData.length} assets saved successfully!`);
      } else {
        alert(`Failed to save assets: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving selected assets:', error);
      alert('Error saving selected assets. Please try again.');
    }
  };

  const handleRemoveFile = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setHasGenerated(false);
    setGeneratedImageAssets([]);
    setGenerationProgress(0);
    setSelectedAssets([]);
    setAdTypeInput('');
    setGenerationStatus('');
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
        // Only upload to backend if in image generation mode
        if (generationMode === 'image') {
          uploadImageToBackend(file, result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please drop an image file');
    }
  };

  const toggleAsset = (id: number) => {
    setSelectedAssets(prev =>
      prev.includes(id) ? prev.filter(assetId => assetId !== id) : [...prev, id]
    );
  };

  const downloadAsset = (url: string, title: string) => {
    window.open(url, '_blank');
  };

  // Reset function when changing generation mode
  const handleModeSelect = (mode: GenerationMode) => {
    setGenerationMode(mode);
    // Reset all states when switching modes
    setUploadedImage(null);
    setUploadedFile(null);
    setHasGenerated(false);
    setGeneratedImageAssets([]);
    setGenerationProgress(0);
    setSelectedAssets([]);
    setAdTypeInput('');
    setGenerationStatus('');
    setIsGenerating(false);
  };

  return (
    <div>
      {/* Generation Mode Selection */}
      {!generationMode && (
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-6">
            Generate AI Assets for Your Campaign
          </h2>
          <p className="text-slate-600 mb-8 text-lg">
            Choose what type of assets you'd like to generate for your campaign
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Image Generation Option */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 p-8 cursor-pointer hover:border-blue-400 transition-all"
              onClick={() => handleModeSelect('image')}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center mb-6">
                  <ImageIcon className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-blue-900 mb-3">
                  Generate Images
                </h3>
                <p className="text-blue-700 mb-6">
                  Upload an image and generate creative ad variations with AI. Perfect for social media posts, banners, and product showcases.
                </p>
                <div className="text-left w-full space-y-2">
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Generate 5+ image variations</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Style transfer and enhancements</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Optimized for different ad formats</span>
                  </div>
                </div>
                <button className="mt-8 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all">
                  Generate Images
                </button>
              </div>
            </motion.div>

            {/* Video Generation Option */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-8 cursor-pointer hover:border-purple-400 transition-all"
              onClick={() => handleModeSelect('video')}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mb-6">
                  <Video className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-purple-900 mb-3">
                  Generate Videos
                </h3>
                <p className="text-purple-700 mb-6">
                  Upload an image and create engaging video ads. Transform static images into dynamic video content for social media and commercials.
                </p>
                <div className="text-left w-full space-y-2">
                  <div className="flex items-center gap-2 text-purple-600">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>Image-to-video generation</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-600">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>Motion effects and animations</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-600">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>Video ad templates</span>
                  </div>
                </div>
                <button className="mt-8 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all">
                  Generate Videos
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Image Generation Section - Only shown when mode is 'image' */}
      {generationMode === 'image' && (
        <>
          {/* Back button to switch mode */}
          <div className="mb-6">
            <button
              onClick={() => handleModeSelect(null)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <span className="text-lg">←</span>
              <span>Back to options</span>
            </button>
          </div>

          {/* Product Asset Upload Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">
              Generate AI Images for Your Campaign
            </h2>

            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-dashed border-slate-300 p-8">
              {!uploadedImage ? (
                <div
                  className="flex flex-col items-center justify-center py-12 cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center mb-6">
                    <ImageIcon className="w-12 h-12 text-blue-600" />
                  </div>

                  <h3 className="text-2xl font-semibold text-slate-800 mb-2">
                    Upload Your Product Image
                  </h3>

                  <p className="text-slate-600 text-center mb-6 max-w-md">
                    Upload a clear image of your product. Our AI will generate creative ad variations based on your specifications.
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

                  {/* Ad Type Input - REQUIRED */}
                  <div className="w-full max-w-md mb-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      What type of ads do you want to generate? <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={adTypeInput}
                      onChange={(e) => setAdTypeInput(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="e.g., Social media ads, banner ads, product showcase, promotional posters"
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Be specific about the type of advertisements you want (Required)
                    </p>
                  </div>

                  <button
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold hover:opacity-90 transition-all shadow-md disabled:opacity-50"
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Choose Image'}
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
                    disabled={uploading}
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
                        onClick={handleRemoveFile}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-md"
                        disabled={isGenerating}
                      >
                        <X className="w-5 h-5 text-slate-700" />
                      </button>
                    </div>

                    {/* Upload Details */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 mb-4">
                        Ready to Generate!
                      </h3>

                      {selectedGoal && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <p className="text-blue-800 font-medium">
                            Campaign Goal: <span className="font-bold capitalize">{selectedGoal}</span>
                          </p>
                          <p className="text-blue-600 text-sm mt-1">
                            AI will generate images optimized for {selectedGoal} campaigns
                          </p>
                        </div>
                      )}

                      {/* Ad Type Input (Editable) */}
                      <div className="mb-4 p-4 bg-slate-50 rounded-xl">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Ad Type <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={adTypeInput}
                          onChange={(e) => setAdTypeInput(e.target.value)}
                          placeholder="e.g., Social media ads, banner ads, product showcase"
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                          disabled={isGenerating}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Specify the type of ads for best results
                        </p>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <span className="text-slate-600">Image Status</span>
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                            {uploading ? 'Uploading...' : 'Ready'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-slate-600 text-sm mb-1">AI Model</p>
                            <p className="font-semibold text-slate-800">Runway Gen4 Turbo</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-slate-600 text-sm mb-1">Variations</p>
                            <p className="font-semibold text-slate-800">5 Images</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {isGenerating && (
                          <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex justify-between text-sm text-slate-600 mb-2">
                              <span>{generationStatus}</span>
                              <span>{generationProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                              <div
                                className="h-2.5 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-cyan-600"
                                style={{ width: `${generationProgress}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                              This may take 30-60 seconds...
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={handleGenerateAssets}
                          disabled={isGenerating || uploading || !adTypeInput.trim()}
                          className="flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGenerating ? (
                            <>
                              <Loader className="w-5 h-5 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5" />
                              Generate AI Images
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isGenerating || uploading}
                          className="px-6 py-4 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all disabled:opacity-50"
                        >
                          Change Image
                        </button>
                      </div>

                      {!adTypeInput.trim() && (
                        <p className="mt-4 text-sm text-orange-600 font-medium">
                          ⚠️ Please specify the type of ads before generating
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI-Generated Creative Assets */}
          {hasGenerated && generatedImageAssets.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800">AI-Generated Images</h2>
                  <p className="text-slate-600 mt-2">
                    Generated {generatedImageAssets.length} variations for: <span className="font-medium text-blue-600">{adTypeInput}</span>
                  </p>
                </div>
                <button
                  onClick={handleGenerateAssets}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all shadow-md disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate More
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {generatedImageAssets.map((asset) => (
                  <motion.div
                    key={asset.id}
                    whileHover={{ y: -4 }}
                    className="relative group"
                  >
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img
                        src={asset.image_url}
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
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/90 text-slate-900 hover:bg-white'
                            }`}
                          >
                            {selectedAssets.includes(asset.id) ? 'Selected ✓' : 'Select'}
                          </button>
                          <button
                            onClick={() => downloadAsset(asset.image_url, asset.title)}
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
                      <p className="text-blue-600 text-sm mb-2">{asset.type}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 capitalize">
                          {selectedGoal || 'Generic'} Campaign
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          Runway Gen4
                        </span>
                      </div>
                      {asset.prompt && (
                        <p className="text-slate-500 text-xs mt-2 line-clamp-2 italic">
                          "{asset.prompt.substring(0, 100)}..."
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Selected Assets Summary */}
              {selectedAssets.length > 0 && (
                <div className="mb-8 p-6 rounded-2xl border bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-blue-900 mb-1">
                        {selectedAssets.length} Image{selectedAssets.length !== 1 ? 's' : ''} Selected
                      </h3>
                      <p className="text-blue-700">
                        Ready to use in your campaign. You can download or save your selections.
                      </p>
                    </div>
                    <button
                      onClick={saveSelectedAssets}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white font-semibold rounded-lg transition-all"
                    >
                      Save & Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Creative Recommendations */}
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-800">Performance Insights</h3>
                  <span className="text-sm px-3 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">
                    {selectedGoal || 'Generic'} Campaign
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
              </div>
            </>
          )}
        </>
      )}

      {/* Video Generation Section - Only shown when mode is 'video' */}
      {generationMode === 'video' && (
        <>
          {/* Back button to switch mode */}
          <div className="mb-6">
            <button
              onClick={() => handleModeSelect(null)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <span className="text-lg">←</span>
              <span>Back to options</span>
            </button>
          </div>

          {/* Video Generation Section - Simplified UI */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">
              Generate AI Videos for Your Campaign
            </h2>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-dashed border-purple-300 p-8">
              {!uploadedImage ? (
                <div
                  className="flex flex-col items-center justify-center py-12 cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mb-6">
                    <Video className="w-12 h-12 text-purple-600" />
                  </div>

                  <h3 className="text-2xl font-semibold text-slate-800 mb-2">
                    Upload Your Product Image for Video Generation
                  </h3>

                  <p className="text-slate-600 text-center mb-6 max-w-md">
                    Upload a clear image of your product. Our AI will transform it into engaging video content for your campaign.
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

                  <button
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:opacity-90 transition-all shadow-md disabled:opacity-50"
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Choose Image'}
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
                    disabled={uploading}
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Uploaded Image Preview */}
                    <div className="relative w-full md:w-1/3">
                      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                        <img
                          src={uploadedImage}
                          alt="Uploaded product for video generation"
                          className="w-full h-full object-cover"
                        />
                        {/* Video overlay indicator */}
                        <div className="absolute inset-0 bg-purple-900/20 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-purple-600/80 backdrop-blur-sm flex items-center justify-center">
                            <Video className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleRemoveFile}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-md"
                      >
                        <X className="w-5 h-5 text-slate-700" />
                      </button>
                    </div>

                    {/* Video Generation Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 mb-4">
                        Image Ready for Video Generation
                      </h3>

                      <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 mb-6">
                        <h4 className="font-semibold text-purple-900 mb-3">Video Generation Coming Soon</h4>
                        <p className="text-purple-700 mb-4">
                          The video generation feature is currently under development. We're working hard to bring you AI-powered video creation capabilities.
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-purple-600">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-sm">Image-to-video conversion</span>
                          </div>
                          <div className="flex items-center gap-2 text-purple-600">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-sm">Motion effects and animations</span>
                          </div>
                          <div className="flex items-center gap-2 text-purple-600">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-sm">Multiple video templates</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          disabled
                          className="flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold transition-all shadow-md opacity-50 cursor-not-allowed"
                        >
                          <Video className="w-5 h-5" />
                          Generate Videos (Coming Soon)
                        </button>

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-6 py-4 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all"
                        >
                          Change Image
                        </button>
                      </div>

                      <p className="mt-4 text-sm text-purple-600">
                        ⚡ Switch to "Generate Images" for immediate AI-powered creative asset generation.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CreativeAssetsStep;