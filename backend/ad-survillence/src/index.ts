import { runAllPlatforms } from './jobs/runAllPlatforms';
import { runDailySummary } from './jobs/runDailySummary';
import { generateTargetingIntel } from './jobs/generateTargetingIntel';

async function main() {
  console.log('Starting Ads Intelligence Engine...');

  // Hardcode the user ID you want to process
  const targetUserId = 'b82dadb1-4dc5-4b66-b347-a381715a0c58'; // Bella's ID
  
  console.log(`🎯 Processing user ID: ${targetUserId}`);

  try {
    // Step 1: Fetch and ingest ads (skip if fails)
    try {
      console.log('\n🚀 Step 1: Fetching competitor ads...');
      await runAllPlatforms(targetUserId);
    } catch (fetchError) {
      console.error('❌ Failed to fetch ads, continuing to summary...', fetchError);
    }

    // Step 2: Generate daily summary
    try {
      console.log('\n📊 Step 2: Generating daily summary...');
      await runDailySummary(targetUserId);
    } catch (summaryError) {
      console.error('❌ Failed to generate summary, continuing to AI insights...', summaryError);
    }

    // Step 3: Generate targeting intelligence
    try {
      console.log('\n🧠 Step 3: Generating AI targeting intelligence...');
      await generateTargetingIntel(targetUserId);
    } catch (aiError) {
      console.error('❌ Failed to generate AI insights', aiError);
    }

    console.log('\n✅ Pipeline execution completed');
  } catch (error) {
    console.error('❌ Fatal error in main process:', error);
    process.exit(1);
  }
}

// Run the engine
if (require.main === module) {
  main();
}

export { main };