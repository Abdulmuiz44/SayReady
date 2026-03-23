import { describe, expect, it } from 'vitest';
import { resolveProtectedRoute } from '../src/auth/guard';

describe('auth guard', () => {
  it('routes unauthenticated users to login', () => {
    expect(resolveProtectedRoute({ isAuthenticated: false, onboardingComplete: false })).toBe('login');
  });

  it('routes signed in users with incomplete onboarding', () => {
    expect(resolveProtectedRoute({ isAuthenticated: true, onboardingComplete: false })).toBe('onboarding');
  });

  it('routes fully ready users to home', () => {
    expect(resolveProtectedRoute({ isAuthenticated: true, onboardingComplete: true })).toBe('home');
  });
});
