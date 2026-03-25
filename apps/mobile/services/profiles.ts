import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

function isMissingColumnError(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? '';
  return message.includes('column') && (message.includes('does not exist') || message.includes('could not find'));
}

export async function fetchProfile(userId: string) {
  const modern = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle<Profile>();
  if (modern.data || !isMissingColumnError(modern.error)) {
    return modern;
  }

  const legacy = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle<Profile>();
  return legacy;
}

export async function upsertOnboarding(userId: string, profile: Partial<Profile>) {
  const modern = await supabase.from('profiles').upsert(
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

  if (!modern.error || !isMissingColumnError(modern.error)) {
    return modern;
  }

  const legacyPayload = {
    user_id: userId,
    display_name: profile.full_name,
    skill_level: profile.level ?? 'beginner',
    updated_at: new Date().toISOString(),
  };

  return supabase.from('profiles').upsert(legacyPayload, {
    onConflict: 'user_id',
  });
}
