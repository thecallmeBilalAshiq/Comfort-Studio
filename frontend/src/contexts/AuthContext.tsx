'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({ user: null, loading: true, login: async () => {}, register: async () => {}, logout: () => {} });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cs_token');
    if (token) {
      api.getMe().then(u => setUser(u)).catch(() => localStorage.removeItem('cs_token')).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user: u } = await api.login(email, password);
    localStorage.setItem('cs_token', token);
    setUser(u);
  };

  const register = async (name: string, email: string, password: string) => {
    const { token, user: u } = await api.register(name, email, password);
    localStorage.setItem('cs_token', token);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('cs_token');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
