export type Scenario = {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  is_premium: boolean;
  prompt: string;
};

export type Profile = {
  id: string;
  full_name?: string;
  level?: string;
  goals?: string[];
  onboarding_complete?: boolean;
  streak?: number;
  weak_areas?: string[];
};

export type EvaluationFeedback = {
  score: number;
  summary: string;
  strengths: string[];
  mistakes: Array<{ text: string; correction: string; reason: string }>;
  recommendations: string[];
};

export type HomeRecommendation = {
  scenario_id: string | null;
  slug: string;
  title: string;
  category: string;
  score: number;
};

export type WeeklyPracticeSummary = {
  minutes_practiced?: number;
  top_repeated_mistakes?: Array<{ mistake_key: string; count: number }>;
  best_category_score?: { category?: string; score?: number };
  weakest_category?: { category?: string; score?: number };
};
