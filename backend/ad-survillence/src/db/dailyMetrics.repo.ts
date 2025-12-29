import { supabase } from '../config/supabase';

export interface DailyMetricInput {
  date: string;
  competitor_id: string;
  competitor_name: string;
  ad_id: string | null;
  daily_spend: number;
  daily_impressions: number;
  daily_clicks: number;
  daily_ctr: number;
  spend_lower_bound: number;
  spend_upper_bound: number;
  impressions_lower_bound: number;
  impressions_upper_bound: number;
  creative: string;
  platform: string;
}

// ==================== CLEANING FUNCTION ====================
/**
 * Clean creative text for new inserts only
 */
function cleanCreativeText(creative: string): string {
  if (!creative || typeof creative !== 'string') return '';
  
  // Remove \b markers (this is your specific issue)
  let cleaned = creative.replace(/\\b/g, '');
  
  // Optional: Add other cleaning as needed for new data
  cleaned = cleaned
    .replace(/\s+/g, ' ')      // Normalize multiple spaces
    .trim();
    
  return cleaned;
}

// ==================== UPDATED INSERT FUNCTIONS ====================

// Single insert function - UPDATED with cleaning
export async function insertDailyMetric(input: DailyMetricInput) {
  // Clean the creative text before inserting
  const cleanedCreative = cleanCreativeText(input.creative);
  
  const { data, error } = await supabase
    .from('daily_metrics')
    .insert({
      date: input.date,
      competitor_id: input.competitor_id,
      competitor_name: input.competitor_name,
      ad_id: input.ad_id,
      daily_spend: input.daily_spend,
      daily_impressions: input.daily_impressions,
      daily_clicks: input.daily_clicks,
      daily_ctr: input.daily_ctr,
      spend_lower_bound: input.spend_lower_bound,
      spend_upper_bound: input.spend_upper_bound,
      impressions_lower_bound: input.impressions_lower_bound,
      impressions_upper_bound: input.impressions_upper_bound,
      creative: cleanedCreative, // Use cleaned version
      platform: input.platform
    })
    .select()
    .single();

  if (error) {
    console.error('❌ METRIC INSERT FAILED', error);
    throw error;
  }

  console.log(`✅ METRIC SAVED for competitor ${input.competitor_name} on ${input.platform}`);
  return data;
}

// Batch insert function - UPDATED with cleaning
export async function insertDailyMetricsBatch(metrics: DailyMetricInput[]) {
  if (metrics.length === 0) {
    console.log('⚠️ No metrics to insert');
    return [];
  }

  console.log(`📦 Starting batch insert of ${metrics.length} metrics...`);

  try {
    // Clean creative text for all metrics
    const cleanedMetrics = metrics.map(metric => ({
      ...metric,
      creative: cleanCreativeText(metric.creative)
    }));

    const { data, error } = await supabase
      .from('daily_metrics')
      .insert(cleanedMetrics)
      .select();

    if (error) {
      console.error('❌ BATCH METRICS INSERT FAILED', error);
      
      // Log sample for debugging
      console.log('🔍 Sample metrics after cleaning:');
      cleanedMetrics.slice(0, 2).forEach((metric, i) => {
        console.log(`  ${i + 1}. Original: ${metrics[i]?.creative?.substring(0, 50)}...`);
        console.log(`     Cleaned:  ${metric.creative.substring(0, 50)}...`);
      });
      
      throw new Error(`Batch insert failed: ${error.message}`);
    }

    console.log(`✅ BATCH INSERT: Saved ${cleanedMetrics.length} metrics`);
    return data || [];
  } catch (error) {
    console.error('❌ BATCH INSERT ERROR:', error);
    throw error;
  }
}

// ==================== EXISTING FUNCTIONS (UNCHANGED) ====================

// Helper function to get metrics with creatives
export async function getDailyMetricsWithCreatives(userId: string, date?: string, limit = 100) {
  let query = supabase
    .from('daily_metrics')
    .select(`
      *,
      competitors!inner(name, domain, industry, user_id)
    `)
    .eq('competitors.user_id', userId);

  if (date) {
    query = query.eq('date', date);
  }

  const { data, error } = await query
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ ERROR FETCHING METRICS', error);
    throw error;
  }

  return data || [];
}

// Get metrics by competitor
export async function getMetricsByCompetitor(competitorId: string, limit = 50) {
  const { data, error } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ ERROR FETCHING COMPETITOR METRICS', error);
    throw error;
  }

  return data;
}

// Get platform distribution for a user
export async function getPlatformDistribution(userId: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('daily_metrics')
    .select('platform, daily_spend, daily_impressions')
    .eq('competitors.user_id', userId)
    .in('platform', ['meta', 'linkedin', 'google', 'tiktok', 'youtube']);

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ ERROR FETCHING PLATFORM DISTRIBUTION', error);
    throw error;
  }

  return data;
}

// Get today's metrics for a user
export async function getTodaysMetrics(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('daily_metrics')
    .select(`
      *,
      competitors!inner(user_id)
    `)
    .eq('competitors.user_id', userId)
    .eq('date', today)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ ERROR FETCHING TODAYS METRICS', error);
    throw error;
  }

  return data || [];
}

// Delete metrics for a specific date (useful for testing/cleanup)
export async function deleteMetricsByDate(date: string, userId?: string) {
  let query = supabase
    .from('daily_metrics')
    .delete()
    .eq('date', date);

  if (userId) {
    query = query.eq('competitors.user_id', userId);
  }

  const { error } = await query;

  if (error) {
    console.error('❌ ERROR DELETING METRICS', error);
    throw error;
  }

  console.log(`✅ Deleted metrics for date: ${date}`);
}

// Get summary stats for a user
export async function getUserMetricsSummary(userId: string) {
  const { data, error } = await supabase
    .from('daily_metrics')
    .select(`
      platform,
      daily_spend,
      daily_impressions,
      daily_clicks,
      competitors!inner(user_id)
    `)
    .eq('competitors.user_id', userId)
    .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  if (error) {
    console.error('❌ ERROR FETCHING USER METRICS SUMMARY', error);
    throw error;
  }

  return data || [];
}