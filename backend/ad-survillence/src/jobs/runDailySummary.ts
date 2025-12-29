import { supabase } from '../config/supabase';
import { logExecution } from '../db/logs.repo';

export async function runDailySummary(userId: string) {
  const startTime = Date.now();
  
  console.log(`📊 Generating daily summary for user: ${userId}`);

  try {
    // Call the PostgreSQL function
    const { data, error } = await supabase.rpc(
      'run_summary_metrics',
      { 
        user_id_input: userId,
        summary_date: new Date().toISOString().split('T')[0]
      }
    );

    if (error) {
      console.error('❌ SQL Function Error:', error);
      throw new Error(`Error running summary metrics: ${error.message}`);
    }

    if (data && data.length > 0) {
      const summaryData = data[0];
      
      console.log('📈 Summary Data Received:', {
        total_spend: summaryData.total_competitor_spend,
        total_impressions: summaryData.total_impressions,
        active_campaigns: summaryData.active_campaigns_count
      });

      // Try upsert with different approaches
      let insertError = null;
      
      // Approach 1: Try with onConflict
      try {
        const { error: error1 } = await supabase
          .from('summary_metrics')
          .upsert({
            user_id: summaryData.user_id,
            period_start_date: summaryData.period_start_date,
            period_end_date: summaryData.period_end_date,
            total_competitor_spend: summaryData.total_competitor_spend || 0,
            active_campaigns_count: summaryData.active_campaigns_count || 0,
            total_impressions: summaryData.total_impressions || 0,
            average_ctr: summaryData.average_ctr || 0,
            platform_distribution: summaryData.platform_distribution || '{}',
            top_performers: summaryData.top_performers || '[]',
            spend_by_industry: summaryData.spend_by_industry || '{}'
          }, {
            onConflict: 'user_id,period_start_date,period_end_date'
          })
          .select();
        insertError = error1;
      } catch (e) {
        console.log('⚠️ Upsert approach 1 failed, trying approach 2...');
      }

      // Approach 2: Delete then insert
      if (insertError) {
        console.log('🔄 Trying delete-then-insert approach...');
        
        // First delete existing record for today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        await supabase
          .from('summary_metrics')
          .delete()
          .eq('user_id', userId)
          .gte('period_start_date', todayStart.toISOString())
          .lte('period_end_date', todayEnd.toISOString());

        // Then insert new record
        const { error: error2 } = await supabase
          .from('summary_metrics')
          .insert({
            user_id: summaryData.user_id,
            period_start_date: summaryData.period_start_date,
            period_end_date: summaryData.period_end_date,
            total_competitor_spend: summaryData.total_competitor_spend || 0,
            active_campaigns_count: summaryData.active_campaigns_count || 0,
            total_impressions: summaryData.total_impressions || 0,
            average_ctr: summaryData.average_ctr || 0,
            platform_distribution: summaryData.platform_distribution || '{}',
            top_performers: summaryData.top_performers || '[]',
            spend_by_industry: summaryData.spend_by_industry || '{}'
          })
          .select();
        
        insertError = error2;
      }

      if (insertError) {
        console.error('❌ Final insert error:', insertError);
        throw new Error(`Error inserting summary metrics: ${insertError.message}`);
      }

      console.log(`✅ Daily summary saved for user: ${userId}`);
      
    } else {
      console.log(`📭 No data found for user ${userId} on this date`);
    }
  } catch (error) {
    console.error(`❌ Error in runDailySummary for user ${userId}:`, error);
    throw error;
  }
}