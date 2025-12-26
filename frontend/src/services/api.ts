// src/services/api.ts
/* =========================
   API Endpoints Configuration
========================= */

const API_ENDPOINTS = {
  AUTH: 'http://localhost:5003',
  ANALYTICS: 'http://localhost:5007',
  DAILY_METRICS: 'http://localhost:5008',
  COMPETITORS: 'http://localhost:5009'
};

/* =========================
   TypeScript Interfaces
========================= */

export interface SummaryMetrics {
  id: string;
  total_competitor_spend: number;
  active_campaigns_count: number;
  total_impressions: number;
  average_ctr: number;
  platform_distribution: Record<string, number>;
  top_performers: any[];
  spend_by_industry: Record<string, number>;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface AdCardData {
  id: string;
  date: string;
  competitor_name: string;
  platform: string;
  status: string;
  daily_spend: number;
  daily_impressions: number;
  daily_ctr: number;
  ad_title?: string;
  ad_body?: string;
  spend_lower_bound?: number;
  spend_upper_bound?: number;
  impressions_lower_bound?: number;
  impressions_upper_bound?: number;
  variants?: number;
  ab_tests?: number;
}

export interface FetchMetricsOptions {
  date?: string;
  limit?: number;
  showLatestOnly?: boolean;
  startDate?: string;
  endDate?: string;
}

/* =========================
   Analytics Interfaces
========================= */

export interface CompetitorSpendData {
  competitor_name: string;
  total_spend: number;
  ad_count: number;
  avg_ctr: number;
}

export interface SpendRangeData {
  spend_range: string;
  ad_count: number;
  avg_ctr: number;
  total_spend: number;
}

export interface CTRPerformanceData {
  ctr_performance: string;
  ad_count: number;
  avg_spend: number;
  percentage: number;
}

export interface SpendImpressionData {
  competitor_name: string;
  total_spend: number;
  total_impressions: number;
  impressions_per_dollar: number;
  avg_ctr: number;
}

export interface PlatformCTRData {
  platform: string;
  avg_ctr: number;
  ad_count: number;
  total_spend: number;
  color: string;
}

export interface UserAnalyticsData {
  summary: SummaryMetrics | null;
  analytics: {
    competitorSpend: CompetitorSpendData[];
    spendRanges: SpendRangeData[];
    ctrPerformance: CTRPerformanceData[];
    spendImpressions: SpendImpressionData[];
    platformCTR: PlatformCTRData[];
  };
  totalCompetitors: number;
  totalSpend: number;
  competitorNames: string[];
}

/* =========================
   Mock Data (Fallback)
========================= */

const mockSummaryMetrics: SummaryMetrics = {
  id: 'mock-1',
  total_competitor_spend: 124300,
  active_campaigns_count: 1247,
  total_impressions: 12400000,
  average_ctr: 0.0342,
  platform_distribution: {
    Meta: 36.5,
    Google: 31.3,
    TikTok: 19.9,
    LinkedIn: 12.4,
  },
  top_performers: [],
  spend_by_industry: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/* =========================
   Authentication Helpers
========================= */

/**
 * Get authentication token from localStorage
 */
export const getAuthToken = (): string | null => {
  const token = localStorage.getItem('token');
  console.log('🔍 getAuthToken called, token exists:', !!token);
  if (token) {
    console.log('🔍 Token length:', token.length);
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('🔍 Token payload:', {
          user_id: payload.user_id,
          email: payload.email,
          name: payload.name, // Check if name exists
          exp: payload.exp
        });
      }
    } catch (e) {
      console.log('🔍 Error parsing token:', e);
    }
  }
  return token;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) {
    console.log('🔍 No token found');
    return false;
  }
  
  try {
    // Check if token is expired
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const isExpired = Date.now() >= exp;
    const isValid = !isExpired && payload.user_id && payload.email;
    
    console.log('🔍 Token validation:', {
      hasUserId: !!payload.user_id,
      hasEmail: !!payload.email,
      hasName: !!payload.name, // Check name
      isExpired,
      isValid
    });
    
    return isValid;
  } catch (error) {
    console.error('🔍 Error checking authentication:', error);
    return false;
  }
};

/**
 * Get user info from token - FIXED VERSION
 */
export const getUserInfo = (): { user_id: string; email: string; name: string } | null => {
  const token = getAuthToken();
  if (!token) {
    console.log('🔍 getUserInfo: No token');
    return null;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('🔍 getUserInfo payload:', {
      user_id: payload.user_id,
      email: payload.email,
      name: payload.name, // This was missing!
      hasName: !!payload.name
    });
    
    if (!payload.name) {
      console.warn('⚠️ Token missing name field!');
    }
    
    return {
      user_id: payload.user_id,
      email: payload.email,
      name: payload.name || 'User' // Fallback if name is missing
    };
  } catch (error) {
    console.error('🔍 Error parsing token in getUserInfo:', error);
    return null;
  }
};

/**
 * Fetch with authentication headers - IMPROVED VERSION
 */
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<any> => {
  const token = getAuthToken();
  
  console.log('🔐 fetchWithAuth:', { 
    url, 
    hasToken: !!token,
    tokenLength: token?.length,
    method: options.method || 'GET'
  });
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    console.log('🔐 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('🔐 API Error (JSON):', errorData);
      } catch {
        const errorText = await response.text();
        errorData = { error: errorText || `HTTP error! status: ${response.status}` };
        console.error('🔐 API Error (text):', errorText);
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('🔐 API Success:', { url, success: data.success });
    return data;
    
  } catch (error: any) {
    console.error('🔐 fetchWithAuth error:', {
      url,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/* =========================
   Authentication Functions
========================= */

/**
 * User login - FIXED ENDPOINT
 */
export async function login(email: string, password: string): Promise<{
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
}> {
  try {
    console.log('🔐 Attempting login:', { email });
    const response = await fetch(`${API_ENDPOINTS.AUTH}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log('🔐 Login response:', { 
      success: data.success,
      hasToken: !!data.token,
      userName: data.user?.name,
      userEmail: data.user?.email
    });
    
    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      console.log('🔐 Token stored in localStorage');
      
      // Debug the stored token
      const storedToken = localStorage.getItem('token');
      console.log('🔐 Stored token length:', storedToken?.length);
      
      // Parse and log token payload
      try {
        const parts = storedToken?.split('.');
        if (parts && parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('🔐 Stored token payload:', {
            name: payload.name,
            email: payload.email,
            user_id: payload.user_id
          });
        }
      } catch (e) {
        console.log('🔐 Error parsing stored token:', e);
      }
    }
    
    return data;
  } catch (error) {
    console.error('🔐 Login error:', error);
    return {
      success: false,
      error: 'Network error. Please try again.'
    };
  }
}

/**
 * User registration - FIXED ENDPOINT
 */
export async function register(
  name: string, 
  email: string, 
  password: string,
  confirmPassword: string
): Promise<{
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_ENDPOINTS.AUTH}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        name, 
        email, 
        password,
        confirmPassword
      }),
    });

    const data = await response.json();
    
    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      console.log('🔐 Registration successful, token stored');
    }
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Network error. Please try again.'
    };
  }
}

/**
 * Complete onboarding - FIXED ENDPOINT
 */
export async function completeOnboarding(
  businessType: string,
  industry: string,
  goals: string
): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const response = await fetchWithAuth(`${API_ENDPOINTS.AUTH}/complete-onboarding`, {
      method: 'POST',
      body: JSON.stringify({ 
        businessType,
        industry,
        goals
      }),
    });

    return response;
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return {
      success: false,
      error: error.message || 'Failed to complete onboarding'
    };
  }
}

/**
 * Verify token - FIXED ENDPOINT
 */
export async function verifyToken(): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  const token = getAuthToken();
  
  if (!token) {
    return {
      success: false,
      error: 'No token found'
    };
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.AUTH}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    console.log('🔐 Verify token response:', { 
      success: data.success,
      userName: data.user?.name 
    });
    return data;
  } catch (error) {
    console.error('Token verification error:', error);
    return {
      success: false,
      error: 'Failed to verify token'
    };
  }
}

/**
 * Logout user
 */
export function logout(): void {
  console.log('🔐 Logging out...');
  localStorage.removeItem('token');
  window.location.reload();
}

/* =========================
   Mock Data Generators (for demo mode)
========================= */

/**
 * Generate mock daily metrics for demo mode
 */
function generateMockDailyMetrics(count: number = 5, latestOnly: boolean = false): AdCardData[] {
  const platforms = ['Meta', 'Google', 'TikTok', 'LinkedIn'];
  const competitors = ['Nike Running', 'Adidas Sportswear', 'Under Armour', 'Lululemon', 'Puma', 'Reebok', 'New Balance', 'Asics'];
  const statuses = ['ACTIVE', 'PAUSED', 'ENDED'];
  const adTitles = [
    'Limited Edition Running Shoes - Up to 50% Off',
    'Summer Collection Launch - Shop Now',
    'Holiday Sale: Get 40% Off Everything',
    'New Performance Gear - Limited Stock',
    'End of Season Clearance - Save Big',
  ];
  const adBodies = [
    'Experience ultimate comfort with our new line of running shoes. Limited time offer with free shipping.',
    'New summer activewear designed for performance and style. Exclusive online discounts available.',
    'Stock up on your favorite gear with our biggest sale of the year. Limited quantities available.',
    'Upgrade your workout routine with our latest performance technology. Designed for athletes by athletes.',
    'Don\'t miss out on our end of season clearance. Huge discounts on last season\'s collections.',
  ];
  
  const mockData: AdCardData[] = [];
  const today = new Date().toISOString().split('T')[0];
  
  for (let i = 0; i < count; i++) {
    const daysAgo = latestOnly ? 0 : Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split('T')[0];
    
    const dailySpend = Math.floor(Math.random() * 80000) + 20000;
    const dailyImpressions = Math.floor(Math.random() * 2000000) + 500000;
    const competitorIndex = i % competitors.length;
    
    mockData.push({
      id: `mock-${i + 1}`,
      date: dateStr,
      competitor_name: competitors[competitorIndex],
      platform: platforms[i % platforms.length],
      status: statuses[i % statuses.length],
      daily_spend: dailySpend,
      daily_impressions: dailyImpressions,
      daily_ctr: Math.random() * 0.05 + 0.01,
      ad_title: adTitles[i % adTitles.length],
      ad_body: adBodies[i % adBodies.length],
      spend_lower_bound: dailySpend * 0.9,
      spend_upper_bound: dailySpend * 1.1,
      impressions_lower_bound: dailyImpressions * 0.9,
      impressions_upper_bound: dailyImpressions * 1.1,
      variants: Math.floor(Math.random() * 5) + 1,
      ab_tests: Math.floor(Math.random() * 3)
    });
  }
  
  // Sort by date descending
  return mockData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Generate mock analytics data for demo mode
 */
function generateMockAnalyticsData() {
  return {
    summary: mockSummaryMetrics,
    analytics: {
      competitorSpend: [
        { competitor_name: 'Nike', total_spend: 125000, ad_count: 45, avg_ctr: 0.032 },
        { competitor_name: 'Adidas', total_spend: 98000, ad_count: 38, avg_ctr: 0.028 },
        { competitor_name: 'Under Armour', total_spend: 75000, ad_count: 29, avg_ctr: 0.041 },
        { competitor_name: 'Puma', total_spend: 52000, ad_count: 18, avg_ctr: 0.019 },
        { competitor_name: 'Reebok', total_spend: 45000, ad_count: 15, avg_ctr: 0.026 }
      ],
      spendRanges: [
        { spend_range: 'Under $100', ad_count: 45, avg_ctr: 0.025, total_spend: 3500 },
        { spend_range: '$100-$500', ad_count: 120, avg_ctr: 0.031, total_spend: 42000 },
        { spend_range: '$500-$1K', ad_count: 85, avg_ctr: 0.028, total_spend: 68000 },
        { spend_range: '$1K-$5K', ad_count: 60, avg_ctr: 0.035, total_spend: 180000 },
        { spend_range: 'Over $5K', ad_count: 15, avg_ctr: 0.042, total_spend: 120000 }
      ],
      ctrPerformance: [
        { ctr_performance: 'Poor (<1%)', ad_count: 45, avg_spend: 450, percentage: 15 },
        { ctr_performance: 'Average (1-3%)', ad_count: 120, avg_spend: 1200, percentage: 40 },
        { ctr_performance: 'Good (3-5%)', ad_count: 85, avg_spend: 1800, percentage: 28 },
        { ctr_performance: 'Excellent (5-10%)', ad_count: 40, avg_spend: 2500, percentage: 13 },
        { ctr_performance: 'Outstanding (>10%)', ad_count: 10, avg_spend: 3200, percentage: 4 }
      ],
      spendImpressions: [
        { competitor_name: 'Nike', total_spend: 125000, total_impressions: 12500000, impressions_per_dollar: 100, avg_ctr: 0.032 },
        { competitor_name: 'Adidas', total_spend: 98000, total_impressions: 9800000, impressions_per_dollar: 100, avg_ctr: 0.028 },
        { competitor_name: 'Under Armour', total_spend: 75000, total_impressions: 7500000, impressions_per_dollar: 100, avg_ctr: 0.041 },
        { competitor_name: 'Puma', total_spend: 52000, total_impressions: 5200000, impressions_per_dollar: 100, avg_ctr: 0.019 },
        { competitor_name: 'Reebok', total_spend: 45000, total_impressions: 4500000, impressions_per_dollar: 100, avg_ctr: 0.026 }
      ],
      platformCTR: [
        { platform: 'Meta', avg_ctr: 0.032, ad_count: 450, total_spend: 125000, color: '#00C2B3' },
        { platform: 'Google', avg_ctr: 0.028, ad_count: 380, total_spend: 98000, color: '#4A90E2' },
        { platform: 'TikTok', avg_ctr: 0.041, ad_count: 290, total_spend: 75000, color: '#FF6B6B' },
        { platform: 'LinkedIn', avg_ctr: 0.019, ad_count: 180, total_spend: 52000, color: '#FFD166' },
        { platform: 'Twitter', avg_ctr: 0.026, ad_count: 95, total_spend: 32000, color: '#1DA1F2' }
      ]
    },
    totalCompetitors: 5,
    totalSpend: 395000,
    competitorNames: ['Nike', 'Adidas', 'Under Armour', 'Puma', 'Reebok']
  };
}

/* =========================
   User-Specific Data Functions
========================= */

/**
 * Fetch user analytics summary (user-specific)
 */
export async function getUserAnalyticsSummary(): Promise<UserAnalyticsData> {
  const token = getAuthToken();
  
  if (!token) {
    console.log('📊 No auth token, using demo data');
    return generateMockAnalyticsData();
  }

  try {
    console.log('📊 Fetching user analytics summary...');
    const data = await fetchWithAuth(`${API_ENDPOINTS.ANALYTICS}/api/analytics/summary`);
    
    if (data.success) {
      console.log('✅ User analytics loaded:', {
        competitors: data.data.totalCompetitors,
        spend: data.data.totalSpend
      });
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to load analytics');
    }
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return generateMockAnalyticsData();
  }
}

/**
 * Fetch daily metrics (user-specific)
 */
export async function fetchDailyMetrics(
  options: FetchMetricsOptions = {}
): Promise<AdCardData[]> {
  const {
    limit = 10,
    showLatestOnly = false,
    startDate,
    endDate
  } = options;

  const token = getAuthToken();

  if (!token) {
    console.log('📊 No auth token, using demo data');
    return generateMockDailyMetrics(limit, showLatestOnly);
  }

  try {
    const response = await fetchWithAuth(`${API_ENDPOINTS.DAILY_METRICS}/api/daily-metrics`, {
      method: 'POST',
      body: JSON.stringify({
        limit,
        showLatestOnly,
        startDate,
        endDate
      })
    });

    if (response.success) {
      console.log(`✅ Found ${response.data.length} daily metrics records`);
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch daily metrics');
    }

  } catch (error: any) {
    console.error('Error fetching daily metrics:', error.message || error);
    return generateMockDailyMetrics(limit, showLatestOnly);
  }
}

/**
 * Fetch summary metrics (user-specific)
 */
export async function fetchSummaryMetrics(period?: string): Promise<SummaryMetrics> {
  const token = getAuthToken();

  if (!token) {
    console.log('📊 No auth token, using mock data');
    return mockSummaryMetrics;
  }

  try {
    const response = await fetchWithAuth(`${API_ENDPOINTS.DAILY_METRICS}/api/summary-metrics?period=${period || '7d'}`);
    
    if (response.success) {
      console.log('✅ Fetched user summary metrics');
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch summary metrics');
    }
  } catch (error) {
    console.error('Error fetching summary metrics:', error);
    return mockSummaryMetrics;
  }
}

/**
 * Get user's competitors
 */
export async function getUserCompetitors(): Promise<{
  success: boolean;
  data?: any[];
  count?: number;
  error?: string;
}> {
  const token = getAuthToken();

  if (!token) {
    return {
      success: true,
      data: [],
      count: 0
    };
  }

  try {
    const response = await fetchWithAuth(`${API_ENDPOINTS.COMPETITORS}/api/competitors`);
    return response;
  } catch (error: any) {
    console.error('Error fetching competitors:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch competitors'
    };
  }
}

/**
 * Add a new competitor
 */
export async function addCompetitor(competitorData: {
  name: string;
  domain?: string;
  industry?: string;
  estimated_monthly_spend?: number;
}): Promise<{
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}> {
  const token = getAuthToken();

  if (!token) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }

  try {
    // Get user info to include user_id
    const userInfo = getUserInfo();
    if (!userInfo) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Include user_id with competitor data
    const dataWithUserId = {
      ...competitorData,
      user_id: userInfo.user_id
    };

    const response = await fetchWithAuth(`${API_ENDPOINTS.COMPETITORS}/api/competitors`, {
      method: 'POST',
      body: JSON.stringify(dataWithUserId)
    });
    
    return response;
  } catch (error: any) {
    console.error('Error adding competitor:', error);
    return {
      success: false,
      error: error.message || 'Failed to add competitor'
    };
  }
}

/* =========================
   Analytics Functions (Updated for user-specific data)
========================= */

/**
 * 1. Competitor Spend Distribution (user-specific)
 */
export async function getCompetitorSpendDistribution(limit: number = 10): Promise<CompetitorSpendData[]> {
  try {
    const analytics = await getUserAnalyticsSummary();
    return analytics.analytics.competitorSpend.slice(0, limit);
  } catch (error) {
    console.error('Error fetching competitor spend:', error);
    return [];
  }
}

/**
 * 2. Spend Range Distribution (user-specific)
 */
export async function getSpendRangeDistribution(): Promise<SpendRangeData[]> {
  try {
    const analytics = await getUserAnalyticsSummary();
    return analytics.analytics.spendRanges;
  } catch (error) {
    console.error('Error fetching spend ranges:', error);
    return [];
  }
}

/**
 * 3. CTR Performance Distribution (user-specific)
 */
export async function getCTRPerformanceDistribution(): Promise<CTRPerformanceData[]> {
  try {
    const analytics = await getUserAnalyticsSummary();
    return analytics.analytics.ctrPerformance;
  } catch (error) {
    console.error('Error fetching CTR performance:', error);
    return [];
  }
}

/**
 * 4. Impressions vs Spend Correlation (user-specific)
 */
export async function getSpendImpressionsCorrelation(limit: number = 15): Promise<SpendImpressionData[]> {
  try {
    const analytics = await getUserAnalyticsSummary();
    return analytics.analytics.spendImpressions.slice(0, limit);
  } catch (error) {
    console.error('Error fetching spend impressions:', error);
    return [];
  }
}

/**
 * 5. Platform vs CTR Heatmap Data (user-specific)
 */
export async function getPlatformCTRData(): Promise<PlatformCTRData[]> {
  try {
    const analytics = await getUserAnalyticsSummary();
    return analytics.analytics.platformCTR;
  } catch (error) {
    console.error('Error fetching platform CTR:', error);
    return [];
  }
}

/**
 * 6. Overall Analytics Summary (user-specific)
 */
export async function getAnalyticsSummary() {
  console.log('📊 Fetching overall analytics summary...');
  
  try {
    const analytics = await getUserAnalyticsSummary();
    
    return {
      competitorSpend: analytics.analytics.competitorSpend,
      spendRanges: analytics.analytics.spendRanges,
      ctrPerformance: analytics.analytics.ctrPerformance,
      spendImpressions: analytics.analytics.spendImpressions,
      platformCTR: analytics.analytics.platformCTR,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error loading analytics data:', error);
    
    // Return mock data as fallback
    return {
      competitorSpend: [],
      spendRanges: [],
      ctrPerformance: [],
      spendImpressions: [],
      platformCTR: [],
      timestamp: new Date().toISOString()
    };
  }
}

/* =========================
   Database Connectivity
========================= */

import { supabase, isSupabaseConnected } from './supabase';

/**
 * Test database connectivity
 */
export async function testDatabaseConnection(): Promise<{
  connected: boolean;
  summaryCount: number;
  dailyCount: number;
  error?: string;
}> {
  // Check if user is authenticated
  const token = getAuthToken();
  
  if (!token) {
    return {
      connected: false,
      summaryCount: 0,
      dailyCount: 0,
      error: 'Not authenticated. Please login first.'
    };
  }

  // First try to connect to backend health endpoint
  try {
    console.log('🔍 Checking backend health...');
    const response = await fetch(`${API_ENDPOINTS.DAILY_METRICS}/health`);
    if (response.ok) {
      console.log('✅ Backend services are running');
      return {
        connected: true,
        summaryCount: 0,
        dailyCount: 0,
        error: 'Backend services are running'
      };
    }
  } catch (error) {
    console.log('⚠️ Backend health check failed:', error);
  }

  // Fall back to Supabase check
  const connected = isSupabaseConnected();
  
  if (!connected) {
    return {
      connected: false,
      summaryCount: 0,
      dailyCount: 0,
      error: 'Backend services not running. Please start the AdSurveillance backend.',
    };
  }

  try {
    // Test summary_metrics table
    const { count: summaryCount, error: summaryError } = await supabase!
      .from('summary_metrics')
      .select('*', { count: 'exact', head: true });

    if (summaryError) {
      console.warn('summary_metrics table error:', summaryError.message);
    }

    // Test daily_metrics table
    const { count: dailyCount, error: dailyError } = await supabase!
      .from('daily_metrics')
      .select('*', { count: 'exact', head: true });

    if (dailyError) {
      console.warn('daily_metrics table error:', dailyError.message);
    }

    return {
      connected: true,
      summaryCount: summaryCount || 0,
      dailyCount: dailyCount || 0,
      error: summaryError?.message || dailyError?.message
    };
  } catch (err: any) {
    console.error('Database connection error:', err);
    return {
      connected: false,
      summaryCount: 0,
      dailyCount: 0,
      error: err.message,
    };
  }
}

/* =========================
   Formatting Helpers
========================= */

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCurrencyShort = (amount: number): string => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${Math.round(amount)}`;
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

export const formatCTR = (ctr: number): string => {
  return `${(ctr * 100).toFixed(2)}%`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
};

/**
 * Debug helper to check token
 */
export const debugToken = (): void => {
  const token = getAuthToken();
  if (!token) {
    console.log('🔍 No token found');
    return;
  }
  
  console.log('🔍 Token debug:');
  console.log('  Token length:', token.length);
  
  try {
    const parts = token.split('.');
    console.log('  Has 3 parts:', parts.length === 3);
    
    if (parts.length === 3) {
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      console.log('  Header:', header);
      console.log('  Payload:', payload);
      console.log('  User name in token:', payload.name);
      console.log('  User email:', payload.email);
      console.log('  Token expires:', new Date(payload.exp * 1000));
    }
  } catch (error) {
    console.error('🔍 Token decode error:', error);
  }
};