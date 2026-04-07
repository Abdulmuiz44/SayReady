import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { fetchProfile } from '@/services/profiles';
import { trackError, trackEvent } from '@/services/telemetry';
import type { Profile } from '@/types';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  reloadProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadProfile = async () => {
    if (!user?.id) {
      setProfile(null);
      return;
    }

    try {
      const { data } = await fetchProfile(user.id);
      setProfile(data ?? null);
    } catch (error) {
      setProfile(null);
      void trackError('profile_reload_failed', error, { user_id: user.id });
    }
  };

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        void trackEvent({ eventName: 'auth_bootstrap', metadata: { has_session: Boolean(data.session) } });
      })
      .catch((error) => {
        if (!active) return;
        setSession(null);
        setUser(null);
        void trackError('auth_bootstrap_failed', error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      void trackEvent({
        eventName: 'auth_state_change',
        metadata: { has_session: Boolean(nextSession), event: _event },
      });
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    void reloadProfile();
  }, [user?.id]);

  const value = useMemo(
    () => ({ user, session, loading, profile, setProfile, reloadProfile }),
    [user, session, loading, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
