import { PLATFORM_CONFIG, Platform } from '../config/platforms';
import { upsertCompetitor } from '../db/competitors.repo';
import { insertDailyMetric, insertDailyMetricsBatch, DailyMetricInput } from '../db/dailyMetrics.repo';
import { supabase } from '../config/supabase';

function estimateImpressions(): number {
  return Math.floor(8000 + Math.random() * 12000);
}

// Return null for ad_id since we don't have real UUIDs from scrapers
function generateAdId(): null {
  return null;
}

export interface AdData {
  creative: string;
  adId?: string | null;
  headline?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  landingPage?: string;
  callToAction?: string;
  targetAudience?: string[];
  estimatedSpend?: number;
  engagement?: number;
  duration?: string;
}

/**
 * Clean and sanitize creative text to prevent JSON errors
 */
function cleanCreativeText(text: string): string | null {
  if (!text) return null;
  
  try {
    // 1. Remove null bytes and control characters
    let cleaned = text
      .replace(/\x00/g, '') // Remove null bytes
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n');
    
    // 2. Remove invalid Unicode surrogates (main cause of your error)
    cleaned = cleaned.replace(/[\uD800-\uDFFF]/g, '');
    
    // 3. Escape JSON special characters
    cleaned = cleaned
      .replace(/\\/g, '\\\\') // Escape backslashes first
      .replace(/"/g, '\\"')   // Escape double quotes
      .replace(/\n/g, '\\n')  // Escape newlines
      .replace(/\t/g, '\\t')  // Escape tabs
      .replace(/\f/g, '\\f')  // Escape form feeds
      .replace(/\b/g, '\\b')  // Escape backspace
      .replace(/\r/g, '\\r'); // Escape carriage returns
    
    // 4. Remove any remaining non-printable characters
    cleaned = cleaned.replace(/[^\x20-\x7E\x0A\x0D\x09]/g, '');
    
    // 5. Trim and check length
    cleaned = cleaned.trim();
    
    if (cleaned.length < 40) {
      console.log(`⚠️ Creative too short after cleaning: ${cleaned.length} chars`);
      return null;
    }
    
    // 6. Test JSON serialization
    try {
      JSON.stringify(cleaned);
      return cleaned;
    } catch (jsonError) {
      console.log(`⚠️ JSON validation failed after cleaning`);
      return null;
    }
    
  } catch (error) {
    console.log(`⚠️ Error cleaning creative: ${error}`);
    return null;
  }
}

/**
 * Check if we already have today's data for this competitor and platform
 */
async function hasTodaysData(competitorId: string, platform: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  
  const { count, error } = await supabase
    .from('daily_metrics')
    .select('*', { count: 'exact', head: true })
    .eq('competitor_id', competitorId)
    .eq('platform', platform)
    .eq('date', today);

  if (error) {
    console.error('❌ ERROR CHECKING TODAYS DATA:', error);
    return false;
  }

  return (count || 0) > 0;
}

export async function ingestAds(
  platform: Platform,
  ads: AdData[],
  competitorName: string,
  userId: string
): Promise<number> {
  console.log(`🔥 INGESTING ADS for ${competitorName} on ${platform} (${ads.length} ads)`);

  // Use ISO date format for consistency
  const today = new Date().toISOString().split('T')[0];

  // Get or create competitor
  const competitor = await upsertCompetitor(competitorName, userId);
  
  // Check if we already have data for today
  const alreadyProcessed = await hasTodaysData(competitor.id, platform);
  if (alreadyProcessed) {
    console.log(`⏭️ Skipping ${competitorName} on ${platform} - already processed today`);
    return 0;
  }

  const metricsToInsert: DailyMetricInput[] = [];
  let successfulInserts = 0;
  let skippedCount = 0;
  let jsonErrorCount = 0;

  // Process each ad
  for (const [index, ad] of ads.entries()) {
    const originalCreative = ad.creative?.trim();

    // Skip if creative is too short or invalid
    if (!originalCreative || originalCreative.length < 40) {
      skippedCount++;
      continue;
    }

    // Clean the creative text to prevent JSON errors
    const cleanedCreative = cleanCreativeText(originalCreative);
    
    if (!cleanedCreative) {
      jsonErrorCount++;
      if (jsonErrorCount <= 3) { // Log first 3 errors
        console.log(`⚠️ Skipping ad ${index + 1} - creative cleaning failed`);
        console.log(`   Original (first 100 chars): ${originalCreative.substring(0, 100)}...`);
      }
      skippedCount++;
      continue;
    }

    // Set ad_id to null
    const adId = null;

    // Estimate metrics
    const impressions = estimateImpressions();
    const { cpm, ctr } = PLATFORM_CONFIG[platform];

    const spend = (impressions / 1000) * cpm;
    const clicks = Math.round(impressions * ctr);

    // Prepare metric data
    const metricData: DailyMetricInput = {
      date: today,
      competitor_id: competitor.id,
      competitor_name: competitorName,
      ad_id: adId,
      daily_spend: Number(spend.toFixed(2)),
      daily_impressions: impressions,
      daily_clicks: clicks,
      daily_ctr: Number(ctr.toFixed(4)),
      spend_lower_bound: Number((spend * 0.8).toFixed(2)),
      spend_upper_bound: Number((spend * 1.2).toFixed(2)),
      impressions_lower_bound: Math.round(impressions * 0.85),
      impressions_upper_bound: Math.round(impressions * 1.15),
      creative: cleanedCreative,
      platform: platform
    };

    metricsToInsert.push(metricData);
    successfulInserts++;

    // Log progress for large batches
    if (ads.length > 10 && (index + 1) % 10 === 0) {
      console.log(`📊 Processed ${index + 1}/${ads.length} ads for ${competitorName}`);
    }
  }

  // Log skipped ads
  if (skippedCount > 0) {
    console.log(`⏭️ Skipped ${skippedCount} ads (${jsonErrorCount} had JSON issues)`);
  }

  // Insert all metrics
  if (metricsToInsert.length > 0) {
    try {
      // Use batch insert for efficiency
      await insertDailyMetricsBatch(metricsToInsert);
      console.log(`✅ SUCCESS: Inserted ${successfulInserts} ads for ${competitorName} on ${platform}`);
    } catch (batchError) {
      console.error(`❌ BATCH INSERT FAILED for ${competitorName}:`, batchError);
      
      // Fallback strategy: Insert one by one with retries
      console.log('🔄 Falling back to single inserts...');
      let singleSuccess = 0;
      let singleFailures = 0;
      
      for (const metric of metricsToInsert) {
        try {
          await insertDailyMetric(metric);
          singleSuccess++;
          
          // Small delay to avoid rate limiting
          if (singleSuccess % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (singleError) {
          singleFailures++;
          
          // Log only first few errors
          if (singleFailures <= 3) {
            console.error(`❌ Failed to insert single metric (${singleFailures}):`, 
              singleError instanceof Error ? singleError.message : 'Unknown error');
          }
          
          // Stop if too many failures
          if (singleFailures > 10) {
            console.error('🛑 Too many single insert failures, stopping');
            break;
          }
        }
      }
      
      console.log(`🔄 Single inserts completed: ${singleSuccess}/${metricsToInsert.length} successful, ${singleFailures} failed`);
    }
  } else {
    console.log(`⚠️ No valid ads to insert for ${competitorName}. Input had ${ads.length} ads, skipped ${skippedCount}.`);
  }

  return successfulInserts;
}

// Helper function to validate ad data before ingestion
export function validateAdData(ads: AdData[]): { valid: AdData[], invalid: AdData[] } {
  const valid: AdData[] = [];
  const invalid: AdData[] = [];

  for (const ad of ads) {
    const creative = ad.creative?.trim();
    
    if (!creative || creative.length < 40) {
      invalid.push(ad);
    } else {
      // Test if it can be cleaned
      const cleaned = cleanCreativeText(creative);
      if (cleaned) {
        valid.push({ ...ad, creative: cleaned });
      } else {
        invalid.push(ad);
      }
    }
  }

  console.log(`📊 Validation: ${valid.length} valid, ${invalid.length} invalid ads`);
  return { valid, invalid };
}

// Function to ingest ads from multiple platforms
export async function ingestAdsFromMultiplePlatforms(
  platformAds: { platform: Platform; ads: AdData[] }[],
  competitorName: string,
  userId: string
): Promise<{ platform: Platform; count: number }[]> {
  const results: { platform: Platform; count: number }[] = [];

  for (const { platform, ads } of platformAds) {
    try {
      const count = await ingestAds(platform, ads, competitorName, userId);
      results.push({ platform, count });
      
      // Small delay between platforms to avoid overwhelming the system
      if (platformAds.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Failed to ingest ads from ${platform} for ${competitorName}:`, error);
      results.push({ platform, count: 0 });
    }
  }

  // Log summary
  const total = results.reduce((sum, r) => sum + r.count, 0);
  console.log(`📊 Summary for ${competitorName}: ${total} ads ingested across ${results.length} platforms`);
  
  return results;
}

// Function to check if ads already exist for today (keep this at bottom)
export async function hasTodaysAds(competitorId: string, platform: Platform): Promise<boolean> {
  return hasTodaysData(competitorId, platform);
}