import { supabase } from '@/lib/supabase';

export type RecommendedScenario = {
  scenario_id: string | null;
  slug: string;
  title: string;
  category: string;
  score: number;
  breakdown?: {
    primary_goal_match?: number;
    under_practiced_category_bonus?: number;
    repeated_mistake_relevance_bonus?: number;
  };
  context?: {
    under_practiced_categories?: string[];
    repeated_mistake_keys?: string[];
    is_premium_user?: boolean;
  };
};

export type WeeklySummary = {
  minutes_practiced?: number;
  top_repeated_mistakes?: Array<{ mistake_key: string; count: number }>;
  best_category_score?: { category?: string; score?: number };
  weakest_category?: { category?: string; score?: number };
};

export type RecommendationPayload = {
  recommendation?: {
    selected?: {
      scenario?: RecommendedScenario;
      score?: number;
      breakdown?: RecommendedScenario['breakdown'];
    } | null;
  } | null;
  weekly_summary?: WeeklySummary | null;
};

export async function getTodayRecommendation(primaryGoal?: string) {
  return supabase.functions.invoke<RecommendationPayload>('get-today-recommendation', {
    body: primaryGoal ? { primary_goal: primaryGoal } : {},
  });
}
