import { crawlMetaAds } from '../crawlers/meta/meta.crawler';
import { crawlLinkedInAds } from '../crawlers/linkedin/linkedin.crawler';
import { ingestAds } from '../pipelines/ingest.ads';
import { getCompetitorsByUser } from '../db/competitors.repo';

export async function runAllPlatforms(userId: string) {
  console.log(`========== RUN ALL PLATFORMS START for User: ${userId} ==========`);

  // Get competitors for this user (already filtered for duplicates)
  const competitors = await getCompetitorsByUser(userId);

  if (!competitors || competitors.length === 0) {
    console.warn(`⚠️ No competitors found for user: ${userId}`);
    return;
  }

  console.log(`📊 Found ${competitors.length} unique competitor(s) for user`);

  // Track processed competitors to avoid duplicates in this run
  const processedCompetitors = new Set<string>();
  
  for (const competitor of competitors) {
    const keyword = competitor.name.toLowerCase().trim();
    
    // Skip if already processed in this run (case-insensitive)
    if (processedCompetitors.has(keyword)) {
      console.log(`⏭️ Skipping duplicate competitor: ${competitor.name}`);
      continue;
    }
    
    processedCompetitors.add(keyword);
    
    console.log(`\n🔍 Running for competitor: ${competitor.name}`);

    try {
      // Meta Ads
      console.log('🤖 Crawling Meta ads...');
      const metaAds = await crawlMetaAds(competitor.name);
      console.log(`📱 META returned: ${metaAds.length} ads`);
      
      if (metaAds.length > 0) {
        await ingestAds('meta', metaAds, competitor.name, userId);
      }

      // LinkedIn Ads
      console.log('💼 Crawling LinkedIn ads...');
      const linkedinAds = await crawlLinkedInAds(competitor.name);
      console.log(`👔 LINKEDIN returned: ${linkedinAds.length} ads`);
      
      if (linkedinAds.length > 0) {
        await ingestAds('linkedin', linkedinAds, competitor.name, userId);
      }

    } catch (competitorError) {
      console.error(`❌ Error processing competitor ${competitor.name}:`, competitorError);
    }
  }

  console.log(`========== RUN ALL PLATFORMS END for User: ${userId} ==========`);
}