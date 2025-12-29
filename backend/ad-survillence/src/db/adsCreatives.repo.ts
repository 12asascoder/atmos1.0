import { supabase } from '../config/supabase';

export async function insertAdCreative(input: {
  competitor_id: string;
  competitor_name: string; // ✅ ADD THIS
  platform: string;
  creative: string;
}) {
  const { data, error } = await supabase
    .from('ads_creatives')
    .insert({
      competitor_id: input.competitor_id,
      competitor_name: input.competitor_name,
      platform: input.platform,
      creative: input.creative
    })
    .select()
    .single();

  if (error) {
    console.error('❌ AD CREATIVE INSERT FAILED', error);
    throw error;
  }

  console.log('✅ AD CREATIVE SAVED', data.id);
  return data;
}
