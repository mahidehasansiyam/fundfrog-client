'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  role: 'supporter' | 'creator' | 'admin';
  credits: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string, photoURL?: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/auth/me')
      .then((res) => {
        if (res?.user) setUser(res.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post('/api/auth/login', { email, password });
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, role: string, photoURL?: string) => {
      const data = await api.post('/api/auth/register', { name, email, password, role, photoURL });
      setUser(data.user);
    },
    [],
  );

  const googleLogin = useCallback(async (accessToken: string) => {
    const data = await api.post('/api/auth/google', { access_token: accessToken });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout', {});
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me');
      if (res?.user) setUser(res.user);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
