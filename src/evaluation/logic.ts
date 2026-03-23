import { validateAIResponse } from '../ai/schema';
import { scoreUser, type RecommendationInput } from '../utils/recommendation';

export interface EvaluationRequest {
  prompt: string;
  recommendationInput: RecommendationInput;
}

export const evaluateSubmission = (
  request: EvaluationRequest,
  aiPayload: unknown
): { aiScore: number; blendedScore: number } => {
  const parsed = validateAIResponse(aiPayload);
  const userScore = scoreUser(request.recommendationInput);
  const blendedScore = Number(((parsed.overallScore * 0.7) + (userScore * 0.3)).toFixed(2));

  return {
    aiScore: parsed.overallScore,
    blendedScore
  };
};
