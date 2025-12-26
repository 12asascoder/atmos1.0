import React, { useEffect, useState } from 'react';
import { 
  Target, 
  Users, 
  MapPin, 
  PieChart as PieChartIcon,
  BarChart3,
  Smartphone,
  Clock,
  Award,
  Brain,
  AlertCircle,
  TrendingUp,
  Globe,
  DollarSign,
  Phone,
  RefreshCw,
  User,
  Shield,
  Zap,
  Eye,
  Sparkles,
  ChevronRight,
  Download,
  Filter,
  Search,
  MoreVertical,
  Info,
  BarChart,
  LineChart,
  TrendingDown,
  Cpu
} from 'lucide-react';
import { 
  fetchLatestTargetingIntel, 
  fetchUserTargetingIntel,
  testTargetingIntelConnection,
  type TargetingIntelData, 
  type InterestCluster 
} from '../services/targetingIntel';
import { getUserInfo, isAuthenticated, logout } from '../services/api';

// Import Recharts components
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell,
  LineChart as ReLineChart, Line, AreaChart, Area,
  RadialBarChart, RadialBar,
  ComposedChart,
  ScatterChart, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const TargetingIntel: React.FC = () => {
  const [data, setData] = useState<TargetingIntelData | null>(null);
  const [allData, setAllData] = useState<TargetingIntelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [userInfo, setUserInfo] = useState<{ user_id: string; email: string; name: string } | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'demographics' | 'interests' | 'strategy'>('overview');
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserInfo();
    loadData();
  }, []);

  const loadUserInfo = () => {
    if (isAuthenticated()) {
      const user = getUserInfo();
      setUserInfo(user);
      console.log(`🎯 User authenticated: ${user?.name}`);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check connection first
      const connection = await testTargetingIntelConnection();
      setConnectionStatus(connection.connected ? 'connected' : 'disconnected');
      
      if (!isAuthenticated()) {
        // Demo mode
        const mockData = await fetchLatestTargetingIntel();
        setData(mockData);
        setAllData(mockData ? [mockData] : []);
      } else {
        // User-specific data
        const userTargetingData = await fetchUserTargetingIntel();
        if (userTargetingData.length > 0) {
          setAllData(userTargetingData);
          setData(userTargetingData[0]);
          setSelectedCompetitor(userTargetingData[0].competitor_id);
        } else {
          // Fallback to latest if no user-specific data
          const latestData = await fetchLatestTargetingIntel();
          setData(latestData);
          setAllData(latestData ? [latestData] : []);
        }
      }
      
    } catch (err: any) {
      console.error('Error loading targeting intelligence:', err);
      setError(err.message || 'Failed to load targeting intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '$0';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0%';
    }
    return `${(value * 100).toFixed(1)}%`;
  };

  const handleCompetitorChange = (competitorId: string) => {
    const selected = allData.find(d => d.competitor_id === competitorId);
    if (selected) {
      setData(selected);
      setSelectedCompetitor(competitorId);
    }
  };

  const handleExportInsights = () => {
    if (!data) return;
    
    const exportData = {
      ...data,
      exported_at: new Date().toISOString(),
      user_name: userInfo?.name,
      user_email: userInfo?.email
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `targeting-intel-${data.competitor_name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0"></div>
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700">Loading Targeting Intelligence</p>
              <p className="mt-2 text-gray-500">
                {userInfo ? `Analyzing data for ${userInfo.name}` : 'Preparing insights...'}
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mt-8">
            <div className="flex items-center justify-center mb-8">
              <div className="p-4 bg-red-100 rounded-2xl">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Targeting Data</h3>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                {error || 'No targeting intelligence data available. This could be due to connection issues or no competitors being tracked.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={loadData}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Try Again
                </button>
                {!isAuthenticated() && (
                  <a
                    href="/login"
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center"
                  >
                    <User className="w-5 h-5 mr-2" />
                    Login for Personalized Data
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Safe data preparation with fallbacks
  const safeData = {
    ...data,
    interest_clusters: Array.isArray(data.interest_clusters) ? data.interest_clusters : [],
    age_distribution: data.age_distribution || {
      '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0
    },
    gender_distribution: data.gender_distribution || {
      male: 0, female: 0, other: 0
    },
    geographic_spend: data.geographic_spend || {},
    funnel_stage_prediction: data.funnel_stage_prediction || {
      awareness: { label: 'Awareness', percentage: 0, reach: 0 },
      consideration: { label: 'Consideration', percentage: 0, reach: 0 },
      conversion: { label: 'Conversion', percentage: 0, reach: 0 },
      retention: { label: 'Retention', percentage: 0, reach: 0 }
    },
    bidding_strategy: data.bidding_strategy || {
      hourly: [],
      avg_cpc: 0,
      peak_cpm: { value: 0, window: '' },
      best_time: ''
    },
    advanced_targeting: data.advanced_targeting || {
      purchase_intent: { level: 'Low', confidence: 0 },
      ai_recommendation: '',
      device_preference: { mobile: 0, desktop: 0, ios_share: 0 },
      competitor_overlap: { brands: 0, description: '' }
    }
  };

  // Prepare chart data
  const ageDistributionChartData = Object.entries(safeData.age_distribution).map(([age, percentage]) => ({
    name: age,
    value: (percentage || 0) * 100,
    color: age === '18-24' ? '#60A5FA' : 
           age === '25-34' ? '#34D399' : 
           age === '35-44' ? '#FBBF24' : 
           age === '45-54' ? '#F87171' : 
           '#A78BFA'
  }));

  const genderDistributionChartData = Object.entries(safeData.gender_distribution).map(([gender, percentage]) => ({
    name: gender.charAt(0).toUpperCase() + gender.slice(1),
    value: (percentage || 0) * 100,
    color: gender === 'male' ? '#3B82F6' : 
           gender === 'female' ? '#EC4899' : 
           '#8B5CF6'
  }));

  const geographicSpendChartData = Object.entries(safeData.geographic_spend).map(([country, info]) => ({
    country,
    spend: info?.spend || 0,
    percentage: info?.percentage || 0,
    fill: (info?.percentage || 0) > 30 ? '#3B82F6' : 
          (info?.percentage || 0) > 15 ? '#10B981' : 
          (info?.percentage || 0) > 10 ? '#F59E0B' : 
          (info?.percentage || 0) > 5 ? '#EF4444' : 
          '#8B5CF6'
  }));

  const interestClustersChartData = safeData.interest_clusters
    .slice(0, 8)
    .map((cluster, index) => ({
      name: (cluster.interest || 'Interest').split(' ')[0],
      affinity: (cluster.affinity || 0) * 100,
      reach: (cluster.reach || 0) / 1000,
      fullName: cluster.interest || 'Interest',
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#8B5CF6'][index]
    }));

  const funnelStageChartData = Object.entries(safeData.funnel_stage_prediction).map(([stage, info]) => ({
    stage: stage.charAt(0).toUpperCase() + stage.slice(1),
    percentage: info?.percentage || 0,
    reach: (info?.reach || 0) / 1000000,
    color: stage === 'awareness' ? '#3B82F6' : 
           stage === 'consideration' ? '#10B981' : 
           stage === 'conversion' ? '#F59E0B' : 
           '#EF4444'
  }));

  const biddingHourlyChartData = (safeData.bidding_strategy.hourly || []).map((hour, index) => ({
    time: hour?.time || `${index}:00`,
    cpm: hour?.cpm || 0,
    cpc: hour?.cpc || 0,
    hourIndex: index,
    isPeak: hour?.time && hour.time >= '6pm' && hour.time <= '9pm'
  }));

  const devicePreferenceData = [
    { 
      name: 'Mobile', 
      value: ((safeData.advanced_targeting?.device_preference?.mobile || 0) * 100), 
      color: '#10B981' 
    },
    { 
      name: 'Desktop', 
      value: ((safeData.advanced_targeting?.device_preference?.desktop || 0) * 100), 
      color: '#3B82F6' 
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-lg backdrop-blur-sm bg-white/95">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
                <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
              <span className="font-medium text-gray-900">
                {entry.value?.toFixed(1) || '0'}
                {entry.dataKey === 'reach' ? 'K' : entry.dataKey === 'percentage' ? '%' : ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mr-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Targeting Intelligence</h1>
                  <p className="text-gray-600 mt-1">AI-powered audience insights & targeting strategies</p>
                </div>
              </div>
              
              {/* User Status & Connection */}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {userInfo ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800">{userInfo.name}</span>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Authenticated
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                    <Eye className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Demo Mode</span>
                    <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                      Preview Only
                    </span>
                  </div>
                )}
                
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                  connectionStatus === 'connected'
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
                    : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
                  <span className={`font-medium ${
                    connectionStatus === 'connected' ? 'text-blue-800' : 'text-red-800'
                  }`}>
                    {connectionStatus === 'connected' ? 'Live Data' : 'Demo Data'}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/50">
                    {safeData.data_source}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-800">AI Confidence</span>
                  <span className="text-lg font-bold text-purple-700">
                    {formatPercentage(safeData.confidence_score)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {allData.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedCompetitor || ''}
                    onChange={(e) => handleCompetitorChange(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-xl pl-4 pr-10 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow transition-shadow"
                  >
                    {allData.map((item) => (
                      <option key={item.competitor_id} value={item.competitor_id}>
                        {item.competitor_name}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="w-5 h-5 text-gray-400 absolute right-3 top-3.5 transform rotate-90 pointer-events-none" />
                </div>
              )}
              
              <button
                onClick={loadData}
                className="px-5 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:shadow transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
              
              <button
                onClick={handleExportInsights}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>
          </div>
          
          {/* View Navigation */}
          <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: <Target className="w-4 h-4" /> },
                { id: 'demographics', label: 'Demographics', icon: <Users className="w-4 h-4" /> },
                { id: 'interests', label: 'Interests', icon: <Brain className="w-4 h-4" /> },
                { id: 'strategy', label: 'Strategy', icon: <Zap className="w-4 h-4" /> }
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all ${
                    activeView === view.id
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {view.icon}
                  <span className="font-medium">{view.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Key Metrics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Competitor Overview Card */}
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{safeData.competitor_name}</h2>
                  <p className="text-gray-600 mt-1">Targeting Intelligence Analysis</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-medium">
                    Active Monitoring
                  </span>
                  <button className="p-2 hover:bg-gray-100 rounded-xl">
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Primary Age</div>
                      <div className="text-lg font-bold text-gray-900">25-34</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: '45%' }}></div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Purchase Intent</div>
                      <div className="text-lg font-bold text-gray-900">
                        {safeData.advanced_targeting.purchase_intent.level}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    {formatPercentage(safeData.advanced_targeting.purchase_intent.confidence)} confidence
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Smartphone className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Mobile Share</div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatPercentage(safeData.advanced_targeting.device_preference.mobile)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    iOS: {formatPercentage(safeData.advanced_targeting.device_preference.ios_share)}
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Peak CPM</div>
                      <div className="text-lg font-bold text-gray-900">
                        ${safeData.bidding_strategy.peak_cpm.value?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {safeData.bidding_strategy.peak_cpm.window || 'Not specified'}
                  </div>
                </div>
              </div>
            </div>

            {/* Age & Gender Distribution */}
            {(activeView === 'overview' || activeView === 'demographics') && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Audience Demographics</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Updated Today</span>
                      <Sparkles className="w-4 h-4 text-blue-500" />
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Age Distribution */}
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="font-semibold text-gray-800">Age Distribution</h4>
                        <div className="text-sm text-gray-500">Percentage</div>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReBarChart data={ageDistributionChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#6B7280', fontSize: 12 }}
                              tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                              dataKey="value" 
                              radius={[6, 6, 0, 0]}
                              animationDuration={1500}
                            >
                              {ageDistributionChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </ReBarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-6 space-y-3">
                        {ageDistributionChartData.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></div>
                              <span className="text-gray-700">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-gray-900">{item.value.toFixed(1)}%</span>
                              <div className="w-24 bg-gray-100 rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${item.value}%`, backgroundColor: item.color }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Gender Distribution */}
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="font-semibold text-gray-800">Gender Distribution</h4>
                        <div className="text-sm text-gray-500">Percentage</div>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={genderDistributionChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={3}
                              dataKey="value"
                              animationDuration={1500}
                            >
                              {genderDistributionChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-6">
                        {genderDistributionChartData.map((item, index) => (
                          <div key={index} className="text-center p-4 rounded-xl border border-gray-200">
                            <div className="text-2xl font-bold mb-2" style={{ color: item.color }}>
                              {item.value.toFixed(1)}%
                            </div>
                            <div className="text-gray-700 font-medium">{item.name}</div>
                            <div className="text-sm text-gray-500 mt-1">Share</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Interest Clusters */}
            {(activeView === 'overview' || activeView === 'interests') && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Interest Clusters & Affinity</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Top {interestClustersChartData.length} clusters</span>
                      <Brain className="w-4 h-4 text-purple-500" />
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="h-72 mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={interestClustersChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: '#6B7280', fontSize: 12 }}
                        />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fill: '#6B7280', fontSize: 12 }}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          tick={{ fill: '#6B7280', fontSize: 12 }}
                          tickFormatter={(value) => `${value}K`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          yAxisId="left"
                          dataKey="affinity" 
                          radius={[6, 6, 0, 0]}
                          name="Affinity"
                          animationDuration={1500}
                        >
                          {interestClustersChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="reach" 
                          stroke="#8B5CF6" 
                          strokeWidth={3}
                          dot={{ r: 5 }}
                          activeDot={{ r: 7 }}
                          name="Reach"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-4">
                    {safeData.interest_clusters.slice(0, 4).map((cluster, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ 
                                background: `linear-gradient(135deg, ${interestClustersChartData[index]?.color || '#3B82F6'}20, ${interestClustersChartData[index]?.color || '#3B82F6'}40)`,
                                border: `1px solid ${interestClustersChartData[index]?.color || '#3B82F6'}30`
                              }}
                            >
                              <Sparkles className="w-5 h-5" style={{ color: interestClustersChartData[index]?.color || '#3B82F6' }} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{cluster.interest}</h4>
                              <div className="text-sm text-gray-500">Potential reach: {formatNumber(cluster.reach)}</div>
                            </div>
                          </div>
                          <div className="px-4 py-2 rounded-full text-lg font-bold" style={{ 
                            backgroundColor: `${interestClustersChartData[index]?.color || '#3B82F6'}15`, 
                            color: interestClustersChartData[index]?.color || '#3B82F6'
                          }}>
                            {(cluster.affinity * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full transition-all duration-700"
                            style={{ 
                              width: `${cluster.affinity * 100}%`,
                              background: `linear-gradient(90deg, ${interestClustersChartData[index]?.color || '#3B82F6'}, ${interestClustersChartData[index]?.color || '#3B82F6'}80)`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bidding Strategy */}
            {(activeView === 'overview' || activeView === 'strategy') && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Bidding Strategy Analysis</h3>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-500">24-hour pattern</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {biddingHourlyChartData.length > 0 ? (
                    <>
                      <div className="h-72 mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={biddingHourlyChartData}>
                            <defs>
                              <linearGradient id="colorCpm" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="colorCpc" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis 
                              dataKey="time" 
                              tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <YAxis 
                              tickFormatter={(value) => `$${value.toFixed(2)}`}
                              tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <Tooltip 
                              formatter={(value, name) => {
                                const label = name === 'cpm' ? 'CPM' : 'CPC';
                                return [`$${Number(value).toFixed(2)}`, label];
                              }}
                              contentStyle={{ 
                                borderRadius: '12px', 
                                border: '1px solid #E5E7EB',
                                backdropFilter: 'blur(8px)',
                                backgroundColor: 'rgba(255, 255, 255, 0.95)'
                              }}
                            />
                            <Legend />
                            <Area 
                              type="monotone" 
                              dataKey="cpm" 
                              stroke="#3B82F6" 
                              fillOpacity={1} 
                              fill="url(#colorCpm)" 
                              name="CPM"
                              strokeWidth={3}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="cpc" 
                              stroke="#10B981" 
                              fillOpacity={1} 
                              fill="url(#colorCpc)" 
                              name="CPC"
                              strokeWidth={3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white rounded-xl">
                              <TrendingUp className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm text-blue-700">Peak CPM</div>
                              <div className="text-2xl font-bold text-blue-900">
                                ${(safeData.bidding_strategy.peak_cpm.value || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-blue-600">
                            {safeData.bidding_strategy.peak_cpm.window || 'Evening hours'}
                          </div>
                        </div>
                        
                        <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white rounded-xl">
                              <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm text-green-700">Avg. CPC</div>
                              <div className="text-2xl font-bold text-green-900">
                                ${(safeData.bidding_strategy.avg_cpc || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-green-600">
                            Daily average cost per click
                          </div>
                        </div>
                        
                        <div className="p-5 bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white rounded-xl">
                              <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm text-purple-700">Best Time</div>
                              <div className="text-2xl font-bold text-purple-900">
                                {safeData.bidding_strategy.best_time || '3am-6am'}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-purple-600">
                            Lowest acquisition cost
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                      <p className="text-gray-500">No bidding strategy data available</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Insights & Recommendations */}
          <div className="space-y-6">
            {/* AI Recommendations */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <Cpu className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">AI Recommendations</h3>
                  <p className="text-sm text-gray-600">Optimized targeting strategy</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Focus Audience</h4>
                      <p className="text-sm text-gray-600">
                        Prioritize <span className="font-semibold text-blue-600">25-34 age group</span> with mobile-first approach. 
                        iOS users show 65% higher engagement.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Optimal Timing</h4>
                      <p className="text-sm text-gray-600">
                        Schedule ads during <span className="font-semibold text-purple-600">3am-6am window</span> for 40% lower CPC.
                        Avoid peak evening hours for cost efficiency.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                      <Zap className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Interest Targeting</h4>
                      <p className="text-sm text-gray-600">
                        Allocate <span className="font-semibold text-orange-600">60% of budget</span> to "Fitness & Running" and 
                        "Health & Wellness" interest clusters showing 92%+ affinity.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {safeData.advanced_targeting.ai_recommendation && (
                <div className="mt-6 p-4 bg-white rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">AI Insight</h4>
                      <p className="text-sm text-gray-600">{safeData.advanced_targeting.ai_recommendation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Purchase Intent & Device */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Purchase Intent Analysis</h3>
              
              <div className="space-y-6">
                {/* Purchase Intent Gauge */}
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-48 h-24 relative">
                      {/* Gauge background */}
                      <div className="absolute top-0 left-0 w-full h-full">
                        <div className="w-full h-full rounded-t-full border-8 border-gray-200"></div>
                      </div>
                      {/* Gauge fill */}
                      <div 
                        className="absolute top-0 left-0 w-full h-full overflow-hidden"
                        style={{ transform: `rotate(${safeData.advanced_targeting.purchase_intent.confidence * 180}deg)` }}
                      >
                        <div className="w-full h-full rounded-t-full border-8 border-transparent border-t-green-500 border-r-green-500 origin-bottom"></div>
                      </div>
                      {/* Center text */}
                      <div className="absolute bottom-4 left-0 w-full text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {formatPercentage(safeData.advanced_targeting.purchase_intent.confidence)}
                        </div>
                        <div className="text-sm text-gray-600">Confidence Score</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      safeData.advanced_targeting.purchase_intent.level === 'High' 
                        ? 'bg-green-100 text-green-800'
                        : safeData.advanced_targeting.purchase_intent.level === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {safeData.advanced_targeting.purchase_intent.level || 'Low'} Purchase Intent
                    </span>
                  </div>
                </div>
                
                {/* Device Preference */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-blue-500" />
                    Device Preference
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-700">Mobile</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">
                          {formatPercentage(safeData.advanced_targeting.device_preference.mobile)}
                        </span>
                        <div className="w-32 bg-gray-100 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-green-500 transition-all duration-500"
                            style={{ width: `${safeData.advanced_targeting.device_preference.mobile * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-gray-700">Desktop</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">
                          {formatPercentage(safeData.advanced_targeting.device_preference.desktop)}
                        </span>
                        <div className="w-32 bg-gray-100 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${safeData.advanced_targeting.device_preference.desktop * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">iOS Share</div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatPercentage(safeData.advanced_targeting.device_preference.ios_share)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Competitor Overlap */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Competitor Overlap</h3>
                <Shield className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {safeData.advanced_targeting.competitor_overlap.brands || '0'}
                </div>
                <div className="text-gray-600">brands overlapping</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-gray-700 text-sm">
                  {safeData.advanced_targeting.competitor_overlap.description || 
                   'Your target audience shows significant overlap with similar brands in the market.'}
                </p>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="text-center p-3 border border-gray-200 rounded-xl">
                  <div className="text-lg font-bold text-blue-600">42%</div>
                  <div className="text-xs text-gray-600">Audience Shared</div>
                </div>
                <div className="text-center p-3 border border-gray-200 rounded-xl">
                  <div className="text-lg font-bold text-green-600">3.2x</div>
                  <div className="text-xs text-gray-600">Engagement Rate</div>
                </div>
              </div>
            </div>

            {/* Data Source Info */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                  <Info className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Data Information</h4>
                  <p className="text-sm text-gray-600">Source & freshness</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Data Source</span>
                  <span className="font-medium text-gray-900">{safeData.data_source}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Confidence</span>
                  <span className="font-medium text-green-600">
                    {formatPercentage(safeData.confidence_score)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Updated</span>
                  <span className="font-medium text-gray-900">
                    {new Date(safeData.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Analysis Type</span>
                  <span className="font-medium text-blue-600">AI Predictive</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              <p>Targeting intelligence for {safeData.competitor_name} • Last analysis: {new Date(safeData.updated_at).toLocaleString()}</p>
              <p className="mt-1">
                {userInfo 
                  ? `Personalized insights for ${userInfo.name} • ${allData.length} competitor${allData.length !== 1 ? 's' : ''} tracked`
                  : 'Viewing demo data • Login for personalized insights'
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              {!isAuthenticated() && (
                <a 
                  href="/login" 
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  <User className="w-4 h-4" />
                  Login for Full Access
                </a>
              )}
              <button
                onClick={loadData}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </button>
              <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                v1.0 • AI-Powered
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TargetingIntel;