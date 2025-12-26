// src/components/AdSurveillance.tsx
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  Eye, 
  MousePointer,
  BarChart3,
  Filter,
  Search,
  MoreVertical,
  PlayCircle,
  Copy,
  Download,
  Wifi,
  WifiOff,
  RefreshCw,
  Plus,
  X,
  AlertCircle,
  Calendar,
  Clock,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  Radar,
  User
} from 'lucide-react';
import { 
  fetchSummaryMetrics, 
  fetchDailyMetrics, 
  testDatabaseConnection, 
  getCompetitorSpendDistribution, 
  getSpendRangeDistribution, 
  getCTRPerformanceDistribution,
  getSpendImpressionsCorrelation,
  getPlatformCTRData,
  getAnalyticsSummary,
  type SummaryMetrics, 
  type AdCardData, 
  type FetchMetricsOptions,
  type CompetitorSpendData,
  type SpendRangeData,
  type CTRPerformanceData,
  type SpendImpressionData,
  type PlatformCTRData,
  getUserInfo, // Added for user info
  isAuthenticated, // Added for auth check
  logout // Added for logout functionality
} from '../services/api.ts';
import { addCompetitor, type NewCompetitorInput } from '../services/competitors';

// Import Recharts components
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
  ComposedChart,
  ScatterChart, Scatter, ZAxis,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

interface PlatformSpendData {
  platform: string;
  spend: number;
  percentage: number;
  color: string;
}

interface UserInfo {
  user_id: string;
  email: string;
  name: string;
}

const AdSurveillance = () => {
  const [summaryData, setSummaryData] = useState<SummaryMetrics | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<AdCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [connectionInfo, setConnectionInfo] = useState<{
    summaryCount: number;
    dailyCount: number;
    error?: string;
  } | null>(null);
  
  // User info state
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  
  // Data view mode state
  const [dataViewMode, setDataViewMode] = useState<'latest' | 'historical'>('latest');
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // Competitor modal state
  const [showAddCompetitorModal, setShowAddCompetitorModal] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState<NewCompetitorInput>({
    name: '',
    domain: '',
    industry: '',
    estimated_monthly_spend: 0,
    social_handles: {}
  });
  const [addingCompetitor, setAddingCompetitor] = useState(false);
  const [addCompetitorError, setAddCompetitorError] = useState<string | null>(null);
  const [addCompetitorSuccess, setAddCompetitorSuccess] = useState(false);
  
  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState<{
    competitorSpend: CompetitorSpendData[];
    spendRanges: SpendRangeData[];
    ctrPerformance: CTRPerformanceData[];
    spendImpressions: SpendImpressionData[];
    platformCTR: PlatformCTRData[];
    timestamp: string;
  } | null>(null);
  
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [activeChart, setActiveChart] = useState('competitorSpend');
  
  // Chart data state
  const [spendTrendData, setSpendTrendData] = useState<number[]>([56000, 55000, 51000, 57000, 56000, 56000, 56000]);
  const [platformDistribution, setPlatformDistribution] = useState<PlatformSpendData[]>([
    { platform: 'Meta', spend: 45300, percentage: 36.5, color: '#00C2B3' },
    { platform: 'Google', spend: 38900, percentage: 31.3, color: '#4A90E2' },
    { platform: 'TikTok', spend: 24700, percentage: 19.9, color: '#FF6B6B' },
    { platform: 'LinkedIn', spend: 15400, percentage: 12.4, color: '#FFD166' },
  ]);

  // Check authentication and load user info
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (authenticated) {
        const user = getUserInfo();
        if (user) {
          setUserInfo(user);
          console.log(`✅ User authenticated: ${user.name} (${user.email})`);
        }
      } else {
        console.log('⚠️ User not authenticated, using demo data');
      }
      setIsAuthChecked(true);
    };
    
    checkAuth();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchOptions: FetchMetricsOptions = {
        showLatestOnly: dataViewMode === 'latest',
        limit: dataViewMode === 'latest' ? 10 : 50,
      };

      if (dataViewMode === 'historical') {
        fetchOptions.startDate = dateRange.startDate;
        fetchOptions.endDate = dateRange.endDate;
      }

      const [summary, daily] = await Promise.all([
        fetchSummaryMetrics(selectedPeriod),
        fetchDailyMetrics(fetchOptions)
      ]);
      setSummaryData(summary);
      setDailyMetrics(daily);
      
      // Log user-specific data info
      if (userInfo) {
        console.log(`📊 Loaded user-specific data for: ${userInfo.name}`);
        console.log(`   - Summary metrics: ${summary ? 'Loaded' : 'Failed'}`);
        console.log(`   - Daily metrics: ${daily.length} records`);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      console.log('📈 Loading analytics data...');
      if (userInfo) {
        console.log(`   - For user: ${userInfo.name}`);
      }
      
      const data = await getAnalyticsSummary();
      setAnalyticsData(data);
      
      console.log('✅ Analytics data loaded successfully:', {
        user: userInfo?.name || 'Demo User',
        competitorSpendCount: data.competitorSpend.length,
        spendRangesCount: data.spendRanges.length,
        ctrPerformanceCount: data.ctrPerformance.length,
        spendImpressionsCount: data.spendImpressions.length,
        platformCTRCount: data.platformCTR.length
      });
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const checkDatabaseStatus = async () => {
    setDbStatus('checking');
    const result = await testDatabaseConnection();
    setDbStatus(result.connected ? 'connected' : 'disconnected');
    setConnectionInfo(result);
    
    if (result.connected) {
      console.log('📊 Database Status:', {
        user: userInfo?.name || 'Not authenticated',
        summaryMetrics: result.summaryCount,
        dailyMetrics: result.dailyCount
      });
    } else {
      console.warn('⚠️ Database Status:', result.error);
    }
  };

  const handleAddCompetitor = async () => {
    if (!newCompetitor.name.trim()) {
      setAddCompetitorError('Competitor name is required');
      return;
    }

    // Check authentication before adding competitor
    if (!isAuthenticated()) {
      setAddCompetitorError('You must be logged in to add competitors');
      return;
    }

    setAddingCompetitor(true);
    setAddCompetitorError(null);
    
    try {
      const result = await addCompetitor(newCompetitor);
      if (result.success) {
        setAddCompetitorSuccess(true);
        
        // Reset form
        setNewCompetitor({
          name: '',
          domain: '',
          industry: '',
          estimated_monthly_spend: 0,
          social_handles: {}
        });
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowAddCompetitorModal(false);
          setAddCompetitorSuccess(false);
        }, 2000);
        
        // Refresh data to show new competitor
        await loadData();
        await loadAnalyticsData();
      } else {
        throw new Error(result.error || 'Failed to add competitor');
      }
    } catch (error: any) {
      console.error('Error adding competitor:', error);
      setAddCompetitorError(error.message || 'Failed to add competitor. Please try again.');
    } finally {
      setAddingCompetitor(false);
    }
  };

  const resetCompetitorForm = () => {
    setNewCompetitor({
      name: '',
      domain: '',
      industry: '',
      estimated_monthly_spend: 0,
      social_handles: {}
    });
    setAddCompetitorError(null);
    setAddCompetitorSuccess(false);
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDataViewModeChange = (mode: 'latest' | 'historical') => {
    setDataViewMode(mode);
    setTimeout(() => {
      loadData();
    }, 100);
  };

  const handleApplyDateFilter = () => {
    loadData();
  };

  const handleLogout = () => {
    logout();
    // The page will reload automatically due to logout function
  };

  useEffect(() => {
    const initialize = async () => {
      if (isAuthChecked) {
        await checkDatabaseStatus();
        await loadData();
        await loadAnalyticsData();
      }
    };
    
    initialize();
  }, [isAuthChecked]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyShort = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${Math.round(amount)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatCTR = (ctr: number) => {
    return `${(ctr * 100).toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'PAUSED': return 'bg-yellow-500';
      case 'ENDED': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ENDED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading && !isAuthChecked) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading surveillance data...</p>
          <p className="text-sm text-gray-500 mt-2">
            {dbStatus === 'checking' && 'Checking database connection...'}
            {dbStatus === 'connected' && 'Connected to database ✓'}
            {dbStatus === 'disconnected' && 'Using demo data'}
          </p>
          {userInfo && (
            <p className="text-sm text-blue-600 mt-1">
              Loading data for: {userInfo.name}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            View mode: {dataViewMode === 'latest' ? 'Latest Ads' : 'Historical Data'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Add Competitor Modal */}
      {showAddCompetitorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Add New Competitor</h3>
                <button 
                  onClick={() => {
                    setShowAddCompetitorModal(false);
                    resetCompetitorForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {addCompetitorSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 text-green-600">✓</div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Competitor Added Successfully!</h4>
                  <p className="text-gray-600">The competitor has been added to your surveillance list.</p>
                  {userInfo && (
                    <p className="text-sm text-blue-600 mt-2">
                      Added to {userInfo.name}'s account
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">Modal will close automatically...</p>
                </div>
              ) : (
                <>
                  {addCompetitorError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-red-700 text-sm">{addCompetitorError}</p>
                    </div>
                  )}
                  
                  {!isAuthenticated() && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-700 text-sm">
                        You are in demo mode. Please login to add competitors to your account.
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Competitor Name *
                      </label>
                      <input
                        type="text"
                        value={newCompetitor.name}
                        onChange={(e) => setNewCompetitor({...newCompetitor, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Nike Running"
                        disabled={addingCompetitor || !isAuthenticated()}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website Domain
                      </label>
                      <input
                        type="text"
                        value={newCompetitor.domain}
                        onChange={(e) => setNewCompetitor({...newCompetitor, domain: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., nike.com"
                        disabled={addingCompetitor || !isAuthenticated()}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={newCompetitor.industry}
                        onChange={(e) => setNewCompetitor({...newCompetitor, industry: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Sportswear, E-commerce"
                        disabled={addingCompetitor || !isAuthenticated()}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Monthly Ad Spend ($)
                      </label>
                      <input
                        type="number"
                        value={newCompetitor.estimated_monthly_spend || ''}
                        onChange={(e) => setNewCompetitor({
                          ...newCompetitor, 
                          estimated_monthly_spend: e.target.value ? parseInt(e.target.value) : 0
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 50000"
                        disabled={addingCompetitor || !isAuthenticated()}
                      />
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            setShowAddCompetitorModal(false);
                            resetCompetitorForm();
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                          disabled={addingCompetitor}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddCompetitor}
                          disabled={addingCompetitor || !newCompetitor.name.trim() || !isAuthenticated()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {addingCompetitor ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              {isAuthenticated() ? 'Add Competitor' : 'Login Required'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Competitor Ad Surveillance</h1>
            <p className="text-gray-600 mt-2">Real-time intelligence across all advertising platforms</p>
            
            {/* User Info Display */}
            {userInfo && (
              <div className="flex items-center gap-2 mt-1">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {userInfo.name}
                </span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-600">{userInfo.email}</span>
                <button
                  onClick={handleLogout}
                  className="ml-2 text-xs text-red-600 hover:text-red-800 hover:underline"
                >
                  (Logout)
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {/* User Status Badge */}
            {userInfo ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 border border-green-200 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Authenticated</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Demo Mode</span>
              </div>
            )}

            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              dbStatus === 'connected' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }`}>
              {dbStatus === 'connected' ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span>Live Database</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Demo Mode</span>
                </>
              )}
            </div>

            {/* Add Competitor Button */}
            <button
              onClick={() => setShowAddCompetitorModal(true)}
              disabled={!isAuthenticated()}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                isAuthenticated()
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isAuthenticated() ? 'Add Competitor' : 'Login to Add'}
            </button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search campaigns or competitors..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                loadData();
              }}
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button 
              onClick={checkDatabaseStatus}
              className="flex items-center px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${dbStatus === 'checking' ? 'animate-spin' : ''}`} />
              {dbStatus === 'checking' ? 'Checking...' : 'Check Connection'}
            </button>
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              disabled={!isAuthenticated()}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Database Info Banner */}
        {connectionInfo && (
          <div className={`p-4 rounded-lg mb-4 ${
            dbStatus === 'connected' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {dbStatus === 'connected' ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Connected to Database</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium">Using Demo Data</span>
                  </>
                )}
                <span className="text-sm text-gray-600">
                  {dbStatus === 'connected' 
                    ? `Fetching user-specific data${userInfo ? ` for ${userInfo.name}` : ''}`
                    : 'Login for personalized data'
                  }
                </span>
              </div>
              {!isAuthenticated() && (
                <a 
                  href="/login" 
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Login for Personalized Data →
                </a>
              )}
            </div>
            {connectionInfo.error && (
              <p className="mt-2 text-sm text-red-600">{connectionInfo.error}</p>
            )}
            {userInfo && (
              <p className="mt-2 text-sm text-blue-600">
                User ID: {userInfo.user_id} • Viewing personalized analytics
              </p>
            )}
          </div>
        )}
      </div>

      {/* Data View Toggle Section */}
      <div className="mb-8 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Data View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleDataViewModeChange('latest')}
                  className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                    dataViewMode === 'latest'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Latest Ads
                </button>
                <button
                  onClick={() => handleDataViewModeChange('historical')}
                  className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                    dataViewMode === 'historical'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Historical Data
                </button>
              </div>
              
              <div className="flex items-center gap-2 ml-2">
                <div className={`w-2 h-2 rounded-full ${
                  dataViewMode === 'latest' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {dataViewMode === 'latest' ? 'Latest Date Only' : 'All Dates'}
                </span>
              </div>
            </div>
          </div>

          {dataViewMode === 'historical' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  max={dateRange.endDate}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <button
                onClick={handleApplyDateFilter}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Apply Filter
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-3 text-sm text-gray-600">
          {dataViewMode === 'latest' ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>
                Showing ads from the most recent date in {dbStatus === 'connected' ? 'your database' : 'demo data'}
                {userInfo && ` for ${userInfo.name}`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>
                Showing historical data from {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
                {userInfo && ` for ${userInfo.name}`}
                {!isAuthenticated() && ' (demo mode with simulated historical data)'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Competitor Spend */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 relative">
          {!isAuthenticated() && (
            <div className="absolute top-2 right-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
              Demo
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center text-green-500">
              {getTrendIcon(18)}
              <span className="ml-1 text-sm font-semibold">18%</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {summaryData ? formatCurrency(summaryData.total_competitor_spend) : '$124.3K'}
          </h3>
          <p className="text-gray-600 mt-1">Total Competitor Spend</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {userInfo ? `For ${userInfo.name}'s competitors` : 'Demo data - login for personalized'}
            </p>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 relative">
          {!isAuthenticated() && (
            <div className="absolute top-2 right-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
              Demo
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center text-green-500">
              {getTrendIcon(12)}
              <span className="ml-1 text-sm font-semibold">12%</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {summaryData ? formatNumber(summaryData.active_campaigns_count) : '1,247'}
          </h3>
          <p className="text-gray-600 mt-1">Active Campaigns</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {userInfo ? 'Your tracked competitors' : 'across all platforms'}
            </p>
          </div>
        </div>

        {/* Total Impressions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 relative">
          {!isAuthenticated() && (
            <div className="absolute top-2 right-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
              Demo
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex items-center text-red-500">
              {getTrendIcon(-3)}
              <span className="ml-1 text-sm font-semibold">3%</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {summaryData ? formatNumber(summaryData.total_impressions) : '12.4M'}
          </h3>
          <p className="text-gray-600 mt-1">Total Impressions</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {userInfo ? 'For your competitors' : 'combined reach'}
            </p>
          </div>
        </div>

        {/* Average CTR */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 relative">
          {!isAuthenticated() && (
            <div className="absolute top-2 right-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
              Demo
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MousePointer className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex items-center text-green-500">
              {getTrendIcon(7)}
              <span className="ml-1 text-sm font-semibold">7%</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {summaryData ? formatPercentage(summaryData.average_ctr) : '3.42%'}
          </h3>
          <p className="text-gray-600 mt-1">Avg. CTR</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {userInfo ? 'Your competitors\' performance' : 'industry benchmark'}
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Advertising Analytics Dashboard</h2>
            {userInfo && (
              <p className="text-sm text-gray-600 mt-1">
                Personalized analytics for {userInfo.name}'s competitors
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={loadAnalyticsData}
              disabled={analyticsLoading}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${analyticsLoading ? 'animate-spin' : ''}`} />
              {analyticsLoading ? 'Refreshing...' : 'Refresh Analytics'}
            </button>
          </div>
        </div>

        {/* Chart Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'competitorSpend', label: 'Competitor Spend', icon: <BarChartIcon className="w-4 h-4" /> },
              { id: 'spendRanges', label: 'Spend Ranges', icon: <PieChartIcon className="w-4 h-4" /> },
              { id: 'ctrPerformance', label: 'CTR Performance', icon: <Target className="w-4 h-4" /> },
              { id: 'spendImpressions', label: 'Efficiency', icon: <LineChartIcon className="w-4 h-4" /> },
              { id: 'platformCTR', label: 'Platform CTR', icon: <Radar className="w-4 h-4" /> }
            ].map((chart) => (
              <button
                key={chart.id}
                onClick={() => setActiveChart(chart.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  activeChart === chart.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {chart.icon}
                <span>{chart.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Charts Grid */}
        {analyticsLoading ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics data...</p>
            <p className="text-sm text-gray-500 mt-2">
              {userInfo ? `Fetching data for ${userInfo.name}` : 'Using demo data...'}
            </p>
          </div>
        ) : analyticsData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Competitor Spend Distribution */}
            {activeChart === 'competitorSpend' && analyticsData.competitorSpend.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Top Competitors by Ad Spend</h3>
                  {userInfo && (
                    <span className="text-sm text-blue-600">
                      Your tracked competitors
                    </span>
                  )}
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.competitorSpend}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" tickFormatter={formatCurrencyShort} />
                      <YAxis 
                        type="category" 
                        dataKey="competitor_name" 
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value: any) => [formatCurrencyShort(value), 'Total Spend']}
                        labelFormatter={(label) => `Competitor: ${label}`}
                      />
                      <Bar 
                        dataKey="total_spend" 
                        name="Total Spend" 
                        fill="#4F46E5"
                        radius={[0, 4, 4, 0]}
                      >
                        {analyticsData.competitorSpend.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 40}, 70%, 60%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {analyticsData.competitorSpend.slice(0, 4).map((competitor, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium text-gray-900">{competitor.competitor_name}</div>
                      <div className="text-blue-600 font-semibold">{formatCurrencyShort(competitor.total_spend)}</div>
                      <div className="text-gray-500 text-xs">
                        {competitor.ad_count} ads • CTR: {formatCTR(competitor.avg_ctr)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chart 2: Spend Range Distribution */}
            {activeChart === 'spendRanges' && analyticsData.spendRanges.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ad Spend Range Distribution</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={analyticsData.spendRanges}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="spend_range" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          if (name === 'ad_count') return [value, 'Number of Ads'];
                          if (name === 'total_spend') return [formatCurrencyShort(value), 'Total Spend'];
                          return [value, name];
                        }}
                      />
                      <Bar 
                        yAxisId="left"
                        dataKey="ad_count" 
                        name="Number of Ads"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone"
                        dataKey="avg_ctr"
                        name="Avg CTR"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {analyticsData.spendRanges.map((range, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{range.spend_range}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{range.ad_count} ads</span>
                        <span className="text-sm text-green-600">{formatCTR(range.avg_ctr)} CTR</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chart 3: CTR Performance Distribution */}
            {activeChart === 'ctrPerformance' && analyticsData.ctrPerformance.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">CTR Performance Distribution</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.ctrPerformance}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ ctr_performance, percentage }) => `${ctr_performance}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                        nameKey="ctr_performance"
                      >
                        {analyticsData.ctrPerformance.map((entry, index) => {
                          const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value}%`, 'Percentage']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-3">
                  {analyticsData.ctrPerformance.map((perf, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ 
                            backgroundColor: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'][index % 5] 
                          }}
                        />
                        <span className="text-sm font-medium">{perf.ctr_performance}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{perf.ad_count} ads</div>
                        <div className="text-xs text-gray-500">Avg: {formatCurrencyShort(perf.avg_spend)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chart 4: Impressions vs Spend Correlation */}
            {activeChart === 'spendImpressions' && analyticsData.spendImpressions.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Spend Efficiency Analysis</h3>
                  {userInfo && (
                    <span className="text-sm text-blue-600">
                      Efficiency metrics for your competitors
                    </span>
                  )}
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 30, bottom: 20, left: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number" 
                        dataKey="total_spend" 
                        name="Total Spend"
                        tickFormatter={formatCurrencyShort}
                        label={{ value: 'Total Spend ($)', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="impressions_per_dollar" 
                        name="Impressions per $"
                        label={{ value: 'Impressions per Dollar', angle: -90, position: 'insideLeft' }}
                      />
                      <ZAxis 
                        type="number" 
                        dataKey="avg_ctr" 
                        range={[50, 400]} 
                        name="Avg CTR"
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          if (name === 'total_spend') return [formatCurrencyShort(value), 'Total Spend'];
                          if (name === 'impressions_per_dollar') return [value.toLocaleString(), 'Impressions/$'];
                          if (name === 'avg_ctr') return [formatCTR(value), 'Avg CTR'];
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Competitor: ${label}`}
                      />
                      <Legend />
                      <Scatter 
                        name="Competitors" 
                        data={analyticsData.spendImpressions} 
                        fill="#8884d8"
                        shape="circle"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">Top Performers (Highest Impressions per Dollar):</div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {analyticsData.spendImpressions.slice(0, 5).map((item, index) => (
                      <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg">
                        <div className="font-semibold text-gray-900 truncate">{item.competitor_name}</div>
                        <div className="text-blue-600 font-bold text-lg">{item.impressions_per_dollar.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">impressions/$</div>
                        <div className="text-xs mt-1">Spend: {formatCurrencyShort(item.total_spend)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chart 5: Platform vs CTR Heatmap */}
            {activeChart === 'platformCTR' && analyticsData.platformCTR.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Platform Performance Comparison</h3>
                  {userInfo && (
                    <span className="text-sm text-blue-600">
                      Where your competitors advertise
                    </span>
                  )}
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analyticsData.platformCTR}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="platform" />
                      <PolarRadiusAxis angle={30} domain={[0, 0.05]} />
                      <Radar
                        name="Avg CTR"
                        dataKey="avg_ctr"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.6}
                      />
                      <Tooltip 
                        formatter={(value: any) => [formatCTR(value), 'Average CTR']}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {analyticsData.platformCTR.map((platform, index) => (
                    <div 
                      key={index} 
                      className="p-4 rounded-lg text-center"
                      style={{ backgroundColor: `${platform.color}20` }}
                    >
                      <div 
                        className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: platform.color }}
                      >
                        {platform.platform.charAt(0)}
                      </div>
                      <div className="font-semibold text-gray-900">{platform.platform}</div>
                      <div className="text-lg font-bold" style={{ color: platform.color }}>
                        {formatCTR(platform.avg_ctr)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {platform.ad_count} ads • {formatCurrencyShort(platform.total_spend)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {userInfo ? 'No Analytics Data Available Yet' : 'Login for Personalized Analytics'}
            </h3>
            <p className="text-gray-600 mb-6">
              {userInfo 
                ? 'Start tracking competitors to see analytics data.'
                : 'Connect to your account to see personalized analytics.'}
            </p>
            {!userInfo ? (
              <a
                href="/login"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Login
              </a>
            ) : (
              <button
                onClick={loadAnalyticsData}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Loading Analytics
              </button>
            )}
          </div>
        )}
      </div>

      {/* Live Ad Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Live Ad Feed</h2>
            <div className="flex items-center gap-2">
              {dataViewMode === 'latest' && (
                <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Latest
                </span>
              )}
              {dataViewMode === 'historical' && (
                <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Historical
                </span>
              )}
              {!isAuthenticated() && (
                <span className="text-sm px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                  Demo Data
                </span>
              )}
              {userInfo && (
                <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded">
                  {userInfo.name}'s Feed
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center text-gray-600 hover:text-gray-900">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
            <button className="flex items-center text-gray-600 hover:text-gray-900">
              <BarChart3 className="w-4 h-4 mr-2" />
              Insights
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {dailyMetrics.length > 0 ? (
            dailyMetrics.map((ad) => (
              <div key={ad.id} className="p-6 hover:bg-gray-50 transition-colors">
                {/* Ad Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
                        {ad.competitor_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{ad.competitor_name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ad.platform)} text-white`}>
                            {ad.platform}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadge(ad.status)}`}>
                            {ad.status}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {formatDate(ad.date)}
                          </span>
                          {!isAuthenticated() && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              Demo
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 font-medium mt-1">{ad.ad_title}</p>
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                {/* Ad Body */}
                <p className="text-gray-600 mb-6">{ad.ad_body}</p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Daily Spend</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(ad.daily_spend)}</p>
                    {ad.spend_lower_bound && ad.spend_upper_bound && (
                      <p className="text-xs text-gray-500">
                        ${ad.spend_lower_bound.toFixed(0)} - ${ad.spend_upper_bound.toFixed(0)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Impressions</p>
                    <p className="font-semibold text-gray-900">{formatNumber(ad.daily_impressions)}</p>
                    {ad.impressions_lower_bound && ad.impressions_upper_bound && (
                      <p className="text-xs text-gray-500">
                        {formatNumber(ad.impressions_lower_bound)} - {formatNumber(ad.impressions_upper_bound)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CTR</p>
                    <p className="font-semibold text-gray-900">{formatPercentage(ad.daily_ctr)}</p>
                    <p className="text-xs text-gray-500">industry avg: 2.1%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Variants</p>
                    <p className="font-semibold text-gray-900">{ad.variants || 1} creatives</p>
                    <p className="text-xs text-gray-500">A/B testing</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">A/B Tests</p>
                    <p className="font-semibold text-gray-900">{ad.ab_tests || 0} active</p>
                    <p className="text-xs text-gray-500">in progress</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Analyze
                  </button>
                  <button className="flex items-center px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors">
                    <Copy className="w-4 h-4 mr-2" />
                    Clone Strategy
                  </button>
                  <button className="flex items-center px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors">
                    <Eye className="w-4 h-4 mr-2" />
                    Track
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Eye className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Ads Found</h3>
              <p className="text-gray-600 mb-6">
                {userInfo 
                  ? dataViewMode === 'latest' 
                    ? 'No ads found for your competitors on the latest date. Try switching to Historical Data view.'
                    : 'No ads found for your competitors in the selected date range. Try adjusting the date range.'
                  : 'Login to track competitors and see ads.'}
              </p>
              {userInfo ? (
                dataViewMode === 'latest' ? (
                  <button
                    onClick={() => handleDataViewModeChange('historical')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Switch to Historical Data View
                  </button>
                ) : (
                  <button
                    onClick={() => handleDataViewModeChange('latest')}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Switch to Latest Data View
                  </button>
                )
              ) : (
                <a
                  href="/login"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Login to See Ads
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>Data updated in real-time • Last refresh: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        <p className="mt-1">
          {userInfo 
            ? `Monitoring ${dailyMetrics.length} active ads for ${userInfo.name}'s competitors across ${platformDistribution.length} platforms`
            : `Monitoring ${dailyMetrics.length} active ads across ${platformDistribution.length} platforms (demo mode)`}
          {dataViewMode === 'latest' && ' • Showing latest ads only'}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setShowAddCompetitorModal(true)}
            className={`inline-flex items-center text-sm ${
              isAuthenticated() 
                ? 'text-blue-600 hover:text-blue-800 hover:underline' 
                : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isAuthenticated()}
          >
            <Plus className="w-3 h-3 mr-1" />
            {isAuthenticated() ? 'Add a new competitor to surveillance' : 'Login to add competitors'}
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dataViewMode === 'latest' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
            <span className="text-xs">
              {dataViewMode === 'latest' ? 'Latest Data Mode' : 'Historical Data Mode'}
            </span>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh Data
          </button>
          {userInfo && (
            <div className="flex items-center gap-2 text-xs">
              <User className="w-3 h-3" />
              <span>Viewing as: {userInfo.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdSurveillance;