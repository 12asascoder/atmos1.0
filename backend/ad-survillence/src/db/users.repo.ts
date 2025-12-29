import { supabase } from '../config/supabase';

export interface User {
  user_id: string;
  name: string;
  email: string;
  is_active: boolean;
  industry: string | null;
  created_at: string;
}

export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, name, email, is_active, industry, created_at')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error(`❌ ERROR FETCHING USER ${userId}:`, error);
    return null;
  }

  return data;
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ 
      last_login: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error(`❌ ERROR UPDATING USER LAST LOGIN ${userId}:`, error);
    throw error;
  }
}