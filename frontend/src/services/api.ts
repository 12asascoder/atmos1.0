// src/services/api.ts
import { supabase, isSupabaseConnected } from './supabase';

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

const mockDailyMetrics: AdCardData[] = [];

/* =========================
   Helpers
========================= */

const logConnectionStatus = () => {
  const connected = isSupabaseConnected();
  console.log(
    connected
      ? '✅ Connected to Supabase database'
      : '🎭 Using mock data (no database connection)'
  );
  return connected;
};

/* =========================
   API Functions
========================= */

/**
 * Fetch summary metrics
 * Source: summary_metrics table
 */
export async function fetchSummaryMetrics(): Promise<SummaryMetrics> {
  const connected = logConnectionStatus();

  if (!connected) {
    return mockSummaryMetrics;
  }

  try {
    const { data, error } = await supabase!
      .from('summary_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      console.warn('⚠️ Using mock summary metrics');
      return mockSummaryMetrics;
    }

    return data[0];
  } catch (err) {
    console.error('❌ Error fetching summary metrics:', err);
    return mockSummaryMetrics;
  }
}

/**
 * Fetch daily competitor-level metrics
 * Source: daily_metrics → competitors
 */
export async function fetchDailyMetrics(
  date?: string
): Promise<AdCardData[]> {
  const connected = logConnectionStatus();

  if (!connected) {
    return mockDailyMetrics;
  }

  const targetDate =
    date || new Date().toISOString().split('T')[0];

  try {
    const { data, error } = await supabase!
      .from('daily_metrics')
      .select(
        `
        id,
        date,
        daily_spend,
        daily_impressions,
        daily_ctr,
        competitor:competitor_id (
          id,
          name
        )
      `
      )
      .eq('date', targetDate)
      .order('daily_spend', { ascending: false })
      .limit(10);

    if (error || !data) {
      console.warn('⚠️ Using mock daily metrics');
      return mockDailyMetrics;
    }

    return data.map((row: any) => ({
      id: row.id,
      date: row.date,
      competitor_name: row.competitor?.name ?? 'Unknown',
      platform: 'Mixed',
      status: 'ACTIVE',
      daily_spend: row.daily_spend ?? 0,
      daily_impressions: row.daily_impressions ?? 0,
      daily_ctr: row.daily_ctr ?? 0,
    }));
  } catch (err) {
    console.error('❌ Error fetching daily metrics:', err);
    return mockDailyMetrics;
  }
}

/**
 * Test DB connectivity
 */
export async function testDatabaseConnection(): Promise<{
  connected: boolean;
  summaryCount: number;
  dailyCount: number;
  error?: string;
}> {
  const connected = isSupabaseConnected();

  if (!connected) {
    return {
      connected: false,
      summaryCount: 0,
      dailyCount: 0,
      error: 'Not connected to Supabase',
    };
  }

  try {
    const { count: summaryCount } = await supabase!
      .from('summary_metrics')
      .select('*', { count: 'exact', head: true });

    const { count: dailyCount } = await supabase!
      .from('daily_metrics')
      .select('*', { count: 'exact', head: true });

    return {
      connected: true,
      summaryCount: summaryCount || 0,
      dailyCount: dailyCount || 0,
    };
  } catch (err: any) {
    return {
      connected: false,
      summaryCount: 0,
      dailyCount: 0,
      error: err.message,
    };
  }
}
