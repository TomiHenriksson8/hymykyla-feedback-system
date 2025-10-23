import { createContext, useContext, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, postLogin, postLogout } from '../lib/auth';

type User = { sub: string; role: 'admin' } | null;
type Status = 'loading' | 'authenticated' | 'unauthenticated';

type Ctx = {
  user: User;
  status: Status;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  // Session query (single source of truth)
  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const me = await getMe(); // null if 401
      return me?.user ?? null;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      postLogin(email, password),
    onSuccess: async () => {
      // refetch session after successful login
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => postLogout(),
    onSuccess: async () => {
      // drop cached session
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const value = useMemo<Ctx>(() => {
    const status: Status = isLoading ? 'loading' : data ? 'authenticated' : 'unauthenticated';
    return {
      user: data ?? null,
      status,
      login: async (email, password) => {
        await loginMutation.mutateAsync({ email, password });
      },
      logout: async () => {
        await logoutMutation.mutateAsync();
      },
    };
  }, [data, isLoading, loginMutation, logoutMutation]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuthCtx() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuthCtx must be used within <AuthProvider>');
  return ctx;
}
