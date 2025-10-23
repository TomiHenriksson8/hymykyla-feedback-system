import React, { createContext, useContext, useMemo, ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

type User = { sub: string; role: 'admin' } | null
type Status = 'loading' | 'authenticated' | 'unauthenticated'

type AuthCtxType = {
  user: User
  status: Status
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

// --- React Context ---
const AuthCtx = createContext<AuthCtxType | null>(null)

// --- AuthProvider ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  // --- fetch session ---
  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch('/auth/me', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // <-- tärkeää evästeiden lähettämiseksi
      })
      if (res.status === 401) return null
      if (!res.ok) throw new Error('Failed to fetch session')
      const json = await res.json()
      return json.user ?? null
    },
    staleTime: 5 * 60_000,
    retry: false,
  })

  // --- login mutation ---
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // <-- tärkeää
      })
      if (!res.ok) throw new Error('Login failed')
      return res.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })

  // --- logout mutation ---
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include', // <-- tärkeää
      })
      if (!res.ok) throw new Error('Logout failed')
      return res.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })

  // --- context value ---
  const value: AuthCtxType = useMemo(() => {
    const status: Status = isLoading ? 'loading' : data ? 'authenticated' : 'unauthenticated'
    return {
      user: data ?? null,
      status,
      login: async (email, password) => {
        await loginMutation.mutateAsync({ email, password })
      },
      logout: async () => {
        await logoutMutation.mutateAsync()
      },
    }
  }, [data, isLoading, loginMutation, logoutMutation])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

// --- custom hook ---
export function useAuthCtx() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuthCtx must be used within <AuthProvider>')
  return ctx
}
