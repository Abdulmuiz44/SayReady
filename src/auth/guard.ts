export interface AuthState {
  isAuthenticated: boolean;
  onboardingComplete: boolean;
}

export type Route = 'login' | 'onboarding' | 'home';

export const resolveProtectedRoute = (auth: AuthState): Route => {
  if (!auth.isAuthenticated) return 'login';
  if (!auth.onboardingComplete) return 'onboarding';
  return 'home';
};
