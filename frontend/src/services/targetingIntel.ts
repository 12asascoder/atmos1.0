// src/services/targetingIntel.ts
import { supabase, isSupabaseConnected } from './supabase';

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
   Helper Functions
========================= */

const logConnectionStatus = () => {
  const connected = isSupabaseConnected();
  console.log(
    connected
      ? '✅ Connected to Supabase for targeting intelligence'
      : '🎭 Using mock targeting data (no database connection)'
  );
  return connected;
};

/* =========================
   API Functions
========================= */

/**
 * Fetch all targeting intelligence data
 * Source: targeting_intel table
 */
export async function fetchAllTargetingIntel(): Promise<TargetingIntelData[]> {
  const connected = logConnectionStatus();

  if (!connected) {
    console.warn('⚠️ Returning mock data for all targeting intelligence');
    return [mockTargetingIntelData];
  }

  try {
    const { data, error } = await supabase!
      .from('targeting_intel')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching all targeting intelligence:', error);
      console.warn('⚠️ Falling back to mock data');
      return [mockTargetingIntelData];
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No targeting intelligence data found, using mock data');
      return [mockTargetingIntelData];
    }

    console.log(`✅ Successfully fetched ${data.length} targeting intelligence records`);
    return data as TargetingIntelData[];
  } catch (err) {
    console.error('❌ Unexpected error fetching targeting intelligence:', err);
    return [mockTargetingIntelData];
  }
}

/**
 * Fetch targeting intelligence for a specific competitor
 */
export async function fetchTargetingIntelByCompetitorId(
  competitorId: string
): Promise<TargetingIntelData | null> {
  const connected = logConnectionStatus();

  if (!connected) {
    console.warn(`⚠️ Using mock data for competitor ${competitorId}`);
    return mockTargetingIntelData;
  }

  try {
    const { data, error } = await supabase!
      .from('targeting_intel')
      .select('*')
      .eq('competitor_id', competitorId)
      .single();

    if (error) {
      console.error(`❌ Error fetching targeting for competitor ${competitorId}:`, error);
      console.warn('⚠️ Falling back to mock data');
      return mockTargetingIntelData;
    }

    if (!data) {
      console.warn(`⚠️ No targeting data found for competitor ${competitorId}`);
      return null;
    }

    console.log(`✅ Successfully fetched targeting for ${data.competitor_name}`);
    return data as TargetingIntelData;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return mockTargetingIntelData;
  }
}

/**
 * Fetch latest targeting intelligence
 * (Most recent record)
 */
export async function fetchLatestTargetingIntel(): Promise<TargetingIntelData | null> {
  const connected = logConnectionStatus();

  if (!connected) {
    console.warn('⚠️ Using mock data for latest targeting intelligence');
    return mockTargetingIntelData;
  }

  try {
    const { data, error } = await supabase!
      .from('targeting_intel')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Error fetching latest targeting intelligence:', error);
      console.warn('⚠️ Falling back to mock data');
      return mockTargetingIntelData;
    }

    if (!data) {
      console.warn('⚠️ No latest targeting intelligence found');
      return null;
    }

    console.log(`✅ Successfully fetched latest targeting for ${data.competitor_name}`);
    return data as TargetingIntelData;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return mockTargetingIntelData;
  }
}

/**
 * Fetch targeting intelligence by competitor name
 */
export async function fetchTargetingIntelByCompetitorName(
  competitorName: string
): Promise<TargetingIntelData | null> {
  const connected = logConnectionStatus();

  if (!connected) {
    console.warn(`⚠️ Using mock data for competitor ${competitorName}`);
    return mockTargetingIntelData;
  }

  try {
    const { data, error } = await supabase!
      .from('targeting_intel')
      .select('*')
      .ilike('competitor_name', `%${competitorName}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error(`❌ Error fetching targeting for ${competitorName}:`, error);
      console.warn('⚠️ Falling back to mock data');
      return mockTargetingIntelData;
    }

    if (!data) {
      console.warn(`⚠️ No targeting data found for ${competitorName}`);
      return null;
    }

    console.log(`✅ Successfully fetched targeting for ${data.competitor_name}`);
    return data as TargetingIntelData;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return mockTargetingIntelData;
  }
}

/**
 * Create new targeting intelligence record
 */
export async function createTargetingIntel(
  data: Omit<TargetingIntelData, 'id' | 'created_at' | 'updated_at'>
): Promise<TargetingIntelData | null> {
  const connected = isSupabaseConnected();

  if (!connected) {
    console.error('❌ Cannot create record: No database connection');
    return null;
  }

  try {
    const { data: result, error } = await supabase!
      .from('targeting_intel')
      .insert([{
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating targeting intelligence:', error);
      return null;
    }

    console.log(`✅ Successfully created targeting for ${result.competitor_name}`);
    return result as TargetingIntelData;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return null;
  }
}

/**
 * Test targeting intelligence table connectivity
 */
export async function testTargetingIntelConnection(): Promise<{
  connected: boolean;
  recordCount: number;
  latestRecord?: string;
  error?: string;
}> {
  const connected = isSupabaseConnected();

  if (!connected) {
    return {
      connected: false,
      recordCount: 0,
      error: 'Not connected to Supabase',
    };
  }

  try {
    // Count records
    const { count, error: countError } = await supabase!
      .from('targeting_intel')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return {
        connected: false,
        recordCount: 0,
        error: countError.message,
      };
    }

    // Get latest record
    const { data: latestData, error: latestError } = await supabase!
      .from('targeting_intel')
      .select('competitor_name, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      connected: true,
      recordCount: count || 0,
      latestRecord: latestData 
        ? `${latestData.competitor_name} (${new Date(latestData.created_at).toLocaleDateString()})`
        : undefined,
    };
  } catch (err: any) {
    return {
      connected: false,
      recordCount: 0,
      error: err.message,
    };
  }
}