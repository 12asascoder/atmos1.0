import React, { useEffect, useState } from "react";
import { Eye, Users, Sparkles, ExternalLink, Loader2, AlertTriangle, Target, MessageSquare, Palette, Clock, Heart, Zap, TrendingUp, BarChart3, PlayCircle, Image as ImageIcon, Type, AlertCircle, CheckCircle, XCircle, Percent, Layers, Film, Award } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

/* -------------------- Supabase -------------------- */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hkgcyrheviatmdflbxqu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ2N5cmhldmlhdG1kZmxieHF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQwMzM0MSwiZXhwIjoyMDgxOTc5MzQxfQ.1KdXtpd4amyR7nOBZ4DNrE48fngV3tCHoLIqjxdrMu0';

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

/* -------------------- Types -------------------- */
interface InfluencerName {
  name: string;
  is_influencer: boolean;
  sources: string[];
}

interface PacingAnalysis {
  scene_count: number;
  duration_sec: number;
  pacing_score: number;
  hook_speed_sec: number;
  avg_scene_duration: number;
}

interface MediaAnalysisItem {
  media_type: string;
  file?: string;
  colors?: string[];
  mood?: string;
  mood_score?: number;
  pacing?: PacingAnalysis;
}

interface ValueProposition {
  urgency: boolean;
  benefits: string[];
}

interface Scores {
  cta_score: number;
  total_score: number;
  visual_score: number;
  text_quality_score: number;
  value_proposition_score: number;
}

interface AdAnalysis {
  scores: Scores;
  has_influencer: boolean;
  media_analysis: MediaAnalysisItem[];
  influencer_count: number;
  influencer_names: InfluencerName[];
  value_proposition: ValueProposition;
}

interface AdData {
  id: string;
  company: string;
  ad_title: string;
  ad_text: string;
  full_ad_text: string;
  call_to_action: string;
  ad_archive_id: string;
  analyzed_at: string;
  created_at: string;
  analysis: AdAnalysis;
  search_keyword?: string;
}

/* -------------------- Component -------------------- */
const VideoAnalysis: React.FC = () => {
  const [ads, setAds] = useState<AdData[]>([]);
  const [selectedAd, setSelectedAd] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("facebook_ads")
        .select("*")
        .not("analyzed_at", "is", null)
        .order("analyzed_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const safeData = (data || []).sort((a: AdData, b: AdData) => {
        const aScore = a.analysis?.scores?.total_score ?? 0;
        const bScore = b.analysis?.scores?.total_score ?? 0;
        return bScore - aScore;
      });

      setAds(safeData);

      // Extract unique search keywords
      const uniqueKeywords = Array.from(
        new Set(
          safeData
            .map(ad => ad.search_keyword)
            .filter(keyword => keyword)
        )
      ).sort();
      
      setSearchKeywords(uniqueKeywords);

      if (safeData.length > 0) {
        setSelectedAd(safeData[0]);
      }
    } catch (err: any) {
      console.error("❌ Fetch failed:", err);
      setError("Failed to load ads. Check Supabase config.");
    } finally {
      setLoading(false);
    }
  };

  const filteredAds = companyFilter === "all" 
    ? ads 
    : ads.filter(ad => ad.search_keyword === companyFilter);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-emerald-50 border-emerald-100";
    if (score >= 60) return "bg-amber-50 border-amber-100";
    return "bg-red-50 border-red-100";
  };

  const renderColorPalette = (colors: string[]) => {
    return (
      <div className="flex gap-2 flex-wrap">
        {colors.map((color, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-600 font-mono">{color}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading ads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-800 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Sparkles className="text-blue-600" />
                Ad Intelligence Dashboard
              </h1>
              <p className="text-gray-600">
                Comprehensive analysis of Facebook ads with AI-powered insights
              </p>
            </div>
            <button
              onClick={fetchAds}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
            >
              <Refresh className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <div className="flex items-center gap-4">
            <label className="text-gray-700 font-semibold whitespace-nowrap">
              Filter by Search Keyword:
            </label>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white min-w-[200px]"
            >
              <option value="all">All Keywords ({ads.length} ads)</option>
              {searchKeywords.map((keyword) => (
                <option key={keyword} value={keyword}>
                  {keyword} ({ads.filter(ad => ad.search_keyword === keyword).length})
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredAds.length} ads
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {!selectedAd ? (
        <div className="max-w-7xl mx-auto">
          {filteredAds.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-lg">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No ads found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAds.map((ad) => (
                <button
                  key={ad.id}
                  onClick={() => setSelectedAd(ad)}
                  className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-2xl hover:border-blue-300 transition-all text-left group"
                >
                  {/* Score Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                      ad.analysis?.scores?.total_score >= 80 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : ad.analysis?.scores?.total_score >= 60 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {ad.analysis?.scores?.total_score || 0}
                    </span>
                    <Sparkles className={`w-5 h-5 ${
                      ad.analysis?.scores?.total_score >= 80 ? 'text-emerald-500' : 'text-gray-400'
                    }`} />
                  </div>

                  {/* Company */}
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      {ad.company}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {ad.ad_title || 'Untitled Ad'}
                  </h3>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-600 mb-1">Visual Quality</div>
                      <div className="font-bold text-sm text-gray-900">{ad.analysis?.scores?.visual_score || 0}/100</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-600 mb-1">Text Quality</div>
                      <div className="font-bold text-sm text-gray-900">{ad.analysis?.scores?.text_quality_score || 0}/100</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-600 mb-1">CTA Score</div>
                      <div className="font-bold text-sm text-gray-900">{ad.analysis?.scores?.cta_score || 0}/100</div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex gap-2 flex-wrap mb-3">
                    {ad.analysis?.has_influencer && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        <Users className="w-3 h-3 inline mr-1" />
                        Influencer
                      </span>
                    )}
                    {ad.analysis?.value_proposition?.urgency && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        <Zap className="w-3 h-3 inline mr-1" />
                        Urgent
                      </span>
                    )}
                    {ad.analysis?.media_analysis?.some(m => m.media_type === 'video') && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        <PlayCircle className="w-3 h-3 inline mr-1" />
                        Video
                      </span>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="text-xs text-gray-500 border-t border-gray-200 pt-3">
                    <div>ID: {ad.ad_archive_id.slice(0, 12)}...</div>
                    <div>{new Date(ad.analyzed_at).toLocaleDateString()}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Detailed View */
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => setSelectedAd(null)}
            className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to All Ads
          </button>

          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
                  {selectedAd.company}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {selectedAd.ad_title}
                </h1>
                <div className="text-sm text-gray-500 space-y-1">
                  <div>ID: {selectedAd.ad_archive_id}</div>
                  <div>{new Date(selectedAd.analyzed_at).toLocaleString()}</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Overall Score</div>
                <div className={`text-5xl font-bold ${getScoreColor(selectedAd.analysis.scores.total_score)}`}>
                  {selectedAd.analysis.scores.total_score}/100
                </div>
                <a
                  href={`https://www.facebook.com/ads/library/?id=${selectedAd.ad_archive_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Original
                </a>
              </div>
            </div>
          </div>

          {/* Scores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <ScoreCard
              title="Visual Quality"
              score={selectedAd.analysis.scores.visual_score}
              icon={Eye}
              description="Color, mood, and visual appeal"
            />
            <ScoreCard
              title="Text Quality"
              score={selectedAd.analysis.scores.text_quality_score}
              icon={Type}
              description="Copy effectiveness and clarity"
            />
            <ScoreCard
              title="CTA Strength"
              score={selectedAd.analysis.scores.cta_score}
              icon={Target}
              description="Call-to-action effectiveness"
            />
            <ScoreCard
              title="Value Proposition"
              score={selectedAd.analysis.scores.value_proposition_score}
              icon={Award}
              description="Benefits and urgency"
            />
          </div>

          {/* Media Analysis */}
          {selectedAd.analysis.media_analysis.map((media, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                {media.media_type === 'video' ? (
                  <Film className="w-6 h-6 text-blue-600" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                )}
                {media.media_type.charAt(0).toUpperCase() + media.media_type.slice(1)} Analysis
              </h2>

              {media.mood && (
                <div className="mb-4">
                  <MetricCard
                    label="Mood"
                    value={`${media.mood} (${media.mood_score}/100)`}
                    icon={Palette}
                    score={media.mood_score}
                  />
                </div>
              )}

              {/* Color Palette */}
              {media.colors && media.colors.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-blue-600" />
                    Color Palette
                  </h3>
                  {renderColorPalette(media.colors)}
                </div>
              )}

              {/* Pacing Analysis */}
              {media.pacing && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Video Pacing Analysis
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <MetricCard
                      label="Scene Count"
                      value={media.pacing.scene_count}
                      icon={Layers}
                    />
                    <MetricCard
                      label="Duration"
                      value={`${media.pacing.duration_sec}s`}
                      icon={Clock}
                    />
                    <MetricCard
                      label="Pacing Score"
                      value={`${media.pacing.pacing_score}/100`}
                      icon={TrendingUp}
                      score={media.pacing.pacing_score}
                    />
                    <MetricCard
                      label="Hook Speed"
                      value={`${media.pacing.hook_speed_sec}s`}
                      icon={Zap}
                    />
                    <MetricCard
                      label="Avg Scene Duration"
                      value={`${media.pacing.avg_scene_duration.toFixed(1)}s`}
                      icon={BarChart3}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Value Proposition */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-600" />
              Value Proposition Analysis
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className={`p-4 rounded-lg border-2 ${
                selectedAd.analysis.value_proposition.urgency
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  {selectedAd.analysis.value_proposition.urgency ? (
                    <CheckCircle className="w-6 h-6 text-red-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-gray-400" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">Urgency Detected</h3>
                </div>
                <p className="text-gray-600">
                  {selectedAd.analysis.value_proposition.urgency
                    ? "Yes - creates urgency/scarcity"
                    : "No urgency indicators found"}
                </p>
                <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedAd.analysis.value_proposition.urgency
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {selectedAd.analysis.value_proposition.urgency ? (
                    <Zap className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>
              </div>

              {selectedAd.analysis.value_proposition.benefits.length > 0 ? (
                <div className="p-4 rounded-lg border-2 bg-emerald-50 border-emerald-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-emerald-600" />
                    Key Benefits Identified
                  </h3>
                  <ul className="space-y-2">
                    {selectedAd.analysis.value_proposition.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-4 rounded-lg border-2 bg-gray-50 border-gray-200 flex items-center justify-center">
                  <p className="text-gray-500 text-center">No clear benefits identified in this ad</p>
                </div>
              )}
            </div>
          </div>

          {/* Influencer Analysis */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Influencer Analysis
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <MetricCard
                label="Influencer Detection"
                value={selectedAd.analysis.has_influencer ? `Found ${selectedAd.analysis.influencer_count} influencer(s)` : "No influencers detected"}
                icon={Users}
                className="bg-purple-50 border-purple-200"
              />
              <MetricCard
                label="Count"
                value={selectedAd.analysis.influencer_count}
                icon={Percent}
                className="bg-purple-50 border-purple-200"
              />
            </div>

            {selectedAd.analysis.has_influencer && selectedAd.analysis.influencer_names.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Detected Influencers</h3>
                <div className="space-y-3">
                  {selectedAd.analysis.influencer_names.map((inf, idx) => (
                    <div key={idx} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">{inf.name}</h4>
                        {inf.is_influencer && (
                          <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-semibold">
                            INFLUENCER
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Sources: {inf.sources?.join(', ') || 'Unknown'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ad Content */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              Ad Content Analysis
            </h2>

            {selectedAd.full_ad_text && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Full Ad Text</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedAd.full_ad_text}</p>
                </div>
              </div>
            )}

            {selectedAd.ad_text && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Primary Text</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedAd.ad_text}</p>
                </div>
              </div>
            )}

            {selectedAd.call_to_action && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Call to Action
                </h3>
                <div className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg">
                  {selectedAd.call_to_action}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------- Helper Components -------------------- */
interface ScoreCardProps {
  title: string;
  score: number;
  icon: any;
  description?: string;
  className?: string;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ title, score, icon: Icon, description, className }) => {
  const percentage = score;
  return (
    <div className={`bg-white rounded-xl p-6 shadow-lg border-2 ${className || ''}`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-8 h-8 text-blue-600" />
        <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${
          score >= 80 ? 'bg-emerald-100 text-emerald-800' : score >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
        }`}>
          {score}/100
        </span>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 mb-3">{description}</p>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: any;
  className?: string;
  score?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon, className, score }) => {
  return (
    <div className={`bg-gray-50 rounded-lg p-4 border-2 ${className || 'border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5 text-blue-600" />
        <span className="text-sm text-gray-600 font-medium">{label}</span>
      </div>
      <div className={`text-xl font-bold ${
        score ? (score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600') : 'text-gray-800'
      }`}>
        {value}
      </div>
    </div>
  );
};

const Refresh = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

export default VideoAnalysis;