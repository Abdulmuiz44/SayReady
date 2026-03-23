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
