// src/components/TargetingIntel.tsx
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
  Cpu,
  Calculator,
  Trash2,
  Activity,
  Layers,
  TargetIcon
} from 'lucide-react';
import TargetingIntelAPI, { 
  type TargetingIntelData,
  type CalculateIntelRequest,
  calculateTargetingIntel,
  fetchAllTargetingIntel,
  fetchTargetingIntelByCompetitorId,
  isAuthenticated,
  getAuthUserInfo
} from '../services/targetingIntel';

// Import Recharts components
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell,
  LineChart as ReLineChart, Line, AreaChart, Area,
  ComposedChart,
  ScatterChart, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar,Radar
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
  const [calculating, setCalculating] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    loadUserInfo();
    loadData();
    loadDashboard();
  }, []);

  const loadUserInfo = () => {
    if (isAuthenticated()) {
      const user = getAuthUserInfo();
      setUserInfo(user);
      console.log(`🎯 User authenticated: ${user?.name}`);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check connection first
      const connection = await TargetingIntelAPI.testConnection();
      setConnectionStatus(connection.connected ? 'connected' : 'disconnected');
      
      if (!isAuthenticated()) {
        // Demo mode - use mock data from first fetch attempt
        try {
          const mockData = await fetchTargetingIntelByCompetitorId('demo-competitor');
          setData(mockData);
          setAllData(mockData ? [mockData] : []);
        } catch {
          // If mock fetch fails, use null data (will show empty state)
          setData(null);
          setAllData([]);
        }
      } else {
        // User-specific data
        const userTargetingData = await fetchAllTargetingIntel();
        if (userTargetingData.length > 0) {
          setAllData(userTargetingData);
          setData(userTargetingData[0]);
          setSelectedCompetitor(userTargetingData[0].competitor_id);
        } else {
          // No data available
          setAllData([]);
          setData(null);
        }
      }
      
    } catch (err: any) {
      console.error('Error loading targeting intelligence:', err);
      setError(err.message || 'Failed to load targeting intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const dashboard = await TargetingIntelAPI.getDashboard();
      setDashboardData(dashboard);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const handleCalculateIntel = async () => {
    if (!selectedCompetitor) return;
    
    try {
      setCalculating(true);
      await TargetingIntelAPI.calculateCompetitor(selectedCompetitor, true);
      await loadData(); // Refresh data after calculation
    } catch (error) {
      console.error('Error calculating intelligence:', error);
      setError('Failed to calculate targeting intelligence');
    } finally {
      setCalculating(false);
    }
  };

  const handleCalculateAllIntel = async () => {
    try {
      setCalculating(true);
      await calculateTargetingIntel({
        competitor_ids: allData.map(d => d.competitor_id),
        force_recalculate: true
      });
      await loadData(); // Refresh data after calculation
    } catch (error) {
      console.error('Error calculating all intelligence:', error);
      setError('Failed to calculate targeting intelligence');
    } finally {
      setCalculating(false);
    }
  };

  const handleDeleteIntel = async () => {
    if (!selectedCompetitor || !window.confirm('Are you sure you want to delete this targeting intelligence?')) return;
    
    try {
      await TargetingIntelAPI.delete(selectedCompetitor);
      await loadData(); // Refresh data after deletion
    } catch (error) {
      console.error('Error deleting intelligence:', error);
      setError('Failed to delete targeting intelligence');
    }
  };

  const handleRefreshAll = async () => {
    try {
      setCalculating(true);
      await TargetingIntelAPI.refreshAll();
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error refreshing all intelligence:', error);
      setError('Failed to refresh targeting intelligence');
    } finally {
      setCalculating(false);
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
      maximumFractionDigits: 2,
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
    a.download = `targeting-intel-${data.competitor_id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Prepare chart data functions
  const getAgeDistributionData = () => {
    if (!data || !data.age_range) return [];
    
    const range = data.age_range.split('-');
    const min = parseInt(range[0]) || 18;
    const max = parseInt(range[1]) || 65;
    
    return [
      { name: '18-24', value: min <= 24 && max >= 18 ? 30 : 10, color: '#60A5FA' },
      { name: '25-34', value: min <= 34 && max >= 25 ? 45 : 15, color: '#34D399' },
      { name: '35-44', value: min <= 44 && max >= 35 ? 15 : 5, color: '#FBBF24' },
      { name: '45-54', value: min <= 54 && max >= 45 ? 7 : 3, color: '#F87171' },
      { name: '55+', value: min <= 65 && max >= 55 ? 3 : 2, color: '#A78BFA' }
    ];
  };

  const getGenderDistributionData = () => {
    if (!data || !data.gender_ratio) return [];
    
    const genderRatio = data.gender_ratio;
    return [
      { name: 'Male', value: (genderRatio.male || 0) * 100, color: '#3B82F6' },
      { name: 'Female', value: (genderRatio.female || 0) * 100, color: '#EC4899' },
      { name: 'Other', value: (genderRatio.other || 0) * 100, color: '#8B5CF6' }
    ].filter(item => item.value > 0);
  };

  const getGeographyData = () => {
    if (!data || !data.geography) return [];
    
    return Object.entries(data.geography).map(([country, info]) => ({
      country,
      percentage: info?.percentage || 0,
      fill: (info?.percentage || 0) > 30 ? '#3B82F6' : 
            (info?.percentage || 0) > 15 ? '#10B981' : 
            (info?.percentage || 0) > 10 ? '#F59E0B' : 
            (info?.percentage || 0) > 5 ? '#EF4444' : 
            '#8B5CF6'
    })).slice(0, 8); // Limit to top 8 countries
  };

  const getInterestClustersData = () => {
    if (!data || !data.interest_clusters || data.interest_clusters.length === 0) return [];
    
    return data.interest_clusters.slice(0, 8).map((interest, index) => ({
      name: interest.split(' ')[0] || 'Interest',
      value: 70 + (Math.random() * 30), // Simulated affinity
      fullName: interest,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#8B5CF6'][index]
    }));
  };

  const getDeviceDistributionData = () => {
    if (!data || !data.device_distribution) return [];
    
    const deviceDist = data.device_distribution;
    return [
      { name: 'Mobile', value: (deviceDist.mobile || 0) * 100, color: '#10B981' },
      { name: 'Desktop', value: (deviceDist.desktop || 0) * 100, color: '#3B82F6' },
      { name: 'Tablet', value: (deviceDist.tablet || 0) * 100, color: '#F59E0B' }
    ].filter(item => item.value > 0);
  };

  const getConfidenceScoresData = () => {
    if (!data || !data.confidence_scores) return [];
    
    const scores = data.confidence_scores;
    return Object.entries(scores).map(([key, value]) => ({
      subject: key.charAt(0).toUpperCase() + key.slice(1),
      A: (value || 0) * 100,
      fullMark: 100
    }));
  };

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
                {entry.dataKey === 'percentage' ? '%' : ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data && allData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mt-8">
            <div className="flex items-center justify-center mb-8">
              <div className="p-4 bg-blue-100 rounded-2xl">
                <Target className="w-12 h-12 text-blue-500" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Targeting Data Available</h3>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                {isAuthenticated() 
                  ? 'You haven\'t calculated targeting intelligence for any competitors yet. Start by calculating insights for your tracked competitors.'
                  : 'Login to access personalized targeting intelligence for your competitors.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated() && (
                  <>
                    <button
                      onClick={handleCalculateAllIntel}
                      disabled={calculating}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      {calculating ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <Calculator className="w-5 h-5 mr-2" />
                          Calculate All Targeting Intel
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleRefreshAll}
                      disabled={calculating}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Refresh All Data
                    </button>
                  </>
                )}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const ageDistributionChartData = getAgeDistributionData();
  const genderDistributionChartData = getGenderDistributionData();
  const geographyChartData = getGeographyData();
  const interestClustersChartData = getInterestClustersData();
  const deviceDistributionChartData = getDeviceDistributionData();
  const confidenceScoresChartData = getConfidenceScoresData();

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
                    API v1
                  </span>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-800">Confidence</span>
                  <span className="text-lg font-bold text-purple-700">
                    {formatPercentage(data.overall_confidence)}
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
                        {item.competitor_name || `Competitor ${item.competitor_id.substring(0, 8)}`}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="w-5 h-5 text-gray-400 absolute right-3 top-3.5 transform rotate-90 pointer-events-none" />
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={handleCalculateIntel}
                  disabled={calculating || !selectedCompetitor}
                  className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {calculating ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Calculator className="w-5 h-5" />
                  )}
                  {calculating ? 'Calculating...' : 'Recalculate'}
                </button>
                
                <button
                  onClick={handleExportInsights}
                  className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Export
                </button>
                
                {isAuthenticated() && (
                  <button
                    onClick={handleDeleteIntel}
                    disabled={!selectedCompetitor}
                    className="px-5 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </button>
                )}
              </div>
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
                  <h2 className="text-xl font-bold text-gray-900">
                    {data.competitor_name || `Competitor ${data.competitor_id.substring(0, 8)}`}
                  </h2>
                  <p className="text-gray-600 mt-1">Targeting Intelligence Analysis</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    data.is_active 
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800'
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
                  }`}>
                    {data.is_active ? 'Active Monitoring' : 'Inactive'}
                  </span>
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
                      <div className="text-lg font-bold text-gray-900">{data.age_range || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {data.age_min || '?'}-{data.age_max || '?'} years
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Primary Location</div>
                      <div className="text-lg font-bold text-gray-900">{data.primary_location || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {data.geography ? `${Object.keys(data.geography).length} regions` : 'No data'}
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Smartphone className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Primary Device</div>
                      <div className="text-lg font-bold text-gray-900">{data.primary_device || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {data.device_distribution?.mobile ? `${formatPercentage(data.device_distribution.mobile)} mobile` : 'No data'}
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Estimated CPM</div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(data.estimated_cpm)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    ROAS: {data.estimated_roas ? `${data.estimated_roas.toFixed(1)}x` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Demographics Section */}
            {(activeView === 'overview' || activeView === 'demographics') && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Audience Demographics</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">AI Analysis</span>
                      <Sparkles className="w-4 h-4 text-blue-500" />
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Age Distribution */}
                    {ageDistributionChartData.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="font-semibold text-gray-800">Age Distribution</h4>
                          <div className="text-sm text-gray-500">Simulated</div>
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
                      </div>
                    )}
                    
                    {/* Gender Distribution */}
                    {genderDistributionChartData.length > 0 && (
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
                      </div>
                    )}
                  </div>
                  
                  {/* Geography */}
                  {geographyChartData.length > 0 && (
                    <div className="mt-8">
                      <h4 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-500" />
                        Geographic Distribution
                      </h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReBarChart data={geographyChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis 
                              dataKey="country" 
                              angle={-45}
                              textAnchor="end"
                              height={60}
                              tick={{ fill: '#6B7280', fontSize: 11 }}
                            />
                            <YAxis 
                              tickFormatter={(value) => `${value}%`}
                              tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                            <Bar 
                              dataKey="percentage" 
                              radius={[6, 6, 0, 0]}
                              animationDuration={1500}
                            >
                              {geographyChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </ReBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Interests Section */}
            {(activeView === 'overview' || activeView === 'interests') && interestClustersChartData.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Interest Clusters</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Top {data.interest_clusters?.length || 0} clusters</span>
                      <Brain className="w-4 h-4 text-purple-500" />
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {interestClustersChartData.map((item, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ 
                                background: `linear-gradient(135deg, ${item.color}20, ${item.color}40)`,
                                border: `1px solid ${item.color}30`
                              }}
                            >
                              <Sparkles className="w-5 h-5" style={{ color: item.color }} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{item.fullName}</h4>
                              <div className="text-sm text-gray-500">Affinity Score</div>
                            </div>
                          </div>
                          <div className="px-4 py-2 rounded-full text-lg font-bold" style={{ 
                            backgroundColor: `${item.color}15`, 
                            color: item.color
                          }}>
                            {item.value.toFixed(0)}%
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full transition-all duration-700"
                            style={{ 
                              width: `${item.value}%`,
                              background: `linear-gradient(90deg, ${item.color}, ${item.color}80)`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Strategy Section */}
            {(activeView === 'overview' || activeView === 'strategy') && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Targeting Strategy</h3>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-500">Performance Metrics</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white rounded-xl">
                          <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm text-blue-700">Bidding Strategy</div>
                          <div className="text-xl font-bold text-blue-900 capitalize">
                            {data.bidding_strategy?.replace('_', ' ') || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-blue-600">
                        Confidence: {formatPercentage(data.bidding_confidence)}
                      </div>
                    </div>
                    
                    <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white rounded-xl">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm text-green-700">Estimated CPC</div>
                          <div className="text-xl font-bold text-green-900">
                            {formatCurrency(data.estimated_cpc)}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-green-600">
                        Cost per click
                      </div>
                    </div>
                    
                    <div className="p-5 bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white rounded-xl">
                          <Activity className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm text-purple-700">Engagement Rate</div>
                          <div className="text-xl font-bold text-purple-900">
                            {formatPercentage(data.engagement_rate)}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-purple-600">
                        Audience interaction
                      </div>
                    </div>
                    
                    <div className="p-5 bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white rounded-xl">
                          <Layers className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-sm text-orange-700">Funnel Stage</div>
                          <div className="text-xl font-bold text-orange-900 capitalize">
                            {data.funnel_stage || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-orange-600">
                        Score: {formatPercentage(data.funnel_score)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Device Distribution */}
                  {deviceDistributionChartData.length > 0 && (
                    <div className="mt-8">
                      <h4 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-green-500" />
                        Device Distribution
                      </h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReBarChart data={deviceDistributionChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <YAxis 
                              tickFormatter={(value) => `${value}%`}
                              tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                            <Bar 
                              dataKey="value" 
                              radius={[6, 6, 0, 0]}
                              animationDuration={1500}
                            >
                              {deviceDistributionChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </ReBarChart>
                        </ResponsiveContainer>
                      </div>
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
                {data.age_range && (
                  <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <Target className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Age Focus</h4>
                        <p className="text-sm text-gray-600">
                          Prioritize <span className="font-semibold text-blue-600">{data.age_range}</span> age group.
                          {data.gender_ratio?.male && data.gender_ratio.male > 0.5 && ' Focus on male audience.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {data.primary_location && (
                  <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                        <MapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Geographic Focus</h4>
                        <p className="text-sm text-gray-600">
                          Target <span className="font-semibold text-green-600">{data.primary_location}</span> primarily.
                          {data.geography && ` Expand to ${Object.keys(data.geography).length - 1} other regions.`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {data.device_distribution?.mobile && data.device_distribution.mobile > 0.6 && (
                  <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                        <Smartphone className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Device Strategy</h4>
                        <p className="text-sm text-gray-600">
                          Mobile-first approach ({formatPercentage(data.device_distribution.mobile)}).
                          {data.device_distribution.ios && ` iOS: ${formatPercentage(data.device_distribution.ios)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {data.content_type && (
                <div className="mt-6 p-4 bg-white rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Content Recommendation</h4>
                      <p className="text-sm text-gray-600">
                        Use <span className="font-semibold text-yellow-600">{data.content_type}</span> content with 
                        <span className="font-semibold text-yellow-600"> {data.call_to_action?.replace('_', ' ')}</span> CTA
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confidence Scores */}
            {confidenceScoresChartData.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Confidence Analysis</h3>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={confidenceScoresChartData}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10 }} />
                      <Radar
                        name="Confidence"
                        dataKey="A"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.6}
                        strokeWidth={2}
                      />
                      <Tooltip formatter={(value) => [`${value}%`, 'Confidence']} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {confidenceScoresChartData.slice(0, 4).map((item, index) => (
                    <div key={index} className="text-center p-3 border border-gray-200 rounded-xl">
                      <div className="text-lg font-bold" style={{
                        color: item.A > 80 ? '#10B981' : item.A > 60 ? '#F59E0B' : '#EF4444'
                      }}>
                        {item.A.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-600">{item.subject}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audience Details */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Audience Details</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Audience Type</span>
                  <span className="font-medium text-gray-900 capitalize">{data.audience_type || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Audience Size</span>
                  <span className="font-medium text-gray-900 capitalize">{data.audience_size || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Income Level</span>
                  <span className="font-medium text-gray-900 capitalize">{data.income_level || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Income Score</span>
                  <span className="font-medium text-gray-900">{formatPercentage(data.income_score)}</span>
                </div>
              </div>
              
              {data.primary_interests && data.primary_interests.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Primary Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.primary_interests.map((interest, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
                  <span className="text-gray-600">Last Calculated</span>
                  <span className="font-medium text-gray-900">
                    {data.last_calculated_at 
                      ? new Date(data.last_calculated_at).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Updated</span>
                  <span className="font-medium text-gray-900">
                    {data.updated_at 
                      ? new Date(data.updated_at).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium text-gray-900">
                    {new Date(data.created_at).toLocaleDateString()}
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
              <p>Targeting intelligence • Last updated: {new Date(data.updated_at || data.created_at).toLocaleString()}</p>
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
                v2.0 • API Sync
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TargetingIntel;