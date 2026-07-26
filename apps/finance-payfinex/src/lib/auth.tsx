'use client'

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { api, setUnauthorizedHandler } from './api'

interface AuthCtx {
  token: string | null
  email: string | null
  isAuthenticated: boolean
  isHydrating: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [isHydrating, setHydrating] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('bass_token'); localStorage.removeItem('bass_user_email')
    setToken(null); setEmail(null)
    if (typeof window !== 'undefined') window.location.href = '/login'
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => logout())
    const t = localStorage.getItem('bass_token')
    const e = localStorage.getItem('bass_user_email')
    if (t) { setToken(t); setEmail(e) }
    setHydrating(false)
  }, [logout])

  const login = useCallback(async (em: string, password: string) => {
    const data = await api.post<{ requiresMfa?: boolean; tokens?: { accessToken: string } }>(
      '/api/v1/auth/login', { email: em, password },
    )
    if (data.requiresMfa) throw new Error('MFA_REQUIRED')
    const at = data.tokens?.accessToken
    if (!at) throw new Error('NO_TOKEN')
    localStorage.setItem('bass_token', at); localStorage.setItem('bass_user_email', em)
    setToken(at); setEmail(em)
  }, [])

  return (
    <Ctx.Provider value={{ token, email, isAuthenticated: !!token, isHydrating, login, logout }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used within AuthProvider')
  return c
}
