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
  Phone
} from 'lucide-react';
import { 
  fetchLatestTargetingIntel, 
  type TargetingIntelData, 
  type InterestCluster 
} from '../services/targetingIntel';

// Import Recharts components
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area,
  RadialBarChart, RadialBar,
  ComposedChart
} from 'recharts';

const TargetingIntel: React.FC = () => {
  const [data, setData] = useState<TargetingIntelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
  try {
    setLoading(true);
    const latestData = await fetchLatestTargetingIntel();
    console.log('📊 Full data structure:', latestData);
    console.log('📊 advanced_targeting:', latestData?.advanced_targeting);
    console.log('📊 device_preference:', latestData?.advanced_targeting?.device_preference);
    setData(latestData);
  } catch (err) {
    setError('Failed to load targeting intelligence data');
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  // Safe formatting functions
  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
        <p className="ml-4 text-gray-600">Loading targeting intelligence...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
          <h3 className="text-lg font-semibold text-red-800">Error Loading Data</h3>
        </div>
        <p className="mt-2 text-red-600">{error || 'No targeting intelligence data available'}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
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

  // Prepare data for charts with safe access
  const ageDistributionChartData = Object.entries(safeData.age_distribution).map(([age, percentage]) => ({
    name: age,
    value: (percentage || 0) * 100,
    color: age === '18-24' ? '#3B82F6' : 
           age === '25-34' ? '#10B981' : 
           age === '35-44' ? '#F59E0B' : 
           age === '45-54' ? '#EF4444' : 
           '#8B5CF6'
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

  const interestClustersChartData = safeData.interest_clusters.map((cluster, index) => ({
    name: (cluster.interest || 'Interest').split(' ')[0],
    affinity: (cluster.affinity || 0) * 100,
    reach: (cluster.reach || 0) / 1000, // Convert to K
    fullName: cluster.interest || 'Interest',
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][index % 6]
  }));

  const funnelStageChartData = Object.entries(safeData.funnel_stage_prediction).map(([stage, info]) => ({
    stage: stage.charAt(0).toUpperCase() + stage.slice(1),
    percentage: info?.percentage || 0,
    reach: (info?.reach || 0) / 1000000, // Convert to M
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

  // Custom tooltip components
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value?.toFixed(1) || '0'}{entry.dataKey === 'reach' ? 'K' : entry.dataKey === 'percentage' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center">
              <Target className="w-8 h-8 text-blue-500 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Targeting Intelligence</h1>
            </div>
            <p className="text-gray-600 mt-2">
              AI-powered audience prediction and targeting strategy analysis
              {safeData.competitor_name && (
                <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {safeData.competitor_name}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1 bg-gradient-to-r from-green-100 to-blue-100 text-green-800 rounded-full text-sm font-medium">
              <span className="flex items-center">
                <Brain className="w-4 h-4 mr-1" />
                AI Confidence: {((safeData.confidence_score || 0) * 100).toFixed(0)}%
              </span>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow">
              Export Insights
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Demographics Card with Charts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Audience Demographics</h2>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Age Distribution Chart */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-blue-500" />
                  Age Distribution
                </h3>
                <div className="h-48 min-h-[12rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageDistributionChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
                      <Tooltip 
                        content={<CustomTooltip />}
                        formatter={(value) => [`${value}%`, 'Percentage']}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[4, 4, 0, 0]}
                        animationDuration={1500}
                      >
                        {ageDistributionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {ageDistributionChartData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{item.value.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gender Distribution Chart */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-purple-500" />
                  Gender Distribution
                </h3>
                <div className="h-48 min-h-[12rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderDistributionChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        animationDuration={1500}
                      >
                        {genderDistributionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Percentage']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center mt-4 space-x-4">
                  {genderDistributionChartData.map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                      <span className="font-bold text-gray-900">{item.value.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Geographic Spend with Map Visualization */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Geographic Spend Distribution</h2>
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
            
            {geographicSpendChartData.length > 0 ? (
              <>
                <div className="h-64 min-h-[16rem] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={geographicSpendChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="country" 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${value / 1000}K`}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'spend') return [formatCurrency(value as number), 'Spend'];
                          return [`${value}%`, 'Percentage'];
                        }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      />
                      <Bar 
                        dataKey="spend" 
                        radius={[4, 4, 0, 0]}
                        animationDuration={1500}
                        name="Spend"
                      >
                        {geographicSpendChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-3">
                  {geographicSpendChartData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: `${item.fill}20` }}>
                          <Globe className="w-4 h-4" style={{ color: item.fill }} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.country}</div>
                          <div className="text-sm text-gray-500">{item.percentage}% of total</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{formatCurrency(item.spend)}</div>
                        <div className="text-sm text-gray-500">Total spend</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No geographic spend data available</p>
              </div>
            )}
          </div>

          {/* Interest Clusters with Affinity Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Interest Clusters & Affinity</h2>
              <PieChartIcon className="w-5 h-5 text-gray-400" />
            </div>
            
            {interestClustersChartData.length > 0 ? (
              <>
                <div className="h-64 min-h-[16rem] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={interestClustersChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#6B7280', fontSize: 11 }}
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
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'affinity') return [`${value}%`, 'Affinity'];
                          return [`${value}K`, 'Reach'];
                        }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      />
                      <Bar 
                        yAxisId="left"
                        dataKey="affinity" 
                        radius={[4, 4, 0, 0]}
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
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Reach"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  {safeData.interest_clusters.map((cluster: InterestCluster, index: number) => (
                    <div key={index} className="p-4 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors hover:shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{cluster.interest || `Interest ${index + 1}`}</h3>
                        <div className="flex items-center">
                          <div className="px-3 py-1 rounded-full text-sm font-bold" style={{ 
                            backgroundColor: `${interestClustersChartData[index]?.color || '#3B82F6'}20`, 
                            color: interestClustersChartData[index]?.color || '#3B82F6'
                          }}>
                            {(cluster.affinity || 0) * 100}% affinity
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Potential Reach</span>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">{formatNumber(cluster.reach)}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${(cluster.affinity || 0) * 100}%`,
                              background: `linear-gradient(90deg, ${interestClustersChartData[index]?.color || '#3B82F6'} 0%, ${interestClustersChartData[index]?.color || '#3B82F6'}80 100%)`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PieChartIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No interest cluster data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Funnel Stage Prediction with Radial Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Customer Journey Funnel</h2>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="h-64 min-h-[16rem] mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  innerRadius="20%" 
                  outerRadius="90%" 
                  data={funnelStageChartData} 
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar 
                    label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
                    background
                    dataKey="percentage"
                    animationDuration={1500}
                  >
                    {funnelStageChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </RadialBar>
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'percentage') return [`${value}%`, 'Stage'];
                      if (name === 'reach') return [`${value != null ? (value as number).toFixed(2) : '0'}M`, 'Reach'];
                      return [value, name];
                    }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Legend 
                    iconSize={10}
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ right: -20 }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(safeData.funnel_stage_prediction).map(([stage, info]) => (
                <div key={stage} className="text-center p-4 rounded-lg hover:shadow-sm transition-shadow" style={{ 
                  backgroundColor: (funnelStageChartData.find(s => s.stage.toLowerCase() === stage)?.color || '#3B82F6') + '10'
                }}>
                  <div className="text-sm text-gray-600 capitalize">{stage}</div>
                  <div className="text-2xl font-bold text-gray-900 mt-2" style={{ 
                    color: funnelStageChartData.find(s => s.stage.toLowerCase() === stage)?.color || '#3B82F6'
                  }}>
                    {(info?.percentage || 0)}%
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{formatNumber(info?.reach)}</div>
                  <div className="text-xs text-gray-400 mt-2">{info?.label || stage}</div>
                </div>
              ))}
            </div>

            {/* AI Recommendation */}
            {safeData.advanced_targeting.ai_recommendation && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Brain className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">AI Recommendation</h4>
                    <p className="text-blue-700">{safeData.advanced_targeting.ai_recommendation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Targeting Insights with Charts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Advanced Targeting Insights</h2>
              <Award className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Device Preference Donut Chart */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Device Preference</h3>
                </div>
                <div className="h-40 min-h-[10rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={devicePreferenceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {devicePreferenceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {devicePreferenceData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <span className="font-medium text-gray-900">{item.value.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-gray-600">
                 <span className="font-medium">iOS share:</span> {(safeData.advanced_targeting?.device_preference?.ios_share || 0) * 100}%
                </div>
              </div>

              {/* Purchase Intent Gauge */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg mr-3">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Purchase Intent</h3>
                </div>
                <div className="h-40 min-h-[10rem] flex items-center justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-8 border-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {((safeData.advanced_targeting.purchase_intent.confidence || 0) * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-600">Confidence</div>
                      </div>
                    </div>
                    <div 
                      className="absolute top-0 left-0 w-32 h-32 rounded-full border-8 border-transparent border-t-green-500 border-r-green-500"
                      style={{
                        transform: `rotate(${(safeData.advanced_targeting.purchase_intent.confidence || 0) * 360}deg)`
                      }}
                    ></div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    safeData.advanced_targeting.purchase_intent.level === 'High' 
                      ? 'bg-green-100 text-green-800'
                      : safeData.advanced_targeting.purchase_intent.level === 'Medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {safeData.advanced_targeting.purchase_intent.level || 'Low'} Intent
                  </span>
                </div>
              </div>
            </div>

            {/* Competitor Overlap */}
            <div className="mt-6 p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Competitor Overlap Analysis</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{safeData.advanced_targeting.competitor_overlap.brands || 0}</div>
                  <div className="text-sm text-gray-600">brands overlapping</div>
                </div>
                <div className="text-gray-600 text-sm max-w-[200px] bg-gray-50 p-3 rounded-lg">
                  {safeData.advanced_targeting.competitor_overlap.description || 'No overlap data available'}
                </div>
              </div>
            </div>
          </div>

          {/* Bidding Strategy with Time Series */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Bidding Strategy Analysis</h2>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            
            {biddingHourlyChartData.length > 0 ? (
              <>
                <div className="h-64 min-h-[16rem] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={biddingHourlyChartData}>
                      <defs>
                        <linearGradient id="colorCpm" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCpc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${value}`}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          const label = name === 'cpm' ? 'CPM' : 'CPC';
                          return [`$${value}`, label];
                        }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="cpm" 
                        stroke="#3B82F6" 
                        fillOpacity={1} 
                        fill="url(#colorCpm)" 
                        name="CPM"
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cpc" 
                        stroke="#10B981" 
                        fillOpacity={1} 
                        fill="url(#colorCpc)" 
                        name="CPC"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CPM vs CPC */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-blue-500" />
                      Cost Metrics
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="text-sm text-gray-600">Peak CPM</div>
                        <div className="text-2xl font-bold text-blue-600">
                          ${(safeData.bidding_strategy.peak_cpm.value || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">{safeData.bidding_strategy.peak_cpm.window || 'Not available'}</div>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                        <div className="text-sm text-gray-600">Average CPC</div>
                        <div className="text-2xl font-bold text-green-600">
                          ${(safeData.bidding_strategy.avg_cpc || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">Daily average</div>
                      </div>
                    </div>
                  </div>

                  {/* Best Time */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-purple-500" />
                      Optimal Timing
                    </h3>
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg mr-3">
                          <Clock className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Best Performance Window</div>
                          <div className="text-xl font-bold text-purple-700">{safeData.bidding_strategy.best_time || 'Not available'}</div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">Lowest cost per acquisition during this period</p>
                      <div className="mt-4 flex items-center text-sm text-gray-500">
                        <div className="w-3 h-3 bg-blue-400 rounded mr-2"></div>
                        <span>CPM: ${(safeData.bidding_strategy.avg_cpc || 0).toFixed(2)} avg</span>
                        <div className="w-3 h-3 bg-green-400 rounded mx-4"></div>
                        <span>CPC: ${(safeData.bidding_strategy.avg_cpc || 0).toFixed(2)} avg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No bidding strategy data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TargetingIntel;