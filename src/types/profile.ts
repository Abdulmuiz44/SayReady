export type EnglishLevel = 'beginner' | 'intermediate' | 'advanced';
export type PrimaryGoal = 'travel' | 'career' | 'fluency' | 'exam';

export interface UserProfile {
  id: string;
  englishLevel: EnglishLevel;
  primaryGoal: PrimaryGoal;
  subscriptionActive: boolean;
}
