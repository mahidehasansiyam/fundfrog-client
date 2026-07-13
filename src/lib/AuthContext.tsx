'use client';

import { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { authClient } from '@/lib/auth-client';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: 'supporter' | 'creator' | 'admin';
  credits: number;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string, photoURL?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toUser(sessionUser: Record<string, unknown> | undefined): User | null {
  if (!sessionUser) return null;
  return {
    id: sessionUser.id as string,
    name: sessionUser.name as string,
    email: sessionUser.email as string,
    image: sessionUser.image as string | null | undefined,
    role: (sessionUser.role as User['role']) ?? 'supporter',
    credits: (sessionUser.credits as number) ?? 0,
    photoURL: ((sessionUser.photoURL as string) || (sessionUser.image as string) || '') as string,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending, refetch } = authClient.useSession();

  const user = useMemo(() => toUser(session?.user as Record<string, unknown> | undefined), [session]);
  const loading = isPending;

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await authClient.signIn.email({ email, password });
    if (error) throw new Error(error.message || 'Login failed');
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, role: string, photoURL?: string) => {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
        role,
        image: photoURL,
      } as never);
      if (error) throw new Error(error.message || 'Registration failed');
    },
    [],
  );

  const logout = useCallback(async () => {
    await authClient.signOut();
  }, []);

  const refreshUser = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
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
