// src/services/targetingIntel.ts
import { getAuthToken, getUserInfo } from './api';

/* =========================
   TypeScript Interfaces
========================= */

export interface AgeDistribution {
  '18-24': number;
  '25-34': number;
  '35-44': number;
  '45-54': number;
  '55+': number;
}

export interface GenderDistribution {
  male: number;
  female: number;
  other: number;
}

export interface GeographicSpend {
  [country: string]: {
    spend: number;
    percentage: number;
  };
}

export interface InterestCluster {
  interest: string;
  affinity: number;
  reach: number;
}

export interface FunnelStage {
  label: string;
  percentage: number;
  reach: number;
}

export interface FunnelStagePrediction {
  awareness: FunnelStage;
  consideration: FunnelStage;
  conversion: FunnelStage;
  retention: FunnelStage;
}

export interface BiddingStrategy {
  hourly: Array<{
    time: string;
    cpc: number;
    cpm: number;
  }>;
  avg_cpc: number;
  peak_cpm: {
    value: number;
    window: string;
  };
  best_time: string;
}

export interface AdvancedTargeting {
  purchase_intent: {
    level: string;
    confidence: number;
  };
  ai_recommendation: string;
  device_preference: {
    mobile: number;
    desktop: number;
    ios_share: number;
  };
  competitor_overlap: {
    brands: number;
    description: string;
  };
}

export interface TargetingIntelData {
  id: string;
  competitor_id: string;
  competitor_name: string;
  age_distribution: AgeDistribution;
  gender_distribution: GenderDistribution;
  geographic_spend: GeographicSpend;
  interest_clusters: InterestCluster[];
  funnel_stage_prediction: FunnelStagePrediction;
  bidding_strategy: BiddingStrategy;
  advanced_targeting: AdvancedTargeting;
  data_source: string;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

/* =========================
   API Endpoints Configuration
========================= */

const API_ENDPOINTS = {
  TARGETING_INTEL: 'http://localhost:5011',
  AUTH: 'http://localhost:5003'
};

/* =========================
   Mock Data (Fallback)
========================= */

const mockTargetingIntelData: TargetingIntelData = {
  id: 'mock-1',
  competitor_id: '11111111-1111-1111-1111-111111111111',
  competitor_name: 'Nike',
  age_distribution: {
    '18-24': 0.15,
    '25-34': 0.35,
    '35-44': 0.28,
    '45-54': 0.15,
    '55+': 0.07
  },
  gender_distribution: {
    male: 0.58,
    female: 0.40,
    other: 0.02
  },
  geographic_spend: {
    'United States': { spend: 18200, percentage: 45 },
    'United Kingdom': { spend: 8900, percentage: 22 },
    'Canada': { spend: 6100, percentage: 15 },
    'Australia': { spend: 4000, percentage: 10 },
    'Germany': { spend: 3200, percentage: 8 }
  },
  interest_clusters: [
    { interest: 'Fitness & Running', affinity: 0.95, reach: 450000 },
    { interest: 'Athletic Apparel', affinity: 0.88, reach: 380000 },
    { interest: 'Health & Wellness', affinity: 0.82, reach: 520000 },
    { interest: 'Sports Equipment', affinity: 0.78, reach: 290000 },
    { interest: 'Marathon Training', affinity: 0.92, reach: 180000 },
    { interest: 'Outdoor Activities', affinity: 0.75, reach: 610000 }
  ],
  funnel_stage_prediction: {
    awareness: { label: 'Cold Traffic', percentage: 45, reach: 2100000 },
    consideration: { label: 'Engagement', percentage: 30, reach: 1400000 },
    conversion: { label: 'Retargeting', percentage: 20, reach: 940000 },
    retention: { label: 'Loyalty', percentage: 5, reach: 235000 }
  },
  bidding_strategy: {
    hourly: [
      { time: '12am', cpc: 1.1, cpm: 8.2 },
      { time: '3am', cpc: 0.9, cpm: 6.8 },
      { time: '6am', cpc: 1.6, cpm: 10.1 },
      { time: '9am', cpc: 2.0, cpm: 12.4 },
      { time: '12pm', cpc: 2.4, cpm: 14.2 },
      { time: '3pm', cpc: 2.2, cpm: 13.5 },
      { time: '6pm', cpc: 2.8, cpm: 15.6 },
      { time: '9pm', cpc: 1.9, cpm: 11.3 }
    ],
    avg_cpc: 2.16,
    peak_cpm: { value: 15.6, window: '6pm-9pm' },
    best_time: '3am-6am'
  },
  advanced_targeting: {
    purchase_intent: { level: 'High', confidence: 0.62 },
    ai_recommendation: 'Focus 60% of budget on awareness to fill top funnel. Strong retargeting opportunity observed.',
    device_preference: { mobile: 0.78, desktop: 0.22, ios_share: 0.65 },
    competitor_overlap: { brands: 3.2, description: 'Audience overlaps with similar athletic brands' }
  },
  data_source: 'AI_MODELED',
  confidence_score: 0.75,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

/* =========================
   Authentication Helper Functions
========================= */

/**
 * Fetch with authentication headers
 */
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<any> => {
  const token = getAuthToken();
  
  console.log('🎯 fetchWithAuth:', { 
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
    
    console.log('🎯 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('🎯 API Error (JSON):', errorData);
      } catch {
        const errorText = await response.text();
        errorData = { error: errorText || `HTTP error! status: ${response.status}` };
        console.error('🎯 API Error (text):', errorText);
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('🎯 API Success:', { url, success: data.success });
    return data;
    
  } catch (error: any) {
    console.error('🎯 fetchWithAuth error:', {
      url,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() < exp && payload.user_id && payload.email;
  } catch {
    return false;
  }
};

/* =========================
   Data Normalization Functions
========================= */

/**
 * Normalize database data to match TypeScript interface
 */
function normalizeTargetingData(dbData: any): TargetingIntelData {
  if (!dbData) {
    console.warn('⚠️ No data to normalize, returning mock data');
    return mockTargetingIntelData;
  }

  // Parse advanced_targeting with support for multiple structures
  let purchase_intent = { level: 'Medium', confidence: 0.65 };
  let ai_recommendation = 'Focus on mobile-first advertising strategy';
  let device_preference = { mobile: 0.75, desktop: 0.25, ios_share: 0.65 };
  let competitor_overlap = { brands: 2.5, description: 'Overlaps with similar brands in the market' };

  if (dbData.advanced_targeting && typeof dbData.advanced_targeting === 'object') {
    const adv = dbData.advanced_targeting;
    
    if (adv.ai_recommendation) {
      ai_recommendation = adv.ai_recommendation;
    } else if (adv.insight) {
      ai_recommendation = adv.insight;
    }

    if (adv.purchase_intent && typeof adv.purchase_intent === 'object') {
      purchase_intent = {
        level: adv.purchase_intent.level || 'Medium',
        confidence: adv.purchase_intent.confidence || 0.65
      };
    }

    if (adv.device_preference && typeof adv.device_preference === 'object') {
      device_preference = {
        mobile: adv.device_preference.mobile || 0.75,
        desktop: adv.device_preference.desktop || 0.25,
        ios_share: adv.device_preference.ios_share || adv.device_preference.ios || 0.65
      };
    } else if (adv.platform_split && typeof adv.platform_split === 'object') {
      device_preference = {
        mobile: adv.platform_split.mobile || 0.75,
        desktop: adv.platform_split.desktop || 0.25,
        ios_share: adv.platform_split.ios_share || adv.platform_split.ios || 0.65
      };
    }

    if (adv.competitor_overlap && typeof adv.competitor_overlap === 'object') {
      competitor_overlap = {
        brands: adv.competitor_overlap.brands || 2.5,
        description: adv.competitor_overlap.description || 'Overlaps with similar brands in the market'
      };
    }
  }

  // Create normalized data
  const normalizedData: TargetingIntelData = {
    ...mockTargetingIntelData,
    
    id: dbData.id || mockTargetingIntelData.id,
    competitor_id: dbData.competitor_id || mockTargetingIntelData.competitor_id,
    competitor_name: dbData.competitor_name || mockTargetingIntelData.competitor_name,
    data_source: dbData.data_source || mockTargetingIntelData.data_source,
    confidence_score: dbData.confidence_score !== undefined 
      ? Number(dbData.confidence_score) 
      : mockTargetingIntelData.confidence_score,
    created_at: dbData.created_at || mockTargetingIntelData.created_at,
    updated_at: dbData.updated_at || mockTargetingIntelData.updated_at,
    
    interest_clusters: Array.isArray(dbData.interest_clusters) && dbData.interest_clusters.length > 0
      ? dbData.interest_clusters.map((cluster: any) => ({
          interest: cluster.interest || 'Unknown Interest',
          affinity: cluster.affinity !== undefined ? Number(cluster.affinity) : 0,
          reach: cluster.reach !== undefined ? Number(cluster.reach) : 0
        }))
      : mockTargetingIntelData.interest_clusters,
    
    age_distribution: dbData.age_distribution && typeof dbData.age_distribution === 'object'
      ? {
          '18-24': dbData.age_distribution['18-24'] !== undefined ? Number(dbData.age_distribution['18-24']) : 0,
          '25-34': dbData.age_distribution['25-34'] !== undefined ? Number(dbData.age_distribution['25-34']) : 0,
          '35-44': dbData.age_distribution['35-44'] !== undefined ? Number(dbData.age_distribution['35-44']) : 0,
          '45-54': dbData.age_distribution['45-54'] !== undefined ? Number(dbData.age_distribution['45-54']) : 0,
          '55+': dbData.age_distribution['55+'] !== undefined ? Number(dbData.age_distribution['55+']) : 0
        }
      : mockTargetingIntelData.age_distribution,
    
    gender_distribution: dbData.gender_distribution && typeof dbData.gender_distribution === 'object'
      ? {
          male: dbData.gender_distribution.male !== undefined ? Number(dbData.gender_distribution.male) : 0,
          female: dbData.gender_distribution.female !== undefined ? Number(dbData.gender_distribution.female) : 0,
          other: dbData.gender_distribution.other !== undefined ? Number(dbData.gender_distribution.other) : 0
        }
      : mockTargetingIntelData.gender_distribution,
    
    geographic_spend: dbData.geographic_spend && 
                     typeof dbData.geographic_spend === 'object' && 
                     Object.keys(dbData.geographic_spend).length > 0
      ? dbData.geographic_spend
      : mockTargetingIntelData.geographic_spend,
    
    funnel_stage_prediction: dbData.funnel_stage_prediction && typeof dbData.funnel_stage_prediction === 'object'
      ? {
          awareness: {
            label: dbData.funnel_stage_prediction.awareness?.label || 'Awareness',
            percentage: dbData.funnel_stage_prediction.awareness?.percentage !== undefined 
              ? Number(dbData.funnel_stage_prediction.awareness.percentage) 
              : 45,
            reach: dbData.funnel_stage_prediction.awareness?.reach !== undefined 
              ? Number(dbData.funnel_stage_prediction.awareness.reach) 
              : 2100000
          },
          consideration: {
            label: dbData.funnel_stage_prediction.consideration?.label || 'Consideration',
            percentage: dbData.funnel_stage_prediction.consideration?.percentage !== undefined 
              ? Number(dbData.funnel_stage_prediction.consideration.percentage) 
              : 30,
            reach: dbData.funnel_stage_prediction.consideration?.reach !== undefined 
              ? Number(dbData.funnel_stage_prediction.consideration.reach) 
              : 1400000
          },
          conversion: {
            label: dbData.funnel_stage_prediction.conversion?.label || 'Conversion',
            percentage: dbData.funnel_stage_prediction.conversion?.percentage !== undefined 
              ? Number(dbData.funnel_stage_prediction.conversion.percentage) 
              : 20,
            reach: dbData.funnel_stage_prediction.conversion?.reach !== undefined 
              ? Number(dbData.funnel_stage_prediction.conversion.reach) 
              : 940000
          },
          retention: {
            label: dbData.funnel_stage_prediction.retention?.label || 'Retention',
            percentage: dbData.funnel_stage_prediction.retention?.percentage !== undefined 
              ? Number(dbData.funnel_stage_prediction.retention.percentage) 
              : 5,
            reach: dbData.funnel_stage_prediction.retention?.reach !== undefined 
              ? Number(dbData.funnel_stage_prediction.retention.reach) 
              : 235000
          }
        }
      : mockTargetingIntelData.funnel_stage_prediction,
    
    bidding_strategy: dbData.bidding_strategy && typeof dbData.bidding_strategy === 'object'
      ? {
          hourly: Array.isArray(dbData.bidding_strategy.hourly) 
            ? dbData.bidding_strategy.hourly.map((hour: any) => ({
                time: hour.time || '12am',
                cpc: hour.cpc !== undefined ? Number(hour.cpc) : 1.1,
                cpm: hour.cpm !== undefined ? Number(hour.cpm) : 8.2
              }))
            : mockTargetingIntelData.bidding_strategy.hourly,
          avg_cpc: dbData.bidding_strategy.avg_cpc !== undefined 
            ? Number(dbData.bidding_strategy.avg_cpc) 
            : mockTargetingIntelData.bidding_strategy.avg_cpc,
          peak_cpm: dbData.bidding_strategy.peak_cpm && typeof dbData.bidding_strategy.peak_cpm === 'object'
            ? {
                value: dbData.bidding_strategy.peak_cpm.value !== undefined 
                  ? Number(dbData.bidding_strategy.peak_cpm.value) 
                  : mockTargetingIntelData.bidding_strategy.peak_cpm.value,
                window: dbData.bidding_strategy.peak_cpm.window || mockTargetingIntelData.bidding_strategy.peak_cpm.window
              }
            : mockTargetingIntelData.bidding_strategy.peak_cpm,
          best_time: dbData.bidding_strategy.best_time || mockTargetingIntelData.bidding_strategy.best_time
        }
      : mockTargetingIntelData.bidding_strategy,
    
    advanced_targeting: {
      purchase_intent,
      ai_recommendation,
      device_preference,
      competitor_overlap
    }
  };

  console.log('✅ Normalized data for:', normalizedData.competitor_name);
  return normalizedData;
}

/* =========================
   User-Specific API Functions
========================= */

/**
 * Fetch targeting intelligence for user's competitors
 */
export async function fetchUserTargetingIntel(): Promise<TargetingIntelData[]> {
  const token = getAuthToken();
  
  if (!token) {
    console.log('🎯 No auth token, using demo data');
    return [mockTargetingIntelData];
  }

  try {
    console.log('🎯 Fetching user targeting intelligence...');
    const userInfo = getUserInfo();
    if (userInfo) {
      console.log(`   - For user: ${userInfo.name}`);
    }
    
    const response = await fetchWithAuth(`${API_ENDPOINTS.TARGETING_INTEL}/api/targeting-intel`);
    
    if (response.success) {
      console.log(`✅ Found ${response.count} targeting records`);
      
      if (response.data && Array.isArray(response.data)) {
        return response.data.map(normalizeTargetingData);
      } else {
        console.warn('⚠️ No targeting data array returned, using mock data');
        return [mockTargetingIntelData];
      }
    } else {
      throw new Error(response.error || 'Failed to load targeting intelligence');
    }
  } catch (error: any) {
    console.error('Error fetching user targeting intelligence:', error.message || error);
    return [mockTargetingIntelData];
  }
}

/**
 * Fetch targeting intelligence for a specific competitor (user-specific)
 */
export async function fetchTargetingIntelByCompetitorId(
  competitorId: string
): Promise<TargetingIntelData | null> {
  const token = getAuthToken();

  if (!token) {
    console.warn(`🎯 No auth token, using mock data`);
    return mockTargetingIntelData;
  }

  try {
    console.log(`🎯 Fetching targeting for competitor ${competitorId}`);
    
    const response = await fetchWithAuth(
      `${API_ENDPOINTS.TARGETING_INTEL}/api/targeting-intel/${competitorId}`
    );
    
    if (response.success && response.data) {
      console.log(`✅ Successfully fetched targeting for ${response.data.competitor_name}`);
      return normalizeTargetingData(response.data);
    } else {
      console.warn(`⚠️ No targeting data found for competitor ${competitorId}`);
      return null;
    }
  } catch (error: any) {
    console.error(`Error fetching targeting for competitor ${competitorId}:`, error.message || error);
    return mockTargetingIntelData;
  }
}

/**
 * Fetch latest targeting intelligence (user-specific)
 */
export async function fetchLatestTargetingIntel(): Promise<TargetingIntelData | null> {
  const token = getAuthToken();

  if (!token) {
    console.log('🎯 No auth token, using demo data');
    return mockTargetingIntelData;
  }

  try {
    console.log('🎯 Fetching latest targeting intelligence...');
    const userInfo = getUserInfo();
    if (userInfo) {
      console.log(`   - For user: ${userInfo.name}`);
    }
    
    const response = await fetchWithAuth(`${API_ENDPOINTS.TARGETING_INTEL}/api/targeting-intel/latest`);
    
    if (response.success) {
      if (response.data) {
        console.log(`✅ Successfully fetched latest targeting for ${response.data.competitor_name}`);
        return normalizeTargetingData(response.data);
      } else {
        console.warn('⚠️ No latest targeting data found');
        return null;
      }
    } else {
      throw new Error(response.error || 'Failed to load latest targeting');
    }
  } catch (error: any) {
    console.error('Error fetching latest targeting:', error.message || error);
    return mockTargetingIntelData;
  }
}

/**
 * Test targeting intelligence service connection
 */
export async function testTargetingIntelConnection(): Promise<{
  connected: boolean;
  authenticated: boolean;
  userHasData: boolean;
  error?: string;
}> {
  const token = getAuthToken();
  
  if (!token) {
    return {
      connected: false,
      authenticated: false,
      userHasData: false,
      error: 'Not authenticated'
    };
  }

  try {
    // First try to connect to health endpoint
    try {
      const healthResponse = await fetch(`${API_ENDPOINTS.TARGETING_INTEL}/health`);
      if (!healthResponse.ok) {
        return {
          connected: false,
          authenticated: true,
          userHasData: false,
          error: 'Targeting intelligence service not running'
        };
      }
    } catch {
      return {
        connected: false,
        authenticated: true,
        userHasData: false,
        error: 'Cannot connect to targeting intelligence service'
      };
    }

    // Try to fetch user's targeting data
    const response = await fetchWithAuth(`${API_ENDPOINTS.TARGETING_INTEL}/api/targeting-intel/latest`);
    
    return {
      connected: true,
      authenticated: true,
      userHasData: !!response.data
    };
  } catch (error: any) {
    console.error('Error testing connection:', error);
    return {
      connected: false,
      authenticated: !!token,
      userHasData: false,
      error: error.message || 'Connection test failed'
    };
  }
}

/**
 * Generate mock targeting for demo mode
 */
function generateMockTargetingForUser(userId?: string): TargetingIntelData[] {
  const userInfo = getUserInfo();
  const userName = userInfo?.name || 'Demo User';
  
  console.log(`🎯 Generating mock targeting data for ${userName}`);
  
  return [{
    ...mockTargetingIntelData,
    competitor_name: `${userName}'s Competitor`,
    data_source: 'MOCK_DEMO'
  }];
}

export default {
  fetchUserTargetingIntel,
  fetchTargetingIntelByCompetitorId,
  fetchLatestTargetingIntel,
  testTargetingIntelConnection,
  isAuthenticated
};