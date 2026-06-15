'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from './api'

interface User {
  email: string
}

interface AuthContextType {
  token: string | null
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('bass_token')
    const storedEmail = localStorage.getItem('bass_user_email')
    if (stored) {
      setToken(stored)
      setUser({ email: storedEmail || '' })
    }
  }, [])

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

  const logout = useCallback(() => {
    localStorage.removeItem('bass_token')
    localStorage.removeItem('bass_user_email')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
