import { supabase } from '../config/supabase';

/**
 * Upsert competitor with duplicate prevention for the same user
 */
export async function upsertCompetitor(name: string, userId: string) {
  if (!userId) {
    throw new Error('User ID is required to create/update a competitor');
  }

  const cleanName = name.trim();
  
  // First, check if competitor already exists for this user
  const { data: existing, error: findError } = await supabase
    .from('competitors')
    .select('id, name, is_active')
    .eq('name', cleanName)
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1) // ADD LIMIT 1
    .maybeSingle(); // Use maybeSingle instead of single

  if (findError && findError.code !== 'PGRST116') {
    console.error('❌ ERROR FINDING EXISTING COMPETITOR', findError);
    throw findError;
  }

  // If competitor already exists, return it
  if (existing) {
    console.log(`✅ COMPETITOR EXISTS: ${existing.name} (ID: ${existing.id})`);
    return existing;
  }

  // If not found, create new competitor
  const { data, error } = await supabase
    .from('competitors')
    .insert({
      name: cleanName,
      user_id: userId,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('❌ COMPETITOR INSERT FAILED', error);
    throw error;
  }

  console.log(`✅ COMPETITOR CREATED: ${data.name} (ID: ${data.id})`);
  return data;
}

/**
 * Get competitors for user with duplicate filtering
 */
export async function getCompetitorsByUser(userId: string) {
  const { data, error } = await supabase
    .from('competitors')
    .select('id, name, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ ERROR FETCHING USER COMPETITORS', error);
    throw error;
  }

  // Remove duplicates (case-insensitive)
  const uniqueCompetitors = removeDuplicates(data || []);
  
  console.log(`📊 Found ${uniqueCompetitors.length} unique competitors for user`);
  
  return uniqueCompetitors;
}

/**
 * Remove duplicate competitors (case-insensitive)
 */
function removeDuplicates(competitors: any[]) {
  const seen = new Set();
  const unique: any[] = [];

  for (const comp of competitors) {
    const key = comp.name.toLowerCase().trim();
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(comp);
    } else {
      console.log(`⚠️ Removing duplicate competitor: ${comp.name}`);
    }
  }

  return unique;
}

/**
 * Check if competitor already exists for user
 */
export async function competitorExists(name: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('competitors')
    .select('id')
    .eq('name', name.trim())
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('❌ ERROR CHECKING COMPETITOR', error);
    throw error;
  }

  return !!data;
}