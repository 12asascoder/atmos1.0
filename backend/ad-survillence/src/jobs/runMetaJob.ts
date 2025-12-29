import { crawlMetaAds } from '../crawlers/meta/meta.crawler';
import { ingestAds } from '../pipelines/ingest.ads';
import { logExecution } from '../db/logs.repo';

export async function runMetaJob(competitorName: string, userId: string) {
  const startTime = Date.now();
  let adsFetched = 0;

  try {
    console.log(`🤖 Running Meta Ads Job for ${competitorName} (User: ${userId})...`);

    // 1️⃣ Fetch REAL ads from Meta Ad Library
    const ads = await crawlMetaAds(competitorName);
    adsFetched = ads.length;

    console.log(`📱 Meta ads fetched for ${competitorName}: ${adsFetched}`);

    // 2️⃣ If no ads fetched, log & exit gracefully
    if (adsFetched === 0) {
      await logExecution({
        script_run_id: `META_${Date.now()}`,
        execution_timestamp: new Date().toISOString(),
        script_version: 'v1.0',
        competitors_analyzed: 0,
        total_ads_processed: 0,
        execution_duration_seconds: Math.round((Date.now() - startTime) / 1000),
        status: 'NO_DATA',
        calculated_fields: [],
        critical_limitations: ['No ads returned by Meta Ad Library in this run'],
        user_id: userId // ✅ Add user_id
      });

      console.log('📭 No ads found. Job completed safely.');
      return;
    }

    // 3️⃣ Ingest ads → calculate metrics → save to Supabase
    // ✅ Pass userId to ingestAds
    await ingestAds('meta', ads, competitorName, userId);

    // 4️⃣ Execution duration
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    // 5️⃣ Log successful execution
    await logExecution({
      script_run_id: `META_${Date.now()}`,
      execution_timestamp: new Date().toISOString(),
      script_version: 'v1.0',
      competitors_analyzed: adsFetched,
      total_ads_processed: adsFetched,
      execution_duration_seconds: durationSeconds,
      status: 'COMPLETED',
      calculated_fields: [
        'daily_spend',
        'daily_impressions',
        'daily_clicks',
        'daily_ctr'
      ],
      critical_limitations: [
        'Exact impressions and spend not publicly available',
        'Metrics estimated using CPM and CTR models'
      ],
      user_id: userId // ✅ Add user_id
    });

    console.log(`✅ Meta Ads Job completed successfully for ${competitorName}`);
  } catch (error: any) {
    // 6️⃣ HARD FAIL SAFETY LOG
    console.error(`❌ Meta Ads Job failed for ${competitorName}:`, error?.message);

    await logExecution({
      script_run_id: `META_${Date.now()}`,
      execution_timestamp: new Date().toISOString(),
      script_version: 'v1.0',
      competitors_analyzed: 0,
      total_ads_processed: 0,
      execution_duration_seconds: Math.round((Date.now() - startTime) / 1000),
      status: 'FAILED',
      error_message: error?.message || 'Unknown error',
      critical_limitations: ['Meta Ad Library access blocked or timed out'],
      user_id: userId // ✅ Add user_id
    });

    throw error;
  }
}