import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: any;
  user: any;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  const configured = !!supabase;

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error("Supabase not configured") };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };
  const signUp = async (email: string, password: string) => {
    if (!supabase) return { error: new Error("Supabase not configured") };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  };
  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };
  const resetPasswordForEmail = async (email: string) => {
    if (!supabase) return { error: new Error("Supabase not configured") };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };
  const updatePassword = async (password: string) => {
    if (!supabase) return { error: new Error("Supabase not configured") };
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error as Error | null };
  };

  const user = session?.user ?? null;

  const value = {
    configured,
    loading,
    session,
    user,
    signIn,
    signUp,
    signOut,
    resetPasswordForEmail,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
