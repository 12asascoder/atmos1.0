/* =====================================================
   ADSURV – Unified Frontend API Service
   Backend: FastAPI (JWT via Flask Auth)
===================================================== */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/* =========================
   Helper Functions (Moved to Top)
========================= */

// Helper function to parse string spend values to numbers
export const parseSpendValue = (spend: string | number | null | undefined): number => {
  if (spend === undefined || spend === null) return 0;
  
  if (typeof spend === 'number') return spend;
  
  const str = String(spend).trim();
  
  // Handle ranges like "$7K - $8K"
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 2) {
      const start = parseSpendValue(parts[0].trim());
      const end = parseSpendValue(parts[1].trim());
      return (start + end) / 2; // Return average
    }
  }
  
  // Handle >, < symbols
  const cleanStr = str.replace(/[<>$,\s]/g, '');
  
  // Handle K, M suffixes
  if (cleanStr.toLowerCase().includes('k')) {
    return parseFloat(cleanStr.toLowerCase().replace('k', '')) * 1000;
  }
  if (cleanStr.toLowerCase().includes('m')) {
    return parseFloat(cleanStr.toLowerCase().replace('m', '')) * 1000000;
  }
  
  return parseFloat(cleanStr) || 0;
};

// Helper function to parse impression values
export const parseImpressionValue = (impressions: string | number | null | undefined): number => {
  if (impressions === undefined || impressions === null) return 0;
  
  if (typeof impressions === 'number') return impressions;
  
  const str = String(impressions).trim();
  
  // Handle ranges like "100K - 125K"
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 2) {
      const start = parseImpressionValue(parts[0].trim());
      const end = parseImpressionValue(parts[1].trim());
      return (start + end) / 2; // Return average
    }
  }
  
  // Handle >, < symbols
  let cleanStr = str.replace(/[<>$,\s]/g, '');
  
  // If it started with <, return half the value
  if (str.trim().startsWith('<')) {
    const val = parseImpressionValue(cleanStr);
    return val / 2;
  }
  
  // Handle K, M suffixes
  if (cleanStr.toLowerCase().includes('k')) {
    return parseFloat(cleanStr.toLowerCase().replace('k', '')) * 1000;
  }
  if (cleanStr.toLowerCase().includes('m')) {
    return parseFloat(cleanStr.toLowerCase().replace('m', '')) * 1000000;
  }
  
  return parseFloat(cleanStr) || 0;
};

/* =========================
   Types for Metrics
========================= */

export interface MetricsData {
  id: string;
  competitor_id: string;
  calculated_at: string;
  time_period: string;
  start_date: string;
  end_date: string;
  total_ads: number;
  active_ads: number;
  ads_per_platform: Record<string, number>;
  estimated_daily_spend: string | number;
  estimated_weekly_spend: string | number;
  estimated_monthly_spend: string | number;
  total_spend: string | number;
  avg_cpm: string | number;
  avg_cpc: string | number;
  avg_ctr: string | number;
  avg_frequency: string | number;
  conversion_probability: string | number;
  creative_performance: Record<string, any>;
  top_performing_creatives: Array<any>;
  funnel_stage_distribution: Record<string, number>;
  audience_clusters: Array<any>;
  geo_penetration: Record<string, number>;
  device_distribution: Record<string, number>;
  time_of_day_heatmap: Record<string, number>;
  ad_timeline: Array<any>;
  trends: Record<string, any>;
  recommendations: string[];
  risk_score: number;
  opportunity_score: number;
  created_at: string;
  updated_at: string;
  competitor_name?: string;
}

export interface MetricsSummary {
  competitor_id: string;
  competitor_name: string;
  last_calculated: string;
  active_ads: number;
  estimated_monthly_spend: string;
  avg_ctr: string;
  risk_score: number;
  opportunity_score: number;
}

export interface PlatformStats {
  platform: string;
  ad_count: number;
  total_spend: number;
  avg_ctr: number;
  percentage: number;
  color: string;
}

// FIXED: Made fields optional and added proper types
export interface TrendingAd {
  platform: string;
  id?: string;
  title: string;
  description?: string;
  url?: string;
  image_url?: string;
  thumbnail?: string;
  video_url?: string;
  views?: number | string;
  likes?: number | string;
  comments?: number | string;
  shares?: number | string;
  impressions?: number | string;
  spend?: number | string;
  created_at?: string;
  published_at?: string;
  taken_at?: string;
  score: number;
  rank?: number;
  type?: string;
  channel?: string;
  owner?: string;
  advertiser?: string;
  headline?: string;
  metadata?: Record<string, any>;
  competitor_name?: string;
}

// FIXED: Removed non-existent fields
export interface TrendingSearchResponse {
  task_id?: string | null;
  status: string;
  keyword: string;
  results: Record<string, TrendingAd[]>;
  summary: {
    total_results: number;
    platforms_searched: string[];
    top_score: number;
    average_score: number;
  };
  top_trending: TrendingAd[];
  platform_performance: Record<string, number>;
  error?: string;
}

/* =========================
   Auth Helpers
========================= */

const getToken = (): string | null => localStorage.getItem('token');

const fetchWithAuth = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || `API Error: ${res.status}`);
  }

  return res.json();
};

/* =====================================================
   USERS
===================================================== */

export const UsersAPI = {
  getMe: () => fetchWithAuth('/api/users/me'),

  updateMe: (data: {
    name?: string;
    business_type?: string;
    industry?: string;
    goals?: string;
  }) =>
    fetchWithAuth('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (data: {
    current_password: string;
    new_password: string;
  }) =>
    fetchWithAuth('/api/users/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  stats: () => fetchWithAuth('/api/users/stats'),

  deleteAccount: () =>
    fetchWithAuth('/api/users/account', { method: 'DELETE' }),
};

/* =====================================================
   COMPETITORS
===================================================== */

export const CompetitorsAPI = {
  list: () => fetchWithAuth('/api/competitors/'),

  create: (data: {
    name: string;
    domain?: string;
    industry?: string;
    estimated_monthly_spend?: number;
  }) =>
    fetchWithAuth('/api/competitors/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (competitor_id: string) =>
    fetchWithAuth(`/api/competitors/${competitor_id}`, {
      method: 'DELETE',
    }),
};

/* =====================================================
   ADS
===================================================== */

export const AdsAPI = {
  refreshCompetitor: (
    competitor_id: string,
    platforms?: string[]
  ) =>
    fetchWithAuth(
      `/api/ads/refresh/${competitor_id}` +
        (platforms ? `?platforms=${platforms.join(',')}` : ''),
      { method: 'POST' }
    ),

  refreshAll: (platforms?: string[]) =>
    fetchWithAuth(
      `/api/ads/refresh-all` +
        (platforms ? `?platforms=${platforms.join(',')}` : ''),
      { method: 'POST' }
    ),

  getCompetitorAds: (
    competitor_id: string,
    platform?: string,
    limit: number = 100
  ) => {
    const params = new URLSearchParams();
    if (platform) params.append('platform', platform);
    params.append('limit', String(limit));
    
    return fetchWithAuth(`/api/ads/competitor/${competitor_id}?${params}`);
  },

  fetchHistory: (limit = 20, status_filter?: string) => {
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    if (status_filter) params.append('status_filter', status_filter);
    
    return fetchWithAuth(`/api/ads/fetches?${params}`);
  },
};

/* =====================================================
   PLATFORMS
===================================================== */

export const PlatformsAPI = {
  fetch: (data: {
    competitor_id: string;
    platforms: string[];
  }) =>
    fetchWithAuth('/api/platforms/fetch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  fetchSync: (data: {
    competitor_id: string;
    platforms: string[];
  }) =>
    fetchWithAuth('/api/platforms/fetch-sync', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: () => fetchWithAuth('/api/platforms/platforms'),

  test: (platform_id: string, query: string = 'nike') =>
    fetchWithAuth(`/api/platforms/platform/${platform_id}/test?query=${query}`),

  status: () => fetchWithAuth('/api/platforms/status'),

  credits: () => fetchWithAuth('/api/platforms/credits'),
};

/* =====================================================
   METRICS (SURV_METRICS)
===================================================== */

export const MetricsAPI = {
  calculate: (data: {
    competitor_ids?: string[];
    time_period: 'daily' | 'weekly' | 'monthly' | 'all_time';
    force_recalculate?: boolean;
  }) =>
    fetchWithAuth('/api/metrics/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getByCompetitor: (
    competitor_id: string,
    time_period?: string,
    limit: number = 10
  ): Promise<MetricsData[]> => {
    const params = new URLSearchParams();
    if (time_period) params.append('time_period', time_period);
    params.append('limit', String(limit));
    
    return fetchWithAuth(`/api/metrics/competitor/${competitor_id}?${params}`);
  },

  getLatestMetrics: (): Promise<MetricsData[]> => {
    return fetchWithAuth('/api/metrics/summary').then(summary => {
      return summary.map((item: any) => ({
        id: '',
        competitor_id: item.competitor_id,
        competitor_name: item.competitor_name,
        calculated_at: item.last_calculated,
        time_period: 'weekly',
        start_date: '',
        end_date: '',
        total_ads: 0,
        active_ads: item.active_ads,
        ads_per_platform: {},
        estimated_daily_spend: 0,
        estimated_weekly_spend: 0,
        estimated_monthly_spend: item.estimated_monthly_spend,
        total_spend: 0,
        avg_cpm: 0,
        avg_cpc: 0,
        avg_ctr: item.avg_ctr,
        avg_frequency: 0,
        conversion_probability: 0,
        creative_performance: {},
        top_performing_creatives: [],
        funnel_stage_distribution: {},
        audience_clusters: [],
        geo_penetration: {},
        device_distribution: {},
        time_of_day_heatmap: {},
        ad_timeline: [],
        trends: {},
        recommendations: [],
        risk_score: item.risk_score,
        opportunity_score: item.opportunity_score,
        created_at: '',
        updated_at: ''
      }));
    });
  },

  getMetricsByTimePeriod: (time_period: string): Promise<MetricsData[]> => {
    return fetchWithAuth(`/api/metrics/competitor/all?time_period=${time_period}`).catch(() => []);
  },

  summary: (): Promise<MetricsSummary[]> => {
    return fetchWithAuth('/api/metrics/summary');
  },

  platformStats: (): Promise<any> => {
    return fetchWithAuth('/api/metrics/platform-stats');
  },

  getDetailedMetrics: (metrics_id: string): Promise<MetricsData> => {
    return fetchWithAuth(`/api/metrics/${metrics_id}`);
  },

  delete: (metrics_id: string) =>
    fetchWithAuth(`/api/metrics/${metrics_id}`, {
      method: 'DELETE',
    }),

  test: () => fetchWithAuth('/api/metrics/test'),

  getMetricsOverview: async (): Promise<{
    totalCompetitors: number;
    totalAdsTracked: number;
    totalSpend: number;
    avgCtr: number;
    topPerformers: MetricsSummary[];
  }> => {
    try {
      const summary = await fetchWithAuth('/api/metrics/summary');
      const totalAdsTracked = summary.reduce((sum: number, item: MetricsSummary) => sum + item.active_ads, 0);
      const totalSpend = summary.reduce((sum: number, item: MetricsSummary) => {
        const spend = parseFloat(item.estimated_monthly_spend.replace(/[^0-9.-]+/g, ''));
        return sum + (isNaN(spend) ? 0 : spend);
      }, 0);
      const avgCtr = summary.reduce((sum: number, item: MetricsSummary) => {
        const ctr = parseFloat(item.avg_ctr);
        return sum + (isNaN(ctr) ? 0 : ctr);
      }, 0) / (summary.length || 1);

      return {
        totalCompetitors: summary.length,
        totalAdsTracked,
        totalSpend,
        avgCtr,
        topPerformers: summary.sort((a: MetricsSummary, b: MetricsSummary) => b.opportunity_score - a.opportunity_score).slice(0, 5)
      };
    } catch (error) {
      console.error('Error getting metrics overview:', error);
      return {
        totalCompetitors: 0,
        totalAdsTracked: 0,
        totalSpend: 0,
        avgCtr: 0,
        topPerformers: []
      };
    }
  }
};

/* =====================================================
   TRENDING - FIXED & ENHANCED
===================================================== */

export const TrendingAPI = {
  search: async (data: {
    keyword: string;
    platforms: string[];
    limit_per_platform?: number;
    async_mode?: boolean;
  }): Promise<TrendingSearchResponse> => {
    // Validate and filter platforms
    const validPlatforms = ['meta', 'reddit', 'linkedin', 'instagram', 'youtube'];
    const filteredPlatforms = data.platforms
      .map(p => p.toLowerCase())
      .filter(platform => validPlatforms.includes(platform));
    
    // Ensure at least one platform
    if (filteredPlatforms.length === 0) {
      throw new Error('At least one valid platform is required');
    }
    
    const payload = {
      keyword: data.keyword.trim(),
      platforms: filteredPlatforms,
      limit_per_platform: data.limit_per_platform || 5,
      async_mode: data.async_mode || false
    };
    
    try {
      const response = await fetchWithAuth('/api/trending/search', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      // Process the response to ensure data consistency
      return processeTrendingResponse(response);
    } catch (error) {
      console.error('Trending search error:', error);
      throw error;
    }
  },

  platforms: () => fetchWithAuth('/api/trending/platforms'),

  stats: () => fetchWithAuth('/api/trending/stats'),

  // Helper to get trending ads for competitors
  getTrendingForCompetitors: async (competitorNames: string[]): Promise<TrendingAd[]> => {
    const allTrendingAds: TrendingAd[] = [];
    
    // Limit to 2 competitors to avoid too many API calls
    for (const name of competitorNames.slice(0, 2)) {
      try {
        const result = await TrendingAPI.search({
          keyword: name,
          platforms: ['meta', 'instagram', 'youtube'],
          limit_per_platform: 3,
          async_mode: false
        });
        
        if (result.top_trending && Array.isArray(result.top_trending)) {
          const competitorAds = result.top_trending.slice(0, 3).map((ad: TrendingAd) => ({
            ...ad,
            competitor_name: name
          }));
          allTrendingAds.push(...competitorAds);
        }
      } catch (error) {
        console.error(`Error getting trending for ${name}:`, error);
        // Continue with next competitor
      }
    }
    
    // Sort by score and limit
    return allTrendingAds
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);
  }
};

/* =====================================================
   SUMMARY METRICS (SUM_METRICS)
===================================================== */

export const SummaryAPI = {
  calculate: (data: {
    time_period: 'daily' | 'weekly' | 'monthly' | 'all_time';
    competitor_ids?: string[];
    force_recalculate?: boolean;
  }) =>
    fetchWithAuth('/api/sum-metrics/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  dashboard: () => fetchWithAuth('/api/sum-metrics/dashboard'),

  history: (limit: number = 10, time_period?: string) => {
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    if (time_period) params.append('time_period', time_period);
    
    return fetchWithAuth(`/api/sum-metrics/history?${params}`);
  },

  current: (time_period: string = 'weekly') =>
    fetchWithAuth(`/api/sum-metrics/current?time_period=${time_period}`),

  refresh: () =>
    fetchWithAuth('/api/sum-metrics/refresh', { method: 'POST' }),
};

/* =====================================================
   HELPER FUNCTIONS FOR TRENDING DATA
===================================================== */

// Process trending response to normalize data types
function processeTrendingResponse(response: TrendingSearchResponse): TrendingSearchResponse {
  // Process each platform's results
  const processedResults: Record<string, TrendingAd[]> = {};
  
  for (const [platform, ads] of Object.entries(response.results)) {
    processedResults[platform] = ads.map(ad => normalizeAdData(ad));
  }
  
  // Process top trending
  const processedTopTrending = response.top_trending?.map(ad => normalizeAdData(ad)) || [];
  
  return {
    ...response,
    results: processedResults,
    top_trending: processedTopTrending
  };
}

// Normalize individual ad data
function normalizeAdData(ad: TrendingAd): TrendingAd {
  return {
    ...ad,
    // Convert string numbers to actual numbers
    views: typeof ad.views === 'string' ? parseImpressionValue(ad.views) : ad.views,
    likes: typeof ad.likes === 'string' ? parseImpressionValue(ad.likes) : ad.likes,
    comments: typeof ad.comments === 'string' ? parseImpressionValue(ad.comments) : ad.comments,
    shares: typeof ad.shares === 'string' ? parseImpressionValue(ad.shares) : ad.shares,
    impressions: typeof ad.impressions === 'string' ? parseImpressionValue(ad.impressions) : ad.impressions,
    spend: typeof ad.spend === 'string' ? parseSpendValue(ad.spend) : ad.spend,
    
    // Ensure score is a number
    score: Number(ad.score) || 0,
    
    // Ensure title exists
    title: ad.title || ad.headline || ad.description?.substring(0, 100) || 'Untitled',
  };
}

// Export helper for use in components
export const normalizeTrendingAd = normalizeAdData;