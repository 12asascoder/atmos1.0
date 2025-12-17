import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  Eye, 
  Palette, 
  Users, 
  MessageSquare, 
  Target, 
  BarChart3,
  Heart,
  Shield,
  Clock,
  Zap,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader2,
  LucideIcon
} from 'lucide-react';
import {
  AnalysisResponse,
  RecentAnalysis,
  ColorPaletteItem,
  EmotionalTriggers,
  RecentAnalysesResponse
} from '../types/video-analysis';

const colors = {
  primary: {
    50: 'bg-cyan-50',
    100: 'bg-cyan-100',
    500: 'bg-cyan-500',
    600: 'bg-cyan-600',
    700: 'bg-cyan-700',
    text: 'text-cyan-700',
    textLight: 'text-cyan-600',
    textDark: 'text-cyan-800',
    border: 'border-cyan-200',
    borderHover: 'border-cyan-300',
    hover: 'hover:bg-cyan-600',
    gradient: 'from-cyan-500 to-teal-600'
  },
  accent: {
    50: 'bg-emerald-50',
    100: 'bg-emerald-100',
    500: 'bg-emerald-500',
    600: 'bg-emerald-600',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    gradient: 'from-emerald-500 to-teal-600'
  },
  neutral: {
    50: 'bg-slate-50',
    100: 'bg-slate-100',
    200: 'bg-slate-200',
    400: 'bg-slate-400',
    500: 'bg-slate-500',
    600: 'bg-slate-600',
    700: 'bg-slate-700',
    800: 'bg-slate-800',
    text: 'text-slate-700',
    textLight: 'text-slate-500',
    textDark: 'text-slate-800',
    border: 'border-slate-200',
    borderLight: 'border-slate-100',
    hover: 'hover:bg-slate-50'
  },
  success: {
    50: 'bg-emerald-50',
    500: 'bg-emerald-500',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  background: {
    primary: 'bg-white',
    secondary: 'bg-slate-50',
    gradient: 'bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50',
    card: 'bg-white',
    hover: 'hover:bg-slate-50'
  }
};

interface EmotionItem {
  key: keyof EmotionalTriggers;
  label: string;
  icon: LucideIcon;
  color: string;
}

const VideoAnalysis: React.FC = () => {
  const [videoPath, setVideoPath] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Fetch recent analyses on component mount
  useEffect(() => {
    fetchRecentAnalyses();
  }, []);

  const fetchRecentAnalyses = async (): Promise<void> => {
    try {
      const response = await fetch('http://localhost:5000/api/recent-analyses');
      const data: RecentAnalysesResponse = await response.json();
      if (data.success && data.analyses) {
        setRecentAnalyses(data.analyses);
      }
    } catch (error) {
      console.error('Failed to fetch recent analyses:', error);
    }
  };

  const handleAnalyze = async (): Promise<void> => {
    if (!videoPath.trim()) {
      setError('Please enter a video path');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video_path: videoPath }),
      });

      const data: AnalysisResponse = await response.json();

      if (data.success) {
        setAnalysis(data);
        setSuccess('Analysis completed successfully!');
        fetchRecentAnalyses(); // Refresh recent analyses
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (error) {
      setError('Network error. Please check if the backend server is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadAnalysis = async (analysisId: string): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:5000/api/analysis/${analysisId}`);
      const data: AnalysisResponse = await response.json();
      
      if (data.success) {
        setAnalysis(data);
        setSelectedAnalysis(analysisId);
        setSuccess(`Loaded analysis: ${analysisId}`);
      } else {
        setError('Failed to load analysis');
      }
    } catch (error) {
      setError('Failed to load analysis');
    }
  };

  const renderColorPalette = (palette: ColorPaletteItem[]): JSX.Element | null => {
    if (!palette || !Array.isArray(palette)) return null;
    
    return (
      <div className="flex flex-wrap gap-2">
        {palette.map((color: ColorPaletteItem, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg border border-slate-200"
              style={{ backgroundColor: color.hex }}
            />
            <span className="text-sm text-slate-600">
              {color.hex} ({(color.ratio * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderEmotionalTriggers = (triggers: EmotionalTriggers): JSX.Element | null => {
    if (!triggers) return null;
    
    const emotions: EmotionItem[] = [
      { key: 'excitement', label: 'Excitement', icon: Zap, color: 'yellow' },
      { key: 'trust', label: 'Trust', icon: Shield, color: 'blue' },
      { key: 'urgency', label: 'Urgency', icon: Clock, color: 'red' },
      { key: 'curiosity', label: 'Curiosity', icon: Eye, color: 'purple' },
      { key: 'desire', label: 'Desire', icon: Heart, color: 'pink' },
      { key: 'fear', label: 'Fear', icon: AlertCircle, color: 'orange' },
      { key: 'hope', label: 'Hope', icon: Sparkles, color: 'green' },
    ];
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {emotions.map((emotion: EmotionItem) => {
          const Icon = emotion.icon;
          const value = triggers[emotion.key] || 0;
          const colorClass = `text-${emotion.color}-500`;
          
          return (
            <div key={emotion.key} className={`p-4 rounded-xl border ${colors.neutral.border} bg-white`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${colorClass}`} />
                <span className="font-medium text-slate-700">{emotion.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r from-${emotion.color}-400 to-${emotion.color}-600 rounded-full`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-700">{value}%</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderScoreCard = (
    title: string, 
    score: number, 
    maxScore: number = 100, 
    icon?: LucideIcon
  ): JSX.Element => {
    const Icon = icon;
    const percentage = (score / maxScore) * 100;
    let colorClass = 'text-emerald-600 bg-emerald-50';
    
    if (percentage < 50) colorClass = 'text-red-600 bg-red-50';
    else if (percentage < 75) colorClass = 'text-yellow-600 bg-yellow-50';
    
    return (
      <div className="p-4 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-slate-600" />}
            <span className="font-medium text-slate-700">{title}</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${colorClass}`}>
            {score}/{maxScore}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${colors.primary.gradient} rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Video Analysis Dashboard
          </h1>
          <p className="text-slate-600">
            Analyze video content for creative insights, emotional triggers, and audience targeting
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls & Recent Analyses */}
          <div className="lg:col-span-1 space-y-6">
            {/* Analysis Input */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                New Analysis
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Video/Image Path
                  </label>
                  <input
                    type="text"
                    value={videoPath}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVideoPath(e.target.value)}
                    placeholder="e.g., /path/to/video.mp4"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-700"
                  />
                  <p className="text-sm text-slate-500 mt-2">
                    Enter full path to video or image file
                  </p>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    isAnalyzing
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : `bg-gradient-to-r ${colors.primary.gradient} text-white hover:shadow-lg hover:scale-[1.02]`
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Start Analysis
                    </>
                  )}
                </button>
              </div>

              {/* Messages */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-emerald-700">{success}</p>
                </div>
              )}
            </div>

            {/* Recent Analyses */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Analyses
              </h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentAnalyses.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No analyses yet</p>
                ) : (
                  recentAnalyses.map((item: RecentAnalysis) => (
                    <button
                      key={item.id}
                      onClick={() => handleLoadAnalysis(item.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedAnalysis === item.id
                          ? 'bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200'
                          : 'hover:bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700 truncate">
                          {item.id}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.file_type === 'video' 
                            ? 'bg-cyan-100 text-cyan-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.file_type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Analysis Results */}
          <div className="lg:col-span-2">
            {analysis ? (
              <div className="space-y-6">
                {/* Analysis Header */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {analysis.analysis_id}
                      </h2>
                      <p className="text-slate-600">
                        {analysis.file_type === 'video' ? 'Video Analysis' : 'Image Analysis'}
                      </p>
                    </div>
                    <div className="text-right">
                      {analysis.creative_report?.overall_score && (
                        <div className="text-3xl font-bold text-slate-900">
                          {analysis.creative_report.overall_score}/100
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Transcript Section */}
                {analysis.raw_analysis?.transcript?.text && (
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Transcript
                    </h3>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-h-60 overflow-y-auto">
                      <p className="text-slate-700 whitespace-pre-wrap">
                        {analysis.raw_analysis.transcript.text}
                      </p>
                    </div>
                    {analysis.raw_analysis.transcript.segments && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysis.raw_analysis.transcript.segments.slice(0, 4).map((segment, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="text-sm text-cyan-600 font-medium">
                              {segment.start?.toFixed(1)}s - {segment.end?.toFixed(1)}s
                            </div>
                            <p className="text-slate-700 text-sm mt-1">{segment.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Creative Report */}
                {analysis.creative_report && (
                  <>
                    {/* Scores */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderScoreCard(
                        'Opening Hook Strength',
                        analysis.creative_report.opening_hook?.strength_score || 0,
                        100,
                        Zap
                      )}
                      {renderScoreCard(
                        'Copy Quality',
                        analysis.creative_report.copy_quality_score || 0,
                        100,
                        MessageSquare
                      )}
                      {renderScoreCard(
                        'Visual Impact',
                        analysis.creative_report.visual_analysis?.visual_impact_score || 0,
                        100,
                        Eye
                      )}
                      {renderScoreCard(
                        'Pacing',
                        analysis.creative_report.pacing?.pacing_score || 0,
                        100,
                        Clock
                      )}
                    </div>

                    {/* Color Palette */}
                    {analysis.raw_analysis?.color_palette && (
                      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Palette className="w-5 h-5" />
                          Color Palette
                        </h3>
                        {renderColorPalette(analysis.raw_analysis.color_palette)}
                      </div>
                    )}

                    {/* Emotional Triggers */}
                    {analysis.creative_report.emotional_triggers && (
                      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Heart className="w-5 h-5" />
                          Emotional Triggers
                        </h3>
                        {renderEmotionalTriggers(analysis.creative_report.emotional_triggers)}
                      </div>
                    )}

                    {/* Face Detection */}
                    {analysis.raw_analysis?.face_detection && (
                      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Face Detection
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl border border-cyan-200">
                            <div className="text-3xl font-bold text-cyan-700 mb-1">
                              {analysis.raw_analysis.face_detection.unique_people_count}
                            </div>
                            <p className="text-sm text-cyan-600">Unique People</p>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl border border-cyan-200">
                            <div className="text-3xl font-bold text-cyan-700 mb-1">
                              {analysis.raw_analysis.face_detection.max_faces_in_single_frame}
                            </div>
                            <p className="text-sm text-cyan-600">Max Faces in Frame</p>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl border border-cyan-200">
                            <div className="text-3xl font-bold text-cyan-700 mb-1">
                              {analysis.raw_analysis.face_detection.frames_with_faces}
                            </div>
                            <p className="text-sm text-cyan-600">Frames with Faces</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* View Age Estimate */}
                    {analysis.creative_report.viewer_age_estimate && (
                      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Target Audience
                        </h3>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="text-2xl font-bold text-slate-900">
                                {analysis.creative_report.viewer_age_estimate.min} - {analysis.creative_report.viewer_age_estimate.max} years
                              </div>
                              <p className="text-slate-600">
                                Estimated target age range
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-emerald-600">
                                {analysis.creative_report.viewer_age_estimate.confidence}% confidence
                              </div>
                            </div>
                          </div>
                          <p className="text-slate-700">
                            {analysis.creative_report.viewer_age_estimate.reason}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center">
                    <Eye className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    No Analysis Yet
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Enter a video path and start your first analysis to see detailed insights here.
                  </p>
                  <div className="flex items-center justify-center gap-3 text-slate-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Transcript Analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Emotional Triggers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Face Detection</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAnalysis;