import { supabase } from '@/lib/supabase';
import type { Scenario } from '@/types';

export async function listScenarios() {
  return supabase.from('scenarios').select('*').order('created_at', { ascending: false }).returns<Scenario[]>();
}

export async function getScenario(slug: string) {
  return supabase.from('scenarios').select('*').eq('slug', slug).single<Scenario>();
}
