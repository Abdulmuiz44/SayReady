import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL.');
}

if (!supabaseAnonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabaseHost = new URL(supabaseUrl).host;

const auth =
  Platform.OS === 'web'
    ? {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      }
    : {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth,
});
