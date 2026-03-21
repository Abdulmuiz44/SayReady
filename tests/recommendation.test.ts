import { describe, expect, it } from 'vitest';
import { recommendTrack, scoreUser } from '../src/utils/recommendation';

describe('recommendation helpers', () => {
  it('scores user with consistency bonus', () => {
    const score = scoreUser({
      englishLevel: 'intermediate',
      primaryGoal: 'career',
      consistencyDays: 10,
      quizScore: 50
    });

    expect(score).toBe(63.33);
  });

  it('maps score to a track', () => {
    expect(recommendTrack({
      englishLevel: 'beginner',
      primaryGoal: 'travel',
      consistencyDays: 0,
      quizScore: 40
    })).toBe('foundation');
  });
});
