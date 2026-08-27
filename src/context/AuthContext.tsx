import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, requireSupabase } from '../lib/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const client = requireSupabase();
    let mounted = true;

    client.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    configured: isSupabaseConfigured,
    signIn: async (email, password) => {
      try {
        const { error } = await requireSupabase().auth.signInWithPassword({ email, password });
        return { error: error ? new Error(error.message) : null };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error('Unable to sign in.') };
      }
    },
    signUp: async (email, password) => {
      try {
        const { error } = await requireSupabase().auth.signUp({ email, password });
        return { error: error ? new Error(error.message) : null };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error('Unable to create account.') };
      }
    },
    signOut: async () => {
      try {
        const { error } = await requireSupabase().auth.signOut();
        return { error: error ? new Error(error.message) : null };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error('Unable to sign out.') };
      }
    },
  }), [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
