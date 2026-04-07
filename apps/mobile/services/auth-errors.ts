import { supabaseHost } from '@/lib/supabase';

const isNetworkError = (message: string) => {
  const normalized = message.toLowerCase();
  return normalized.includes('failed to fetch') || normalized.includes('network request failed');
};

export function getAuthErrorMessage(error: unknown, action: 'sign in' | 'sign up' | 'reset password') {
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');

  if (isNetworkError(message)) {
    return `Cannot ${action} because the app cannot reach Supabase at ${supabaseHost}. Check your internet or EXPO_PUBLIC_SUPABASE_URL, then restart Expo.`;
  }

  return message;
}
