'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

const NAV = [
  { label: 'Início', href: '/dashboard', active: true },
  { label: 'Receber (PIX)', tag: 'PIX' },
  { label: 'Enviar dinheiro' },
  { label: 'Conversão & FX' },
  { label: 'Saldos & Wallets' },
  { label: 'Extrato' },
  { label: 'Developers' },
  { label: 'Verificação (KYC)', tag: '✓' },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isHydrating, email, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isHydrating && !isAuthenticated) router.replace('/login')
  }, [isHydrating, isAuthenticated, router])

  if (isHydrating || !isAuthenticated) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}>Carregando…</div>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '244px 1fr', minHeight: '100vh' }}>
      <aside style={{ borderRight: '1px solid var(--border-soft)', background: 'var(--surface)', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '18px 18px 6px' }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', fontWeight: 800, color: '#07120e', background: 'linear-gradient(135deg,var(--accent),#1FA588)' }}>A</div>
          <div><b style={{ fontSize: 15 }}>Aurora Pay</b><span style={{ display: 'block', fontSize: 11, color: 'var(--text-3)' }}>powered by Bass</span></div>
        </div>
        <div className="chip acc" style={{ margin: '8px 18px', width: 'max-content', textTransform: 'uppercase', letterSpacing: '.06em' }}>● Ambiente do Cliente</div>
        <nav style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map((n) => (
            <a key={n.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: n.active ? 'var(--text)' : 'var(--text-2)', background: n.active ? 'var(--accent-dim)' : 'transparent' }}>
              {n.label}
              {n.tag && <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 6px', borderRadius: 20, background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>{n.tag}</span>}
            </a>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', padding: 14, borderTop: '1px solid var(--border-soft)', fontSize: 11, color: 'var(--text-3)' }}>
          <div style={{ color: 'var(--text-2)', fontSize: 12, marginBottom: 6 }}>{email}</div>
          <button className="btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={logout}>Sair</button>
        </div>
      </aside>
      <main style={{ minWidth: 0, padding: '22px 24px 60px', maxWidth: 1240 }}>{children}</main>
    </div>
  )
}
