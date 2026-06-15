'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, setUnauthorizedHandler } from './api'

interface User {
  email: string
  id?: string
}

interface AuthContextType {
  token: string | null
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isHydrating: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isHydrating, setIsHydrating] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('bass_token')
    localStorage.removeItem('bass_user_email')
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('bass_token')
    const storedEmail = localStorage.getItem('bass_user_email')
    if (stored) {
      setToken(stored)
      setUser({ email: storedEmail || '' })
    }
    setIsHydrating(false)
  }, [])

  // Register single-flight 401 handler in API client
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    })
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ accessToken: string; refreshToken: string; expiresIn: number }>(
      '/api/v1/auth/login',
      { email, password }
    )
    localStorage.setItem('bass_token', data.accessToken)
    localStorage.setItem('bass_user_email', email)
    setToken(data.accessToken)
    setUser({ email })
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token, isHydrating }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
