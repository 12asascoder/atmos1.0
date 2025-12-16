import { supabase } from './supabase';

export interface NewCompetitorInput {
  name: string;
  domain?: string;
  industry?: string;
  estimated_monthly_spend?: number;
  social_handles?: Record<string, string>;
}

export async function addCompetitor(input: NewCompetitorInput) {
  const { data, error } = await supabase!
    .from('competitors')
    .insert([
      {
        name: input.name,
        domain: input.domain || null,
        industry: input.industry || null,
        estimated_monthly_spend: input.estimated_monthly_spend ?? 0,
        social_handles: input.social_handles ?? {},
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
