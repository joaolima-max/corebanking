'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api'

export default function LoginPage() {
  const { login, isAuthenticated, isHydrating } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('admin@basspago.com.br')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isHydrating && isAuthenticated) router.replace('/dashboard')
  }, [isHydrating, isAuthenticated, router])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.replace('/dashboard')
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) setError('Credenciais inválidas.')
      else if (err instanceof Error && err.message === 'MFA_REQUIRED') setError('Conta requer MFA.')
      else setError('Não foi possível acessar o servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 380 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div
            style={{
              width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center',
              margin: '0 auto 12px', color: '#fff', fontWeight: 800, fontSize: 18,
              background: 'linear-gradient(150deg,var(--accent),#5B4BD6)',
            }}
          >
            B
          </div>
          <h1 style={{ fontSize: 20, margin: 0, letterSpacing: '-0.02em' }}>Bass Admin</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 12.5, margin: '4px 0 0' }}>Console Global · Ambiente Administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ padding: 22 }}>
          <label style={{ fontSize: 12, color: 'var(--text-2)' }}>E-mail</label>
          <input className="input" style={{ margin: '6px 0 14px' }} type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          <label style={{ fontSize: 12, color: 'var(--text-2)' }}>Senha</label>
          <input className="input" style={{ margin: '6px 0 6px' }} type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          {error && (
            <div role="alert" style={{ color: 'var(--neg)', fontSize: 12.5, margin: '10px 0 0' }}>{error}</div>
          )}
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
            type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
