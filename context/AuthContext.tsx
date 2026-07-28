'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Replace with Supabase session check
    const stored = localStorage.getItem('course_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, _password: string) => {
    // TODO: Replace with: const { error } = await supabase.auth.signInWithPassword({ email, password })
    const mockUser: User = { id: crypto.randomUUID(), email, name: email.split('@')[0] }
    setUser(mockUser)
    localStorage.setItem('course_user', JSON.stringify(mockUser))
    return { error: null }
  }

  const signUp = async (email: string, _password: string, name: string) => {
    // TODO: Replace with: const { error } = await supabase.auth.signUp({ email, password })
    const mockUser: User = { id: crypto.randomUUID(), email, name }
    setUser(mockUser)
    localStorage.setItem('course_user', JSON.stringify(mockUser))
    return { error: null }
  }

  const signOut = async () => {
    // TODO: Replace with: await supabase.auth.signOut()
    setUser(null)
    localStorage.removeItem('course_user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
