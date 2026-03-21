import type { EnglishLevel, PrimaryGoal } from '../types/profile';

export interface RecommendationInput {
  englishLevel: EnglishLevel;
  primaryGoal: PrimaryGoal;
  consistencyDays: number;
  quizScore: number;
}

export const scoreUser = (input: RecommendationInput): number => {
  const levelWeight = {
    beginner: 0.8,
    intermediate: 1,
    advanced: 1.2
  }[input.englishLevel];

  const goalWeight = {
    travel: 1,
    career: 1.2,
    fluency: 1.1,
    exam: 1.3
  }[input.primaryGoal];

  const consistencyBonus = Math.min(input.consistencyDays, 30) / 30;
  return Number((input.quizScore * levelWeight * goalWeight + consistencyBonus * 10).toFixed(2));
};

export const recommendTrack = (input: RecommendationInput): 'foundation' | 'coach' | 'challenge' => {
  const score = scoreUser(input);
  if (score < 60) return 'foundation';
  if (score < 85) return 'coach';
  return 'challenge';
};
