import { supabase } from '@/lib/supabase';

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signUp = (email: string, password: string) =>
  supabase.auth.signUp({ email, password });

export const signOut = () => supabase.auth.signOut();

export const requestReset = (email: string) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT,
  });
