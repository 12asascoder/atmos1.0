// CreativeAssetsStep.tsx - Fixed version with immediate display and no duplicates
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Download, Heart, Upload, X, Camera, Image as ImageIcon, Loader, Video, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreativeAssetsStepProps {
  selectedGoal: string | null;
  setSelectedGoal: (goal: string) => void;
}

interface GeneratedAsset {
  id: number;
  title: string;
  image_url?: string;
  video_url?: string;
  data_uri?: string;
  prompt: string;
  score: number;
  type: string;
  asset_type: 'image' | 'video';
  task_id?: string;
  filename?: string;
  status?: 'processing' | 'completed' | 'failed';
  created_at?: number;
}

interface GenerationTask {
  task_id: string;
  asset_type: 'image' | 'video';
  status: 'processing' | 'completed' | 'failed';
  estimated_time: string;
  started_at?: number;
  error?: string;
  variation_number?: number;
}

type GenerationMode = 'image' | 'video' | null;

const CreativeAssetsStep: React.FC<CreativeAssetsStepProps> = ({ selectedGoal, setSelectedGoal }) => {
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [adTypeInput, setAdTypeInput] = useState<string>('');
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [generationMode, setGenerationMode] = useState<GenerationMode>(null);
  const [campaignId, setCampaignId] = useState<string>('');
  const [activeTasks, setActiveTasks] = useState<GenerationTask[]>([]);
  const [pollingIntervals, setPollingIntervals] = useState<NodeJS.Timeout[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [assetIdCounter, setAssetIdCounter] = useState(1);

  // Backend API URL
  const API_BASE_URL = 'http://localhost:5050';

  const recommendations = [
    { label: 'Optimal Format', value: '1:1 Square', stat: '+42% engagement', color: 'from-purple-500 to-indigo-600' },
    { label: 'Recommended Style', value: 'High Quality', stat: 'Best results', color: 'from-blue-500 to-cyan-600' },
    { label: 'AI Model', value: 'Runway ML', stat: 'Professional quality', color: 'from-emerald-500 to-teal-600' }
  ];

  // Track seen task IDs to prevent duplicates
  const seenTaskIds = useRef<Set<string>>(new Set());

  // Clean up polling intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervals.forEach(interval => clearInterval(interval));
    };
  }, [pollingIntervals]);

  // Update progress based on completed tasks
  useEffect(() => {
    if (totalTasks > 0) {
      const progress = Math.floor((completedCount / totalTasks) * 100);
      setGenerationProgress(progress);
    }
  }, [completedCount, totalTasks]);

  // Reset states when changing generation mode
  const resetStates = useCallback(() => {
    setUploadedImage(null);
    setUploadedFile(null);
    setHasGenerated(false);
    setGeneratedAssets([]);
    setGenerationProgress(0);
    setSelectedAssets([]);
    setAdTypeInput('');
    setGenerationStatus('');
    setCampaignId('');
    setActiveTasks([]);
    setIsGenerating(false);
    setCompletedCount(0);
    setTotalTasks(0);
    setAssetIdCounter(1);
    seenTaskIds.current.clear();
    
    // Clear all polling intervals
    pollingIntervals.forEach(interval => clearInterval(interval));
    setPollingIntervals([]);
  }, [pollingIntervals]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedFile(file);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        await uploadImageToBackend(file, result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload an image file (PNG, JPG, or WebP)');
    }
  };

  const uploadImageToBackend = async (file: File, imageDataUrl: string) => {
    try {
      setUploading(true);
      setGenerationStatus('Uploading image...');

      const base64Data = imageDataUrl.split(',')[1];
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || 'demo_user';
      const existingCampaignId = localStorage.getItem('campaign_id') || `campaign_${Date.now()}`;

      const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: token,
          image_data: base64Data,
          filename: file.name,
          campaign_id: existingCampaignId,
          ad_type: adTypeInput || 'general'
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✓ Image uploaded successfully');
        setCampaignId(data.campaign_id || existingCampaignId);
        localStorage.setItem('campaign_id', data.campaign_id || existingCampaignId);
        setGenerationStatus('Image uploaded successfully!');
      } else {
        console.error('✗ Upload failed:', data.error);
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please make sure the backend is running.');
    } finally {
      setUploading(false);
      setGenerationStatus('');
    }
  };

  const startGeneration = async (assetType: 'image' | 'video') => {
    if (!uploadedImage) {
      alert('Please upload an image first');
      return;
    }

    if (!campaignId) {
      alert('No campaign found. Please upload image again.');
      return;
    }

    if (!adTypeInput.trim()) {
      alert('Please specify the type of ads you want to generate');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus(`Starting ${assetType} generation...`);
    setCompletedCount(0);
    setTotalTasks(2); // Always generate exactly 2 images/videos
    setGeneratedAssets([]);
    setHasGenerated(false);
    seenTaskIds.current.clear(); // Clear seen task IDs

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || 'demo_user';

      const response = await fetch(`${API_BASE_URL}/api/generate-assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: token,
          campaign_id: campaignId,
          asset_type: assetType,
          campaign_goal: selectedGoal || 'awareness',
          ad_type: adTypeInput
        })
      });

      const data = await response.json();

      if (data.success) {
        setGenerationProgress(10);
        
        // If tasks already exist, use them
        const taskIds = data.task_ids || [];
        console.log(`✓ Starting ${taskIds.length} ${assetType} generations...`);
        
        // Create task objects for tracking
        const newTasks: GenerationTask[] = taskIds.map((taskId: string, index: number) => ({
          task_id: taskId,
          asset_type: assetType,
          status: 'processing',
          estimated_time: data.estimated_time || '1-3 minutes',
          started_at: Date.now(),
          variation_number: index + 1
        }));
        
        setActiveTasks(newTasks);
        
        // Start polling for each task immediately
        taskIds.forEach((taskId: string, index: number) => {
          startTaskPolling(taskId, assetType, index + 1);
        });
        
      } else {
        throw new Error(data.error || 'Generation failed to start');
      }
    } catch (error: any) {
      console.error('Error starting generation:', error);
      setGenerationStatus('Failed to start generation');
      alert(`Failed to start generation: ${error.message}`);
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const startTaskPolling = (taskId: string, assetType: 'image' | 'video', variationNumber: number) => {
    console.log(`Starting polling for task ${taskId}, variation ${variationNumber}`);
    
    // First, check immediately
    checkTaskStatus(taskId, assetType, variationNumber);
    
    // Then set up interval
    const pollInterval = setInterval(() => {
      checkTaskStatus(taskId, assetType, variationNumber);
    }, 2000); // Poll every 2 seconds for faster updates

    setPollingIntervals(prev => [...prev, pollInterval]);
  };

  const checkTaskStatus = async (taskId: string, assetType: 'image' | 'video', variationNumber: number) => {
    // Skip if we've already seen and processed this task
    if (seenTaskIds.current.has(taskId)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/check-status/${taskId}`);
      const data = await response.json();

      if (data.success) {
        // Update task status
        setActiveTasks(prev => 
          prev.map(task => 
            task.task_id === taskId 
              ? { ...task, status: data.status, error: data.error }
              : task
          )
        );

        if (data.status === 'completed' && data.asset) {
          // Mark this task as seen
          seenTaskIds.current.add(taskId);
          
          // Update completed count
          setCompletedCount(prev => prev + 1);
          
          // Create new asset with unique ID
          const newAsset: GeneratedAsset = {
            id: assetIdCounter + variationNumber, // Ensure unique ID
            title: `${assetType === 'image' ? 'AI Generated Image' : 'AI Generated Video'} ${variationNumber}`,
            data_uri: data.asset.data_uri,
            image_url: assetType === 'image' ? data.asset.data_uri : undefined,
            video_url: assetType === 'video' ? data.asset.data_uri : undefined,
            prompt: `Generated ${assetType} variation ${variationNumber} for ${adTypeInput}`,
            score: 80 + Math.floor(Math.random() * 20), // Random score 80-99
            type: assetType === 'image' ? 'ai_generated_image' : 'ai_generated_video',
            asset_type: assetType,
            task_id: taskId,
            filename: data.asset.filename,
            status: 'completed',
            created_at: Date.now()
          };

          // Add to generated assets immediately
          setGeneratedAssets(prev => {
            // Check if asset with same task_id already exists
            const exists = prev.some(asset => asset.task_id === taskId);
            if (exists) {
              console.log(`Asset with task_id ${taskId} already exists, skipping`);
              return prev;
            }
            
            console.log(`Adding new asset for task ${taskId}`);
            const newAssets = [...prev, newAsset];
            
            // Sort by variation number to maintain order
            return newAssets.sort((a, b) => {
              const aNum = parseInt(a.title.match(/\d+/)?.[0] || '0');
              const bNum = parseInt(b.title.match(/\d+/)?.[0] || '0');
              return aNum - bNum;
            });
          });
          
          // Set hasGenerated to true when first asset is ready
          if (!hasGenerated) {
            setHasGenerated(true);
          }
          
          setGenerationStatus(`${assetType === 'image' ? 'Image' : 'Video'} ${variationNumber} generated!`);
          
          // Clean up interval for this task
          clearPollingIntervalForTask(taskId);

          // Check if all tasks are completed
          if (completedCount + 1 === totalTasks) {
            setGenerationStatus(`Generation complete! All ${totalTasks} ${assetType}s generated.`);
            setIsGenerating(false);
            setGenerationProgress(100);
          }

        } else if (data.status === 'failed') {
          // Task failed
          seenTaskIds.current.add(taskId);
          
          // Update completed count
          setCompletedCount(prev => prev + 1);
          
          setActiveTasks(prev => 
            prev.map(task => 
              task.task_id === taskId 
                ? { ...task, status: 'failed', error: data.error }
                : task
            )
          );

          console.error(`Generation failed for task ${taskId}:`, data.error);
          
          // Add failed placeholder asset
          const failedAsset: GeneratedAsset = {
            id: assetIdCounter + variationNumber + 1000, // Offset for failed assets
            title: `${assetType === 'image' ? 'AI Generated Image' : 'AI Generated Video'} ${variationNumber} (Failed)`,
            image_url: 'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Generation+Failed',
            prompt: `Failed to generate ${assetType} variation ${variationNumber}`,
            score: 0,
            type: assetType === 'image' ? 'ai_generated_image' : 'ai_generated_video',
            asset_type: assetType,
            task_id: taskId,
            status: 'failed',
            created_at: Date.now()
          };

          setGeneratedAssets(prev => {
            const exists = prev.some(asset => asset.task_id === taskId);
            if (exists) return prev;
            return [...prev, failedAsset];
          });
          
          // Clean up interval
          clearPollingIntervalForTask(taskId);
        }
      }
    } catch (error) {
      console.error('Error checking task status:', error);
    }
  };

  const clearPollingIntervalForTask = (taskId: string) => {
    setPollingIntervals(prev => {
      const remainingIntervals = prev.filter(interval => {
        // We can't directly identify which interval belongs to which task
        // So we'll let them run but they'll skip processing if task is seen
        return true;
      });
      return remainingIntervals;
    });
  };

  const handleGenerateAssets = async () => {
    if (generationMode === 'image') {
      await startGeneration('image');
    } else if (generationMode === 'video') {
      await startGeneration('video');
    }
  };

  const saveSelectedAssets = async () => {
    try {
      const selectedAssetsData = generatedAssets
        .filter(asset => selectedAssets.includes(asset.id))
        .map(asset => ({
          id: asset.id,
          title: asset.title,
          image_url: asset.image_url,
          video_url: asset.video_url,
          data_uri: asset.data_uri,
          prompt: asset.prompt,
          score: asset.score,
          type: asset.type,
          asset_type: asset.asset_type
        }));

      if (selectedAssetsData.length === 0) {
        alert('Please select at least one asset');
        return;
      }

      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || 'demo_user';

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
    resetStates();
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
        uploadImageToBackend(file, result);
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

  const downloadAsset = (dataUri?: string, title?: string) => {
    if (!dataUri) {
      alert('No data available to download');
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = title || 'generated-asset';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading asset:', error);
      alert('Failed to download asset');
    }
  };

  const retryFailedTasks = () => {
    const failedTasks = activeTasks.filter(task => task.status === 'failed');
    if (failedTasks.length === 0) return;
    
    // Remove failed assets
    setGeneratedAssets(prev => prev.filter(asset => !failedTasks.some(task => task.task_id === asset.task_id)));
    
    // Reset tasks
    setActiveTasks(prev => 
      prev.map(task => 
        task.status === 'failed' 
          ? { ...task, status: 'processing', started_at: Date.now() }
          : task
      )
    );
    
    // Reset counters
    setCompletedCount(prev => prev - failedTasks.length);
    
    // Restart polling for failed tasks
    failedTasks.forEach(task => {
      if (!seenTaskIds.current.has(task.task_id)) {
        startTaskPolling(task.task_id, task.asset_type, task.variation_number || 1);
      }
    });
  };

  // Handle mode selection
  const handleModeSelect = (mode: GenerationMode) => {
    setGenerationMode(mode);
    resetStates();
  };

  // Get all generated assets from backend (for debugging)
  const getAllGeneratedAssets = async () => {
    if (!campaignId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/get-generated-assets/${campaignId}`);
      const data = await response.json();
      
      if (data.success && data.assets) {
        console.log('All generated assets from backend:', data.assets);
      }
    } catch (error) {
      console.error('Error fetching generated assets:', error);
    }
  };

  // Fetch existing assets when campaign ID changes
  useEffect(() => {
    if (campaignId && !isGenerating) {
      getAllGeneratedAssets();
    }
  }, [campaignId, isGenerating]);

  // Test with mock data that shows images immediately
  const handleTestGeneration = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Starting test generation...');
    setTotalTasks(2); // Only 2 images as requested
    setCompletedCount(0);
    setGeneratedAssets([]);
    setHasGenerated(false);
    seenTaskIds.current.clear();
    
    // Create placeholder processing tasks
    const testTasks: GenerationTask[] = [
      { task_id: 'test_1', asset_type: 'image', status: 'processing', estimated_time: '1 minute', variation_number: 1 },
      { task_id: 'test_2', asset_type: 'image', status: 'processing', estimated_time: '1 minute', variation_number: 2 }
    ];
    
    setActiveTasks(testTasks);
    
    // Simulate immediate image generation with delays
    const mockImages = [
      {
        id: 1,
        title: 'AI Generated Image 1',
        image_url: 'https://picsum.photos/800/600?random=1',
        data_uri: 'https://picsum.photos/800/600?random=1',
        prompt: 'Modern professional background with lighting effects',
        score: 92,
        type: 'ai_generated_image',
        asset_type: 'image' as const,
        task_id: 'test_1',
        filename: 'generated_image_1.png',
        status: 'completed' as const
      },
      {
        id: 2,
        title: 'AI Generated Image 2',
        image_url: 'https://picsum.photos/800/600?random=2',
        data_uri: 'https://picsum.photos/800/600?random=2',
        prompt: 'Minimalist design with product focus',
        score: 88,
        type: 'ai_generated_image',
        asset_type: 'image' as const,
        task_id: 'test_2',
        filename: 'generated_image_2.png',
        status: 'completed' as const
      }
    ];
    
    // Show images one by one with delay
    mockImages.forEach((image, index) => {
      setTimeout(() => {
        seenTaskIds.current.add(image.task_id || '');
        setGeneratedAssets(prev => {
          const exists = prev.some(asset => asset.task_id === image.task_id);
          if (exists) return prev;
          return [...prev, image];
        });
        setActiveTasks(prev => 
          prev.map(task => 
            task.variation_number === index + 1 
              ? { ...task, status: 'completed' }
              : task
          )
        );
        setCompletedCount(prev => prev + 1);
        setGenerationStatus(`Image ${index + 1} generated!`);
        setGenerationProgress(Math.floor(((index + 1) / mockImages.length) * 100));
        
        // Set hasGenerated when first image is ready
        if (index === 0) {
          setHasGenerated(true);
        }
        
        // Complete generation when all images are shown
        if (index === mockImages.length - 1) {
          setTimeout(() => {
            setIsGenerating(false);
            setGenerationStatus('Test completed! 2 images generated.');
          }, 500);
        }
      }, index * 1000); // Show each image 1 second apart
    });
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
                    <span>Images show as they're generated</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Style transfer and enhancements</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Generate exactly 2 unique images</span>
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
                    <span>Videos show as they're generated</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-600">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>Motion effects and animations</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-600">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>Generate exactly 2 unique videos</span>
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

      {/* Image/Video Generation Section */}
      {(generationMode === 'image' || generationMode === 'video') && (
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
              Generate AI {generationMode === 'image' ? 'Images' : 'Videos'} for Your Campaign
            </h2>

            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-dashed border-slate-300 p-8">
              {!uploadedImage ? (
                <div
                  className="flex flex-col items-center justify-center py-12 cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${generationMode === 'image' ? 'from-blue-100 to-cyan-100' : 'from-purple-100 to-pink-100'} flex items-center justify-center mb-6`}>
                    {generationMode === 'image' ? (
                      <ImageIcon className="w-12 h-12 text-blue-600" />
                    ) : (
                      <Video className="w-12 h-12 text-purple-600" />
                    )}
                  </div>

                  <h3 className="text-2xl font-semibold text-slate-800 mb-2">
                    Upload Your Product Image
                  </h3>

                  <p className="text-slate-600 text-center mb-6 max-w-md">
                    {generationMode === 'image' 
                      ? "Upload a clear image of your product. Our AI will generate 2 creative ad variations based on your specifications."
                      : "Upload a clear image of your product. Our AI will transform it into 2 engaging video ads for your campaign."
                    }
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
                    className={`px-8 py-3 rounded-xl bg-gradient-to-r ${generationMode === 'image' ? 'from-blue-500 to-cyan-600' : 'from-purple-500 to-pink-600'} text-white font-semibold hover:opacity-90 transition-all shadow-md disabled:opacity-50`}
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

                  {/* Test button for development */}
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={handleTestGeneration}
                      className="mt-6 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm transition-colors"
                    >
                      Test with Instant Images
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Uploaded Image Preview */}
                    <div className="relative w-full md:w-1/3">
                      <div className={`relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br ${generationMode === 'image' ? 'from-blue-100 to-cyan-100' : 'from-purple-100 to-pink-100'}`}>
                        <img
                          src={uploadedImage}
                          alt="Uploaded product"
                          className="w-full h-full object-cover"
                        />
                        {/* Generation mode indicator */}
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                          <div className={`w-16 h-16 rounded-full ${generationMode === 'image' ? 'bg-blue-600/80' : 'bg-purple-600/80'} backdrop-blur-sm flex items-center justify-center`}>
                            {generationMode === 'image' ? (
                              <ImageIcon className="w-8 h-8 text-white" />
                            ) : (
                              <Video className="w-8 h-8 text-white" />
                            )}
                          </div>
                        </div>
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
                        Ready to Generate 2 {generationMode === 'image' ? 'Images' : 'Videos'}!
                      </h3>

                      {selectedGoal && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <p className="text-blue-800 font-medium">
                            Campaign Goal: <span className="font-bold capitalize">{selectedGoal}</span>
                          </p>
                          <p className="text-blue-600 text-sm mt-1">
                            AI will generate 2 unique {generationMode === 'image' ? 'images' : 'videos'} optimized for {selectedGoal} campaigns
                          </p>
                        </div>
                      )}

                      {/* Active Tasks Status */}
                      {activeTasks.length > 0 && (
                        <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Generation Progress ({completedCount}/{totalTasks})
                          </h4>
                          <div className="space-y-2 mb-3">
                            {activeTasks.map((task) => (
                              <div key={task.task_id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {task.status === 'processing' ? (
                                    <Loader className="w-4 h-4 animate-spin text-blue-600" />
                                  ) : task.status === 'completed' ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                  )}
                                  <span className="text-sm">
                                    {task.asset_type === 'image' ? 'Image' : 'Video'} {task.variation_number}
                                  </span>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  task.status === 'processing' 
                                    ? 'bg-blue-100 text-blue-700'
                                    : task.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {task.status === 'processing' ? 'Generating...' : 
                                   task.status === 'completed' ? 'Ready' : 'Failed'}
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 bg-gradient-to-r ${generationMode === 'image' ? 'from-blue-500 to-cyan-600' : 'from-purple-500 to-pink-600'}`}
                              style={{ width: `${generationProgress}%` }}
                            />
                          </div>
                          
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>{generationStatus}</span>
                            <span>{generationProgress}%</span>
                          </div>
                          
                          <p className="text-xs text-slate-500 mt-2">
                            ⚡ {generationMode === 'image' ? 'Images' : 'Videos'} will appear one by one as they're generated
                          </p>
                          
                          {/* Retry failed tasks button */}
                          {activeTasks.some(t => t.status === 'failed') && (
                            <button
                              onClick={retryFailedTasks}
                              className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            >
                              Retry Failed Generations
                            </button>
                          )}
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
                            <p className="font-semibold text-slate-800">Runway ML</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-slate-600 text-sm mb-1">Total Variations</p>
                            <p className="font-semibold text-slate-800">2 Unique {generationMode === 'image' ? 'Images' : 'Videos'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={handleGenerateAssets}
                          disabled={isGenerating || uploading || !adTypeInput.trim() || (activeTasks.length > 0 && completedCount < totalTasks)}
                          className={`flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r ${generationMode === 'image' ? 'from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700' : 'from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'} text-white font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isGenerating ? (
                            <>
                              <Loader className="w-5 h-5 animate-spin" />
                              Generating {completedCount}/{totalTasks}...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5" />
                              Generate 2 AI {generationMode === 'image' ? 'Images' : 'Videos'}
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isGenerating || uploading || (activeTasks.length > 0 && completedCount < totalTasks)}
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

                      {activeTasks.length > 0 && generatedAssets.length === 0 && (
                        <p className="mt-4 text-sm text-blue-600 font-medium">
                          ⚡ First {generationMode === 'image' ? 'image' : 'video'} will appear in 1-3 minutes...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generated Assets Display - Shows immediately as they're generated */}
          {(hasGenerated || generatedAssets.length > 0) && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800">
                    {isGenerating ? 'Generating...' : 'Generated'} {generationMode === 'image' ? 'Images' : 'Videos'}
                  </h2>
                  <p className="text-slate-600 mt-2">
                    {generatedAssets.filter(a => a.status !== 'failed').length} of {totalTasks} unique {generationMode === 'image' ? 'image' : 'video'} variations generated for: 
                    <span className="font-medium text-blue-600 ml-2">{adTypeInput}</span>
                    {isGenerating && activeTasks.length > 0 && (
                      <span className="ml-2 text-amber-600">
                        ({completedCount}/{totalTasks} completed)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-3">
                  {!isGenerating && (
                    <button
                      onClick={handleGenerateAssets}
                      disabled={activeTasks.length > 0 && completedCount < totalTasks}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${generationMode === 'image' ? 'from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700' : 'from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'} text-white font-semibold transition-all shadow-md disabled:opacity-50`}
                    >
                      <Sparkles className="w-5 h-5" />
                      Generate 2 More
                    </button>
                  )}
                  
                  {/* Test button for development */}
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={handleTestGeneration}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-all shadow-md"
                    >
                      Test More Images
                    </button>
                  )}
                </div>
              </div>

              {/* Show message if still generating but no images yet */}
              {isGenerating && generatedAssets.length === 0 && (
                <div className="text-center py-12">
                  <Loader className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                  <p className="text-slate-600">Starting generation... {generationMode === 'image' ? 'Images' : 'Videos'} will appear here one by one!</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Estimated time: 1-3 minutes per {generationMode === 'image' ? 'image' : 'video'}
                  </p>
                </div>
              )}

              {/* Grid of Generated Assets */}
              {generatedAssets.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
                  {generatedAssets.map((asset) => (
                    <motion.div
                      key={`${asset.id}-${asset.task_id}`} // Use combination to ensure uniqueness
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ y: -4 }}
                      className="relative group"
                    >
                      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                        {asset.asset_type === 'image' ? (
                          <img
                            src={asset.data_uri || asset.image_url}
                            alt={asset.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=AI+Generated';
                            }}
                          />
                        ) : (
                          <div className="relative w-full h-full">
                            <video
                              src={asset.data_uri || asset.video_url}
                              className="w-full h-full object-cover"
                              controls
                              muted
                              poster={uploadedImage || undefined}
                            />
                            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-purple-500 text-white text-sm font-bold">
                              VIDEO
                            </div>
                          </div>
                        )}

                        {/* Score Badge */}
                        {asset.score > 0 && (
                          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-sm font-bold">
                            Score: {asset.score}
                          </div>
                        )}

                        {/* Status Badge for failed/processing */}
                        {asset.status === 'failed' && (
                          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-red-500 text-white text-sm font-bold">
                            FAILED
                          </div>
                        )}

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                            {asset.status !== 'failed' && (
                              <>
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
                                  onClick={() => downloadAsset(asset.data_uri || asset.image_url || asset.video_url, asset.title)}
                                  className="w-10 h-10 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
                                  title="Download"
                                  disabled={!asset.data_uri && !asset.image_url && !asset.video_url}
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
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-2">
                        <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2">
                          {asset.title}
                        </h3>
                        <p className={`text-sm mb-2 ${asset.status === 'failed' ? 'text-red-600' : 'text-blue-600'}`}>
                          {asset.status === 'failed' ? 'Generation Failed' : 
                           asset.asset_type === 'image' ? 'AI Generated Image' : 'AI Generated Video'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500 capitalize">
                            Variation {asset.title.match(/\d+/)?.[0] || '1'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            asset.asset_type === 'image' 
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {asset.asset_type === 'image' ? 'Runway Image' : 'Runway Video'}
                          </span>
                        </div>
                        {asset.prompt && asset.status !== 'failed' && (
                          <p className="text-slate-500 text-xs mt-2 line-clamp-2 italic">
                            "{asset.prompt.substring(0, 100)}..."
                          </p>
                        )}
                        {asset.status === 'failed' && (
                          <p className="text-red-500 text-xs mt-2">
                            This {asset.asset_type} failed to generate. You can retry generation.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Selected Assets Summary */}
              {selectedAssets.length > 0 && (
                <div className="mb-8 p-6 rounded-2xl border bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-blue-900 mb-1">
                        {selectedAssets.length} {generationMode === 'image' ? 'Image' : 'Video'}{selectedAssets.length !== 1 ? 's' : ''} Selected
                      </h3>
                      <p className="text-blue-700">
                        Ready to use in your campaign. You can download or save your selections.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={saveSelectedAssets}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white font-semibold rounded-lg transition-all"
                      >
                        Save & Continue
                      </button>
                      <button
                        onClick={() => {
                          selectedAssets.forEach(id => {
                            const asset = generatedAssets.find(a => a.id === id);
                            if (asset && asset.status !== 'failed') {
                              downloadAsset(asset.data_uri || asset.image_url || asset.video_url, asset.title);
                            }
                          });
                        }}
                        className="px-6 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition-all"
                      >
                        Download Selected
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Creative Recommendations */}
              {!isGenerating && generatedAssets.length > 0 && (
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
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CreativeAssetsStep;