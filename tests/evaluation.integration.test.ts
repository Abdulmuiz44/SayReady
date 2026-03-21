import { describe, expect, it } from 'vitest';
import { evaluateSubmission } from '../src/evaluation/logic';

describe('evaluation integration logic', () => {
  it('blends AI and user recommendation scores', () => {
    const result = evaluateSubmission(
      {
        prompt: 'Speak about your weekend',
        recommendationInput: {
          englishLevel: 'intermediate',
          primaryGoal: 'fluency',
          consistencyDays: 15,
          quizScore: 70
        }
      },
      {
        overallScore: 80,
        summary: 'Solid output',
        strengths: ['clarity'],
        improvements: ['vocabulary'],
        cefrLevel: 'B1'
      }
    );

    expect(result.aiScore).toBe(80);
    expect(result.blendedScore).toBe(81.35);
  });
});
