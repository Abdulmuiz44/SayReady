import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export async function fetchProfile(userId: string) {
  return supabase.from('profiles').select('*').eq('id', userId).single<Profile>();
}

export async function upsertOnboarding(userId: string, profile: Partial<Profile>) {
  return supabase.from('profiles').upsert(
    {
      id: userId,
      ...profile,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'id',
    },
  );
}
