import { describe, expect, it } from 'vitest';
import { validateAIResponse } from '../src/ai/schema';

describe('AI schema validation', () => {
  it('accepts valid payload', () => {
    const parsed = validateAIResponse({
      overallScore: 82,
      summary: 'Great progress',
      strengths: ['grammar'],
      improvements: ['pronunciation'],
      cefrLevel: 'B2'
    });

    expect(parsed.overallScore).toBe(82);
  });

  it('rejects invalid payload', () => {
    expect(() => validateAIResponse({ overallScore: 200 })).toThrow();
  });
});
