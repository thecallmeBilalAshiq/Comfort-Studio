'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase-client';
import { api } from '@/lib/api';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (e: string, p: string) => Promise<void>;
  register: (n: string, e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  sendVerification: () => Promise<void>;
  checkVerificationStatus: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        localStorage.setItem('cs_token', session.access_token);
        
        api.getMe().then((dbUser) => {
          setUser({
            id: dbUser?.id || session.user.id,
            email: dbUser?.email || session.user.email,
            name: dbUser?.name || session.user.user_metadata?.name || '',
            isAdmin: !!dbUser?.isAdmin || session.user.email?.toLowerCase() === 'comfortstudiouk@gmail.com',
            emailVerified: session.user.email_confirmed_at ? true : false,
          });
        }).catch((err) => {
          console.warn('Failed to fetch DB user:', err);
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || '',
            isAdmin: session.user.email?.toLowerCase() === 'comfortstudiouk@gmail.com',
            emailVerified: session.user.email_confirmed_at ? true : false,
          });
        }).finally(() => {
          setLoading(false);
        });
      } else {
        localStorage.removeItem('cs_token');
        setUser(null);
        setLoading(false);
      }
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        localStorage.setItem('cs_token', session.access_token);
        
        try {
          const dbUser = await api.getMe();
          setUser({
            id: dbUser?.id || session.user.id,
            email: dbUser?.email || session.user.email,
            name: dbUser?.name || session.user.user_metadata?.name || '',
            isAdmin: !!dbUser?.isAdmin || session.user.email?.toLowerCase() === 'comfortstudiouk@gmail.com',
            emailVerified: session.user.email_confirmed_at ? true : false,
          });
        } catch (err) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || '',
            isAdmin: session.user.email?.toLowerCase() === 'comfortstudiouk@gmail.com',
            emailVerified: session.user.email_confirmed_at ? true : false,
          });
        }
      } else {
        localStorage.removeItem('cs_token');
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (e: string, p: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: e, password: p });
    if (error) throw error;
  };

  const register = async (n: string, e: string, p: string) => {
    const { error } = await supabase.auth.signUp({
      email: e,
      password: p,
      options: {
        data: { name: n }
      }
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const sendVerification = async () => {
    // Supabase handles email verification flow automatically on signUp if enabled
  };

  const checkVerificationStatus = async () => {
    const { data: { session } } = await supabase.auth.refreshSession();
    if (session?.user) {
      const emailConfirmed = !!session.user.email_confirmed_at;
      setUser((prev: any) => prev ? { ...prev, emailVerified: emailConfirmed } : null);
      return emailConfirmed;
    }
    return false;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, sendVerification, checkVerificationStatus, resetPassword }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

