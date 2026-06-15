'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api'

export default function LoginPage() {
  const { login, isAuthenticated, isHydrating } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isHydrating && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isHydrating, isAuthenticated, router])

  if (isHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Carregando...</div>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.replace('/dashboard')
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setError('Credenciais inválidas. Verifique seu e-mail e senha.')
      } else if (err instanceof TypeError) {
        setError('Erro de conexão. Verifique sua rede e tente novamente.')
      } else if (err instanceof ApiError && err.status === 429) {
        setError(err.message)
      } else if (err instanceof Error && err.message === 'MFA_REQUIRED') {
        setError('Esta conta requer autenticação de dois fatores (MFA). Contate o administrador.')
      } else {
        setError('Não foi possível acessar o servidor. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-bass-500 rounded-xl mb-4">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Bass Financial Core</h1>
          <p className="text-slate-500 mt-1 text-sm">Plataforma de Core Banking Moderno</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Entrar na plataforma</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@basspago.com.br"
                required
                autoComplete="email"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bass-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                maxLength={1024}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bass-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-bass-500 hover:bg-bass-600 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Bass Financial Core · Ambiente Seguro · TLS 1.3
        </p>
      </div>
    </div>
  )
}
